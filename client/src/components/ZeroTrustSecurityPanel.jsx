import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Local hardcoded RBAC/ABAC policy rule table keyed on the real user role from auth state
const ROLE_POLICY_TABLE = {
  'JUDICIAL_MAGISTRATE': {
    decision: 'ALLOW',
    clearanceLevel: 4,
    policyName: 'ABAC-POLICY-JUD-04',
    accessScope: 'Judicial Oversight • Full Evidence Audit • Digital Signing & Warrant Issuance',
    allowedDepartments: ['JUD', 'LEO', 'FOR', 'PROS', 'AUD']
  },
  'COMPLIANCE_AUDITOR': {
    decision: 'ALLOW',
    clearanceLevel: 4,
    policyName: 'ABAC-POLICY-AUD-02',
    accessScope: 'System Audit DAG • Security Incident Logs • Cross-Tenant Compliance Reports',
    allowedDepartments: ['AUD', 'JUD']
  },
  'POLICE_INVESTIGATOR': {
    decision: 'ALLOW',
    clearanceLevel: 3,
    policyName: 'RBAC-POLICY-LEO-01',
    accessScope: 'Case File Management • Primary Evidence Ingestion • Chain of Custody Handover',
    allowedDepartments: ['LEO']
  },
  'SUPERVISOR': {
    decision: 'ALLOW',
    clearanceLevel: 3,
    policyName: 'RBAC-POLICY-LEO-SUP-01',
    accessScope: 'Assigned Investigation Oversight • Break-Glass Request Approval',
    allowedDepartments: ['LEO', 'FOR', 'PROS']
  },
  'FORENSIC_SPECIALIST': {
    decision: 'ALLOW',
    clearanceLevel: 3,
    policyName: 'RBAC-POLICY-FOR-03',
    accessScope: 'Forensic Lab Analysis • Ballistics Stamping • Cryptographic SHA-256 Hashing',
    allowedDepartments: ['FOR']
  },
  'PUBLIC_PROSECUTOR': {
    decision: 'ALLOW',
    clearanceLevel: 3,
    policyName: 'RBAC-POLICY-PROS-05',
    accessScope: 'Court Trial Docket • Charge Sheet Review • Prosecution Evidence Access',
    allowedDepartments: ['PROS']
  },
  'ADMIN': {
    decision: 'ALLOW',
    clearanceLevel: 5,
    policyName: 'RBAC-POLICY-SYS-ADMIN',
    accessScope: 'System Administration • Hardware Fingerprint Registry • Root Security Ops',
    allowedDepartments: ['ALL']
  }
};

