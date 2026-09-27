import React from 'react';
import { ShieldCheck, Scale, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsConditionsPage() {
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
            <span className="font-mono text-sm font-extrabold text-slate-900">SākshyaChain Vault Governance</span>
          </div>
        </div>

        {/* Title Banner */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold font-mono">
            <Scale className="w-3.5 h-3.5" /> TERMS OF SERVICE &amp; CHAIN OF CUSTODY
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            System Usage Terms &amp; Conditions
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Governance Standard: Judicial Digital Vault Standard v2.0 • Binding Protocol
          </p>
        </div>

        {/* Terms Body Content */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 1. Authorized Access &amp; Persona Identity
            </h2>
            <p>
              By authenticating into SākshyaChain, users agree to operate strictly under their assigned persona (e.g. Special Sessions Court Magistrate, Chief Investigating Officer). Unauthorized persona switching or attempted privilege escalation from lower clearance levels to higher clearance levels is strictly prohibited and logged in the Security Breach DAG.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 2. PKI Digital Signature &amp; Stamping Integrity
            </h2>
            <p>
              All evidence uploads, document approvals, and transfer signatures generated via SākshyaChain are cryptographically stamped with RSA-2048 / ECDSA digital signature key pairs. Users are legally responsible for all actions stamped with their private keys.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> 3. Break-Glass Emergency Access Rules
            </h2>
            <p>
              The Break-Glass Emergency Access mechanism grants temporary 30-minute access to sealed case files during exigent law enforcement circumstances. Every Break-Glass invocation generates an immutable DAG ledger record and triggers real-time security alerts to Level 4 Magistrates and Compliance Auditors. Fraudulent invocation constitutes legal misconduct.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> 4. Audit DAG Immutability &amp; Verification
            </h2>
            <p>
              The SākshyaChain Directed Acyclic Graph (DAG) ledger maintains an unbroken, cryptographic record of all digital evidence movements, modifications, and signature verifications. Tampering with or altering ledger history is mathematically prevented by SHA-256 hash chaining.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <p>
              For legal governance inquiries, contact the High Court Digital Operations Committee at <span className="font-mono text-blue-600">governance@sakshyachain.org</span>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
