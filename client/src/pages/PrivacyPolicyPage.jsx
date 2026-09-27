import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="page-with-watermark min-h-screen text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Gateway
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span className="font-mono text-sm font-extrabold text-slate-900">SākshyaChain Legal Compliance</span>
          </div>
        </div>

        {/* Title Banner */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold font-mono">
            <Lock className="w-3.5 h-3.5" /> PRIVACY &amp; DATA PROTECTION POLICY
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            Legal &amp; Investigation Digital Vault Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Effective Date: September 19, 2026 • Clearance Standards: Level 4 Judicial &amp; Level 3/2 Law Enforcement
          </p>
        </div>

        {/* Policy Body Content */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 1. Overview &amp; Zero-Trust Commitment
            </h2>
            <p>
              SākshyaChain operates as a strictly isolated, multi-tenant digital vault infrastructure for handling sensitive legal evidence, case management documentation, and judicial audit logs. We uphold a zero-trust privacy posture, enforcing AES-256-GCM envelope encryption for all stored evidence and cryptographic PKI signatures for verifying chain-of-custody transactions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 2. Data Collection &amp; Telemetry Limits
            </h2>
            <p>
              SākshyaChain does not collect or track user data for advertising, marketing, or commercial profiling. We capture only the minimal operational metrics required for system security:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
              <li>Authentication Logs (JWT Token Issuance, MFA OTP Verification, IP Subnet Firewall Logs)</li>
              <li>Audit Trail DAG Graph Transactions (Public Key Stamping, Case File Upload Hash Records)</li>
              <li>Break-Glass Emergency Access Logging (30-Minute Temporary Privilege Grant Justifications)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 3. Data Storage &amp; Encryption Standards
            </h2>
            <p>
              All digital evidence files uploaded to the SākshyaChain vault are encrypted client-side or envelope-encrypted before being committed to Supabase Storage or local persistent storage. Master encryption key material is protected via KMS HSM architecture and never exposed to client-side scripts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 4. Clearance Hierarchy &amp; Access Controls
            </h2>
            <p>
              Access to data within SākshyaChain is strictly partitioned by Clearance Levels:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Level 4 (Magistrate / Boss)
                </div>
                <p className="text-[11px] text-slate-600">Full system oversight, PKI verification stamping, DAG log graph inspection, and security alert response.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" /> Level 3/2 (Officer / Employee)
                </div>
                <p className="text-[11px] text-slate-600">Operational field access restricted to assigned case files and AI Legal Assistant interactions.</p>
              </div>
            </div>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <p>
              For inquiries regarding data compliance or judicial audit verification, contact the SākshyaChain System Security Administrator at <span className="font-mono text-blue-600">security@sakshyachain.org</span>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
