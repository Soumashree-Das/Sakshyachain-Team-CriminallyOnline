import express from 'express';
import { breakGlassService } from '../services/breakGlassService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const isBreakGlassSupervisor = user => user.role === 'SUPERVISOR';

// POST /api/emergency/request - Request Break-Glass Emergency Access
router.post('/request', authenticateToken, (req, res) => {
  const { caseId, reason } = req.body;
  if (!caseId || !reason) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'caseId and reason are required' });
  }

  try {
    const requestObj = breakGlassService.requestEmergencyAccess({
      userId: req.user.id,
      caseId,
      reason
    });
    res.status(201).json({
      message: 'Break-Glass Emergency Request submitted and logged to Audit DAG. Pending Supervisor Approval.',
      request: requestObj
    });
  } catch (err) {
    res.status(400).json({ error: 'EMERGENCY_REQ_FAILED', message: err.message });
  }
});

// POST /api/emergency/approve - Supervisor Approves 30-Minute Time-Boxed Emergency Grant
router.post('/approve', authenticateToken, (req, res) => {
  if (!isBreakGlassSupervisor(req.user)) {
    return res.status(403).json({ error: 'SUPERVISOR_ONLY', message: 'Only the designated employee supervisor can approve break-glass access.' });
  }
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'MISSING_REQUEST_ID', message: 'requestId is required' });
  }

  try {
    const grantObj = breakGlassService.approveEmergencyAccess({
      requestId,
      supervisorId: req.user.id
    });
    res.json({
      message: 'Break-Glass Emergency Access Approved! Granted 30-minute elevated access.',
      grant: grantObj
    });
  } catch (err) {
    res.status(400).json({ error: 'EMERGENCY_APPROVE_FAILED', message: err.message });
  }
});

// GET /api/emergency/active - Active Break-Glass Grants for current user
router.get('/active', authenticateToken, (req, res) => {
  const canMonitor = isBreakGlassSupervisor(req.user) || req.user.systemRole === 'IT_ADMIN';
  const activeGrants = breakGlassService.getActiveGrantsForUser(req.user.systemRole === 'IT_ADMIN' ? null : req.user.id);
  const allRequests = canMonitor ? breakGlassService.getAllRequests() : [];
  res.json({ activeGrants, allRequests });
});

export default router;
