import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import net from 'net';
import { CONFIG } from '../config.js';
import { dbService } from '../services/dbService.js';
import { generateMFAOTP, verifyMFAOTP, refreshAccessToken, hashPassword, verifyPassword } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';
import { getFrozenUntilMs, isAccountFrozen } from '../utils/accountFreeze.js';

const router = express.Router();
const loginChallenges = new Map();

// Demo-only employee credentials. Keep this server-side so the browser cannot
// authenticate an employee by submitting only a user ID.
const DEMO_EMPLOYEE_CREDENTIALS = {
  'pol-101': { userId: 'USR-POL-101', password: 'Vikram@2026' },
  'pol-102': { userId: 'USR-POL-102', password: 'Bhir@2026' },
  'pol-103': { userId: 'USR-POL-103', password: 'Asha@2026' },
  'sup-606': { userId: 'USR-SUP-606', password: 'Supervisor@2026' },
  'for-202': { userId: 'USR-FOR-202', password: 'Sunita@2026' },
  'pros-303': { userId: 'USR-PRO-303', password: 'Rajesh@2026' },
  'jud-404': { userId: 'USR-JUD-404', password: 'Justice@2026' },
  'aud-505': { userId: 'USR-AUD-505', password: 'Anil@2026' }
};

// Demo-only IT administrator credentials; validate exclusively on the server.
const DEMO_IT_ADMIN_CREDENTIALS = {
  it_admin1: { userId: 'USR-IT-001', password: 'Admin@2026', secretCode: 'IT-SECRET-1029' },
  it_admin2: { userId: 'USR-IT-002', password: 'Meera@2026', secretCode: 'IT-SECRET-2048' }
};

function frozenAccountMessage(user) {
  const until = getFrozenUntilMs(user?.frozenUntil);
  return isAccountFrozen(user)
    ? `This account is temporarily frozen after a security incident. Try again after ${new Date(until).toLocaleString()}.`
    : null;
}

// GET /api/auth/users - List available personas for authentication
router.get('/users', (req, res) => {
  const users = dbService.getAllUsers();
  res.json({ users });
});

// Prototype MFA challenges are only created after valid portal credentials and are bound to a one-time login challenge.
router.post('/verify-login-otp', (req, res) => {
  const { challengeId, otp } = req.body;
  const challenge = loginChallenges.get(String(challengeId || ''));
  if (!challenge || challenge.expiresAt < Date.now()) {
    loginChallenges.delete(String(challengeId || ''));
    return res.status(401).json({ error: 'LOGIN_CHALLENGE_EXPIRED', message: 'Sign-in challenge expired. Enter your credentials again.' });
  }
  try {
    const tokenRes = verifyMFAOTP(challenge.userId, otp);
    loginChallenges.delete(challengeId);
    res.json({ message: 'OTP verified. Sign-in complete.', token: tokenRes.accessToken, ...tokenRes });
  } catch (err) {
    res.status(401).json({ error: 'MFA_VERIFICATION_FAILED', message: err.message });
  }
});

// POST /api/auth/refresh - Renew access token using refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'MISSING_REFRESH_TOKEN', message: 'refreshToken is required' });
  }

  try {
    const tokenRes = refreshAccessToken(refreshToken);
    res.json({ message: 'Access token successfully renewed', ...tokenRes });
  } catch (err) {
    res.status(401).json({ error: 'REFRESH_FAILED', message: err.message });
  }
});

// POST /api/auth/login - Persona authentication & switching with strict Clearance Level Hierarchy guard
router.post('/login', async (req, res) => {
  const { username, password, secretCode, portal } = req.body;
  if (!['IT_ADMIN', 'EMPLOYEE'].includes(portal)) return res.status(400).json({ error: 'PORTAL_REQUIRED', message: 'Choose IT_ADMIN or EMPLOYEE portal.' });
  let targetUser;

  if (portal === 'IT_ADMIN') {
    const credentials = DEMO_IT_ADMIN_CREDENTIALS[String(username || '').trim().toLowerCase()];
    if (!credentials || typeof password !== 'string' || password !== credentials.password || typeof secretCode !== 'string' || secretCode !== credentials.secretCode) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'IT Admin username, password, or secret code is incorrect.' });
    }
    targetUser = dbService.getUserById(credentials.userId);
  } else {
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const credentials = DEMO_EMPLOYEE_CREDENTIALS[normalizedUsername];
    if (credentials) {
      if (typeof password !== 'string' || password !== credentials.password) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Employee ID or password is incorrect.' });
      targetUser = dbService.getUserById(credentials.userId);
    } else {
      targetUser = dbService.getUserByUsername(normalizedUsername);
      if (!targetUser?.passwordHash || !targetUser?.passwordSalt || typeof password !== 'string' || !verifyPassword(password, targetUser.passwordSalt, targetUser.passwordHash)) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Employee ID or password is incorrect.' });
      }
    }
  }

  if (!targetUser) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Username or password is incorrect.' });
  }
  const frozenMessage = frozenAccountMessage(targetUser);
  if (frozenMessage) return res.status(423).json({ error: 'ACCOUNT_FROZEN', message: frozenMessage });
  if (portal === 'IT_ADMIN' && targetUser.systemRole !== 'IT_ADMIN') return res.status(403).json({ error: 'PORTAL_ROLE_MISMATCH', message: 'Select the dedicated IT Admin identity for the read-only system portal.' });
  if (portal === 'EMPLOYEE' && targetUser.systemRole === 'IT_ADMIN') return res.status(403).json({ error: 'PORTAL_ROLE_MISMATCH', message: 'IT Admin identities must use the read-only system portal.' });

  // Strict Clearance Level Hierarchy Rule:
  // Lower clearance level users CANNOT switch up to higher clearance level personas.
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const callerToken = authHeader.split(' ')[1];
      const callerPayload = jwt.verify(callerToken, CONFIG.JWT_SECRET);
      const caller = dbService.getUserById(callerPayload.id);
      const callerPortal = caller?.systemRole === 'IT_ADMIN' ? 'IT_ADMIN' : 'EMPLOYEE';
      if (caller && callerPortal !== portal) return res.status(403).json({ error: 'PORTAL_SWITCH_DENIED', message: 'Sign out before choosing a different access portal.' });
      if (callerPortal === 'IT_ADMIN' && targetUser.id !== caller.id) return res.status(403).json({ error: 'READ_ONLY_ADMIN', message: 'IT Admin cannot switch personas.' });
      
      if (callerPayload && callerPayload.clearanceLevel) {
        if (targetUser.clearanceLevel > callerPayload.clearanceLevel) {
          return res.status(403).json({
            error: 'FORBIDDEN_CLEARANCE_PRIVILEGE_ESCALATION',
            message: `Access Denied: Level ${callerPayload.clearanceLevel} persona cannot switch up to higher Level ${targetUser.clearanceLevel} persona (${targetUser.name}). Privilege escalation prohibited!`
          });
        }
      }
    } catch (err) {
      console.warn('[Auth Middleware Warning] Token check failed:', err.message);
    }
  }

  const otpRes = generateMFAOTP(targetUser.id);
  const challengeId = crypto.randomUUID();
  loginChallenges.set(challengeId, { userId: targetUser.id, expiresAt: Date.now() + otpRes.expiresInSeconds * 1000 });
  res.json({
    message: `Credentials accepted for ${targetUser.name}. Enter the prototype MFA code to finish signing in.`,
    challengeId,
    expiresInSeconds: otpRes.expiresInSeconds,
    displayName: targetUser.name
  });
});

