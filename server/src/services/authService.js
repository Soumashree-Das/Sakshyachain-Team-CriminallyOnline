import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { dbService } from './dbService.js';
import { ledgerService } from './ledgerService.js';
import { isAccountFrozen } from '../utils/accountFreeze.js';

// In-Memory store for MFA OTP states (userId -> { hashedOTP, expiresAt, attempts })
const mfaSessionStore = new Map();
const DEMO_MFA_OTP = '246810';

/**
 * PBKDF2 Password Hashing (100,000 iterations, 32-byte salt)
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

/**
 * Starts a 6-digit prototype MFA challenge with 120s TTL
 */
export function generateMFAOTP(userId) {
  const user = dbService.getUserById(userId);
  if (!user) throw new Error('User not found');
  if (isAccountFrozen(user)) throw new Error('Account frozen after a security incident.');

  const hashedOTP = crypto.createHash('sha256').update(DEMO_MFA_OTP).digest('hex');
  const expiresAt = Date.now() + CONFIG.MFA_OTP_TTL_SECONDS * 1000;

  mfaSessionStore.set(userId, {
    hashedOTP,
    expiresAt,
    attempts: 0,
    lockedUntil: 0
  });

  // Log OTP Generation event on Audit DAG
  ledgerService.addBlock({
    action: 'MFA_OTP_GENERATED',
    actorId: user.id,
    actorName: user.name,
    caseId: 'AUTH-MFA',
    docId: 'MFA-SESSION',
    docHash: hashedOTP,
    details: { ttlSeconds: CONFIG.MFA_OTP_TTL_SECONDS }
  });

  return { expiresInSeconds: CONFIG.MFA_OTP_TTL_SECONDS };
}

/**
 * Verifies MFA OTP submission with 3-attempt lockout enforcement & constant-time comparison
 */
export function verifyMFAOTP(userId, inputOTP) {
  const user = dbService.getUserById(userId);
  if (!user) throw new Error('User not found');
  if (isAccountFrozen(user)) throw new Error('Account frozen after a security incident.');

  const mfaSession = mfaSessionStore.get(userId);
  if (!mfaSession) {
    throw new Error('No active MFA OTP request. Please request a new OTP code.');
  }

  // Check Lockout
  if (Date.now() < mfaSession.lockedUntil) {
    const remainingSecs = Math.ceil((mfaSession.lockedUntil - Date.now()) / 1000);
    throw new Error(`Account locked due to 3 failed OTP attempts. Try again in ${remainingSecs}s.`);
  }

  // Check Expiry (120s TTL)
  if (Date.now() > mfaSession.expiresAt) {
    mfaSessionStore.delete(userId);
    throw new Error('MFA OTP has expired (120s TTL exceeded). Please request a new OTP code.');
  }

  const inputHash = crypto.createHash('sha256').update(inputOTP.toString().trim()).digest('hex');

  const bufInput = Buffer.from(inputHash, 'hex');
  const bufExpected = Buffer.from(mfaSession.hashedOTP, 'hex');

  const isMatch = bufInput.length === bufExpected.length && crypto.timingSafeEqual(bufInput, bufExpected);

  if (!isMatch) {
    mfaSession.attempts += 1;
    if (mfaSession.attempts >= CONFIG.MFA_MAX_ATTEMPTS) {
      mfaSession.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 Minute Lockout
      
      ledgerService.addBlock({
        action: 'MFA_LOCKOUT_TRIGGERED',
        actorId: user.id,
        actorName: user.name,
        caseId: 'AUTH-MFA',
        docId: 'LOCKOUT',
        docHash: 'MFA_LOCKOUT',
        details: { attempts: mfaSession.attempts, lockoutMinutes: 15 }
      });

      throw new Error('Too many failed OTP attempts (3/3). Account locked for 15 minutes.');
    }

    mfaSessionStore.set(userId, mfaSession);
    const attemptsLeft = CONFIG.MFA_MAX_ATTEMPTS - mfaSession.attempts;
    throw new Error(`Invalid OTP code. ${attemptsLeft} attempt(s) remaining before lockout.`);
  }

  // OTP Verified Successfully!
  mfaSessionStore.delete(userId);

  ledgerService.addBlock({
    action: 'MFA_OTP_VERIFIED',
    actorId: user.id,
    actorName: user.name,
    caseId: 'AUTH-MFA',
    docId: 'MFA-SUCCESS',
    docHash: 'VERIFIED',
    details: { authStatus: 'MFA_SUCCESS' }
  });

  return issueTokens(user);
}

/**
 * Issues 15-min Access JWT and 8-hr Refresh JWT
 */
export function issueTokens(user) {
  const payload = {
    id: user.id,
    name: user.name,
    role: user.role,
    department: user.department,
    clearanceLevel: user.clearanceLevel
  };

  const accessToken = jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: CONFIG.ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: user.id }, CONFIG.JWT_REFRESH_SECRET, { expiresIn: CONFIG.REFRESH_TOKEN_EXPIRY });

  const { privateKey, passwordHash, passwordSalt, ...userPublic } = dbService.getUserWithPrivateKey(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: '15m',
    user: userPublic
  };
}

/**
 * Renews access token using valid Refresh Token
 */
export function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, CONFIG.JWT_REFRESH_SECRET);
    const user = dbService.getUserById(decoded.id);
    if (!user) throw new Error('User not found');
    if (isAccountFrozen(user)) throw new Error('Account frozen after a security incident');
    return issueTokens(user);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
}
