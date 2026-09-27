import { dbService } from './dbService.js';
import { ledgerService } from './ledgerService.js';
import { CONFIG } from '../config.js';

// In-Memory store for Break-Glass Grants (requestId -> grantObj)
const emergencyGrants = new Map();

class BreakGlassService {
  /**
   * Request Break-Glass Emergency Access
   */
  requestEmergencyAccess({ userId, caseId, reason }) {
    const user = dbService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const requestId = `BG-REQ-${Date.now().toString().slice(-5)}`;
    const requestObj = {
      id: requestId,
      userId,
      userName: user.name,
      userDepartment: user.department,
      supervisorId: user.supervisorId,
      caseId,
      reason,
      status: 'PENDING_APPROVAL',
      dateRequested: new Date().toISOString(),
      expiresAt: null
    };

    emergencyGrants.set(requestId, requestObj);

    // Audit Logging & Real-Time Alert Dispatch
    ledgerService.addBlock({
      action: 'EMERGENCY_ACCESS_REQUESTED',
      actorId: user.id,
      actorName: user.name,
      caseId,
      docId: 'BREAK-GLASS',
      docHash: 'EMERGENCY_REQ',
      details: { requestId, reason }
    });

    dbService.addSecurityAlert({
      title: 'Break-Glass Emergency Protocol Triggered',
      severity: 'HIGH',
      category: 'EMERGENCY_ACCESS',
      actor: `${user.username} (${user.name})`,
      docId: caseId,
      details: `30-minute Emergency Access requested for case ${caseId} under Justification: "${reason}".`
    });

    return requestObj;
  }

  /**
   * Supervisor Approves Emergency Access (Time-Boxed 30-Minute Grant)
   */
  approveEmergencyAccess({ requestId, supervisorId = 'USR-JUD-404' }) {
    const requestObj = emergencyGrants.get(requestId);
    if (!requestObj) throw new Error('Emergency request not found');
    if (requestObj.userId === supervisorId) throw new Error('A requester cannot approve their own break-glass request');
    if (requestObj.status !== 'PENDING_APPROVAL') throw new Error('This break-glass request is no longer pending approval');
    if (requestObj.supervisorId !== supervisorId) throw new Error('Only the requester’s designated employee supervisor can approve this request');

    const supervisor = dbService.getUserById(supervisorId);
    if (!supervisor || supervisor.role !== 'SUPERVISOR') throw new Error('Only a designated employee supervisor can approve break-glass access');

    const grantDurationMs = CONFIG.BREAK_GLASS_GRANT_MINUTES * 60 * 1000;
    const expiresAtMs = Date.now() + grantDurationMs;

    requestObj.status = 'ACTIVE_GRANT';
    requestObj.approvedBy = supervisor ? supervisor.name : 'Chief Magistrate';
    requestObj.dateApproved = new Date().toISOString();
    requestObj.expiresAtMs = expiresAtMs;
    requestObj.expiresAt = new Date(expiresAtMs).toISOString();

    emergencyGrants.set(requestId, requestObj);

    // Audit Logging
    ledgerService.addBlock({
      action: 'EMERGENCY_ACCESS_GRANTED',
      actorId: requestObj.userId,
      actorName: requestObj.userName,
      caseId: requestObj.caseId,
      docId: 'BREAK-GLASS',
      docHash: 'GRANT_ACTIVE',
      details: {
        requestId,
        approvedBy: requestObj.approvedBy,
        durationMinutes: CONFIG.BREAK_GLASS_GRANT_MINUTES,
        expiresAt: requestObj.expiresAt
      }
    });

    return requestObj;
  }

  /**
   * Checks if user has an active, non-expired Break-Glass Grant for caseId
   */
  hasActiveBreakGlassGrant(userId, caseId) {
    for (const [id, grant] of emergencyGrants.entries()) {
      if ((userId == null || grant.userId === userId) && grant.status === 'ACTIVE_GRANT') {
        if (caseId && grant.caseId !== caseId) continue;
        if (Date.now() < grant.expiresAtMs) {
          return grant;
        } else {
          // Expired
          grant.status = 'EXPIRED';
          emergencyGrants.set(id, grant);
          
          ledgerService.addBlock({
            action: 'EMERGENCY_ACCESS_EXPIRED',
            actorId: userId,
            actorName: grant.userName,
            caseId: grant.caseId,
            docId: 'BREAK-GLASS',
            docHash: 'GRANT_EXPIRED',
            details: { requestId: grant.id }
          });
        }
      }
    }
    return null;
  }

  /**
   * Returns active grants for a user with remaining seconds
   */
  getActiveGrantsForUser(userId) {
    const active = [];
    for (const [id, grant] of emergencyGrants.entries()) {
      if (grant.userId === userId && grant.status === 'ACTIVE_GRANT') {
        const remainingSecs = Math.max(0, Math.ceil((grant.expiresAtMs - Date.now()) / 1000));
        if (remainingSecs > 0) {
          active.push({ ...grant, remainingSeconds: remainingSecs });
        }
      }
    }
    return active;
  }

  getAllRequests() {
    return Array.from(emergencyGrants.values()).map(grant => {
      const remainingSecs = grant.expiresAtMs ? Math.max(0, Math.ceil((grant.expiresAtMs - Date.now()) / 1000)) : 0;
      return { ...grant, remainingSeconds: remainingSecs };
    });
  }
}

export const breakGlassService = new BreakGlassService();
