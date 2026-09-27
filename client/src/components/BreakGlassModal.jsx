import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, AlertTriangle, ShieldAlert, Clock, CheckCircle2, Zap } from 'lucide-react';

export default function BreakGlassModal({ isOpen, onClose }) {
  const { user, isBreakGlassSupervisor, isITAdmin } = useAuth();
  const [caseId, setCaseId] = useState('CASE-2026-8891');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeGrants, setActiveGrants] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const canReviewRequests = isBreakGlassSupervisor || isITAdmin;
  const pendingApprovals = canReviewRequests
    ? allRequests.filter(request => request.status === 'PENDING_APPROVAL' && (isITAdmin || (request.supervisorId === user?.id && request.userId !== user?.id)))
    : [];

  const fetchEmergencyStatus = async () => {
    try {
      const res = await api.get('/emergency/active');
      setActiveGrants(res.data.activeGrants || []);
      setAllRequests(res.data.allRequests || []);
    } catch (err) {
      console.error('Failed to fetch emergency grants:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmergencyStatus();
      const interval = setInterval(fetchEmergencyStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestEmergency = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide justification for emergency break-glass override.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/emergency/request', { caseId, reason });
      alert('Break-Glass Emergency Request submitted and logged to Audit DAG! Click Approve as Supervisor to grant 30-minute access.');
      fetchEmergencyStatus();
    } catch (err) {
      alert(`Request failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveGrant = async (requestId) => {
    try {
      await api.post('/emergency/approve', { requestId });
      alert('Supervisor Approval Granted! 30-Minute Elevated Access Active.');
      fetchEmergencyStatus();
    } catch (err) {
      alert(`Approval failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-red-500/40 bg-[#111827]">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Break-Glass Emergency Access Override
                <span className="badge badge-danger">30-Min Time-Boxed</span>
              </h2>
              <p className="text-xs text-slate-400">Grants temporary elevated clearance with supervisor sign-off & 100% DAG audit logging.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Active Grants List */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Active 30-Min Emergency Grants ({activeGrants.length})
            </h3>

            {activeGrants.length === 0 ? (
              <div className="bg-[#0d1424] p-4 rounded-xl border border-[#24324d] text-slate-400 text-center">
                No active emergency access grants.
              </div>
            ) : (
              activeGrants.map(grant => (
                <div key={grant.id} className="bg-red-950/30 p-4 rounded-xl border border-red-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-red-400 font-bold">{grant.id}</span>
                    <span className="badge badge-danger font-mono animate-pulse">
                      ⏳ {formatTimer(grant.remainingSeconds)} REMAINING
                    </span>
                  </div>

                  <div className="text-white font-bold">{grant.caseId}</div>
                  <div className="text-slate-300">Requester: <span className="text-emerald-400">{grant.userName}</span> ({grant.userDepartment})</div>
                  <div className="text-slate-400 italic">"Reason: {grant.reason}"</div>
                  <div className="text-amber-400 text-[11px]">Approved By: {grant.approvedBy}</div>
                </div>
              ))
            )}

            {/* Pending Requests Queue */}
            {pendingApprovals.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-amber-400 text-xs">Pending Supervisor Approvals:</h4>
                {pendingApprovals.map(req => (
                  <div key={req.id} className="bg-[#0d1424] p-3 rounded border border-[#24324d] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{req.userName} ({req.caseId})</div>
                      <div className="text-slate-400 italic text-[11px]">"{req.reason}"</div>
                    </div>
                    {isBreakGlassSupervisor && <button
                        onClick={() => handleApproveGrant(req.id)}
                        className="btn btn-success py-1 px-3 text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Grant
                      </button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Form */}
          {!isITAdmin && !isBreakGlassSupervisor && <form onSubmit={handleRequestEmergency} className="space-y-4 bg-[#0d1424] p-4 rounded-xl border border-[#24324d]">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" /> Request Elevated Access
            </h3>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Case ID:</label>
              <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input-field text-sm">
                <option value="CASE-2026-8891">CASE-2026-8891 (Homicide & Cyber Fraud)</option>
                <option value="CASE-2026-4412">CASE-2026-4412 (Narcotics Seizure)</option>
                <option value="CASE-2026-1102">CASE-2026-1102 (Commercial Heist)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Emergency Justification Reason:</label>
              <textarea
                rows={4}
                placeholder="State urgent legal/investigative justification for emergency break-glass override..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field text-sm font-sans"
                required
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-danger w-full text-xs py-2.5 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {submitting ? 'Submitting Request...' : 'Submit Break-Glass Request'}
            </button>
          </form>}
        </div>
      </div>
    </div>
  );
}