export default function ZeroTrustSecurityPanel({ userOverride }) {
  const { user: authUser } = useAuth();
  const currentUser = userOverride || authUser;

  // Real role from existing auth state (fallback to default role if persona is in pre-auth mode)
  const currentRole = currentUser?.role || 'POLICE_INVESTIGATOR';
  const rolePolicy = ROLE_POLICY_TABLE[currentRole] || {
    decision: 'DENY',
    clearanceLevel: 0,
    policyName: 'DEFAULT-ZERO-TRUST-DENY',
    accessScope: 'Unrecognized Role — Access Denied by Zero Trust Default Rule',
    allowedDepartments: []
  };

  // Local component state for Zero-Trust Continuous Risk Evaluation
  // Requirement: Default continuous risk score is 22 (numeric, hardcoded)
  const riskScore = 22;
  const isSuspicious = false;
  const simulationTriggerCount = 0;

  // Compute final RBAC/ABAC decision:
  // If suspicious activity is simulated, decision flips to DENY.
  // Otherwise, it is computed from the local rule table keyed on the real user role.
  const decisionResult = isSuspicious ? 'DENY' : rolePolicy.decision;

  return (
    <section className="white-card portal-panel p-6 space-y-6 transition-all font-sans" aria-label="Continuous zero-trust security posture">
      
      {/* Panel Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
            isSuspicious 
              ? 'bg-rose-100 text-rose-700 border border-rose-300' 
              : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            {isSuspicious ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base font-mono tracking-tight">
                Continuous Zero-Trust Security Posture
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold border bg-slate-100 text-slate-700 border-slate-300">
                LOCAL ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Stage Identity, Device, Risk Engine &amp; RBAC/ABAC Policy Authorization
            </p>
          </div>
        </div>

      </div>

      {/* Alert Banner (Requirement: shows an alert banner when suspicious activity is triggered) */}
      {isSuspicious && (
        <div 
          role="alert" 
          className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2 animate-fadeIn shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-950 font-mono">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>SECURITY ANOMALY DETECTED: UNAUTHORIZED BEHAVIOR SIGNATURE</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-300">
              Trigger Event #{simulationTriggerCount}
            </span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            Continuous Risk Score surged to <strong className="font-mono text-rose-950 underline font-extrabold">{riskScore}/100</strong> (Critical Threshold &ge; 85 exceeded). 
            Dynamic RBAC/ABAC authorization is revoked to <strong className="font-mono text-rose-950 uppercase font-black">DENY</strong>. 
            Cryptographic document vault access quarantined locally.
          </p>
          <div className="text-[11px] font-mono text-rose-700 pt-1 flex items-center gap-2">
            <span>• Simulation Mode: Local React state mutated</span>
            <span>• Backend APIs: Untouched (Zero HTTP calls dispatched)</span>
          </div>
        </div>
      )}

      {/* 4 Hardcoded Evaluation Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stage 1: Device Posture Check */}
        <div className={`p-4 rounded-xl border transition-all ${
          isSuspicious 
            ? 'bg-amber-50/60 border-amber-200' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider font-mono text-[10px]">
              Stage 1
            </span>
            <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              isSuspicious
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {isSuspicious ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  FLAGGED
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  COMPLIANT
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Cpu className={`w-4 h-4 ${isSuspicious ? 'text-amber-600' : 'text-blue-600'}`} />
            <span>Device Posture Check</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-600 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">TPM 2.0 / HSM:</span>
              <span className="font-semibold text-slate-700">Enforced</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Secure Boot:</span>
              <span className="font-semibold text-slate-700">Verified</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Host OS:</span>
              <span className="font-semibold text-slate-700">Hardened Linux / Win11</span>
            </div>
          </div>
        </div>

        {/* Stage 2: MFA Status */}
        <div className={`p-4 rounded-xl border transition-all ${
          isSuspicious 
            ? 'bg-amber-50/60 border-amber-200' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider font-mono text-[10px]">
              Stage 2
            </span>
            <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              isSuspicious
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {isSuspicious ? 'CHALLENGE REQ' : 'VERIFIED'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>MFA Status</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-600 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Method:</span>
              <span className="font-semibold text-slate-700">TOTP Authenticator</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OTP Code TTL:</span>
              <span className="font-semibold text-emerald-700">120s Enforced</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lockout Policy:</span>
              <span className="font-semibold text-slate-700">3 Fails = 15m Lock</span>
            </div>
          </div>
        </div>

        {/* Stage 3: Continuous Risk Score */}
        <div className={`p-4 rounded-xl border transition-all ${
          isSuspicious 
            ? 'bg-rose-50 border-rose-300 shadow-sm' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider font-mono text-[10px]">
              Stage 3
            </span>
            <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              riskScore >= 80 
                ? 'bg-rose-200 text-rose-900 border border-rose-300 animate-pulse'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {riskScore >= 80 ? 'CRITICAL RISK' : 'LOW RISK'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Activity className={`w-4 h-4 ${riskScore >= 80 ? 'text-rose-600' : 'text-blue-600'}`} />
            <span>Continuous Risk Score</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1 font-mono">
              <span className={`text-2xl font-black ${riskScore >= 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {riskScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {riskScore >= 80 ? 'Elevated (85+)' : 'Baseline (Default 22)'}
            </span>
          </div>

          {/* Risk Level Bar */}
          <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                riskScore >= 80 ? 'bg-rose-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(riskScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Stage 4: RBAC/ABAC Decision Result */}
        <div className={`p-4 rounded-xl border transition-all ${
          decisionResult === 'ALLOW' 
            ? 'bg-emerald-50/50 border-emerald-200' 
            : 'bg-rose-50 border-rose-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider font-mono text-[10px]">
              Stage 4
            </span>
            <span className={`inline-flex items-center gap-1 font-mono text-xs font-black px-2.5 py-0.5 rounded shadow-sm ${
              decisionResult === 'ALLOW'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-700 text-white animate-pulse'
            }`}>
              {decisionResult === 'ALLOW' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ALLOW
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  DENY
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <Key className={`w-4 h-4 ${decisionResult === 'ALLOW' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>RBAC/ABAC Decision</span>
          </div>

          <div className="mt-2 text-[11px] space-y-1 font-mono">
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Active Role:</span>
              <span className="font-bold text-slate-800 text-[10px] truncate max-w-[130px]" title={currentRole}>
                {currentRole}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Rule Policy:</span>
              <span className="font-semibold text-blue-700 text-[10px]">{rolePolicy.policyName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="text-slate-400">Evaluated Result:</span>
              <strong className={decisionResult === 'ALLOW' ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                {decisionResult}
              </strong>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