router.post('/register-user', authenticateToken, (req, res) => {
  if (req.user.systemRole !== 'IT_ADMIN') return res.status(403).json({ error: 'IT_ADMIN_REQUIRED', message: 'Only IT Admin can register an employee.' });
  const { employeeId, name, contact, computerIp, designation, policeStation, workLocation, role, assignedCases = [] } = req.body;
  const cleanId = String(employeeId || '').trim().toUpperCase();
  const cleanName = String(name || '').trim();
  const cleanContact = String(contact || '').trim();
  const cleanIp = String(computerIp || '').trim();
  if (!cleanId || !cleanName || !cleanContact || !cleanIp) return res.status(400).json({ error: 'REQUIRED_FIELDS', message: 'Employee ID, full name, contact detail, and assigned computer IP are required.' });
  if (!net.isIP(cleanIp)) return res.status(400).json({ error: 'INVALID_COMPUTER_IP', message: 'Enter a valid IPv4 or IPv6 address for the assigned computer.' });
  const db = dbService.readDB();
  if (db.users.some(user => String(user.username || '').toLowerCase() === cleanId.toLowerCase() || String(user.employeeId || '').toLowerCase() === cleanId.toLowerCase())) return res.status(409).json({ error: 'EMPLOYEE_ID_IN_USE', message: 'That employee ID is already registered.' });
  if (db.users.some(user => user.assignedIp === cleanIp)) return res.status(409).json({ error: 'IP_IN_USE', message: 'That computer IP is already assigned to a user.' });
  const allowedRoles = ['POLICE_INVESTIGATOR', 'FORENSIC_SPECIALIST', 'PUBLIC_PROSECUTOR'];
  const userRole = allowedRoles.includes(role) ? role : 'POLICE_INVESTIGATOR';
  const departmentByRole = { POLICE_INVESTIGATOR: ['LEO', 'Special Crime Branch - Central Police'], FORENSIC_SPECIALIST: ['FOR', 'State Central Forensic Science Laboratory'], PUBLIC_PROSECUTOR: ['PROS', 'Directorate of Prosecution'] };
  const [department, departmentName] = departmentByRole[userRole];
  const allowedCases = Array.isArray(assignedCases) ? assignedCases.filter(caseId => db.cases.some(item => item.id === caseId)) : [];
  const starterPassword = `SC-${crypto.randomBytes(5).toString('hex')}!`;
  const { salt: passwordSalt, hash: passwordHash } = hashPassword(starterPassword);
  const userId = `USR-EMP-${crypto.randomUUID()}`;
  const user = {
    id: userId, employeeId: cleanId, username: cleanId, name: cleanName, contact: cleanContact, assignedIp: cleanIp,
    role: userRole, roleTitle: String(designation || '').trim() || userRole.replaceAll('_', ' '), supervisorId: 'USR-JUD-404',
    department, departmentName, policeStation: String(policeStation || '').trim(), workLocation: String(workLocation || '').trim(),
    clearanceLevel: 3, systemRole: 'EMPLOYEE', assignedCases: allowedCases, passwordSalt, passwordHash
  };
  db.users.push(user);
  dbService.writeDB(db);
  const { privateKey, passwordHash: _hash, passwordSalt: _salt, ...publicUser } = user;
  res.status(201).json({ message: 'Employee registered. Share the temporary password with the employee securely.', user: publicUser, temporaryPassword: starterPassword });
});

// GET /api/auth/me - Profile verification
router.get('/me', authenticateToken, (req, res) => {
  const { privateKey, passwordHash, passwordSalt, ...userPublic } = dbService.getUserWithPrivateKey(req.user.id);
  res.json({ user: userPublic });
});

export default router;
