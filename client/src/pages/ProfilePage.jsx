import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Lock, 
  CheckCircle2, 
  QrCode, 
  Clock, 
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-3xl shadow-md">
          {user?.name ? user.name[0] : 'V'}
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'Inspector Vikram Singh'}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {user?.role || 'POLICE_INVESTIGATOR'}
            </span>
          </div>
          <p className="text-slate-500 text-sm">{user?.department || 'Crime Branch - South Zone'}</p>
          <div className="text-xs text-slate-400 font-mono pt-1">Officer Badge ID: {user?.id || 'officer_42'}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center font-mono">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Security Clearance</span>
          <span className="text-lg font-black text-emerald-900">LEVEL 3 (RESTRICTED)</span>
        </div>
      </div>

      <section className="white-card p-5 space-y-4" aria-labelledby="staff-details-heading">
        <h2 id="staff-details-heading" className="font-bold text-slate-900">Staff Details</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee ID</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.employeeId || user?.id || '—'}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.roleTitle || user?.role || '—'}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Police Station</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.policeStation || 'Not applicable'}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Location</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.workLocation || user?.departmentName || '—'}</dd></div>
        </dl>
      </section>

      {/* Grid: RSA Keypair & MFA Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* RSA Key Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-200 pb-3">
            <Key className="w-5 h-5 text-blue-600" />
            RSA-2048 PKI Digital Signing Key
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block mb-1">Public Key SHA-256 Fingerprint:</span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 break-all text-[11px] font-semibold">
                8f:2e:9a:1b:7d:4c:00:3a:1f:99:ee:aa:bb:cc:dd:ee:11:22:33:44:55:66:77:88
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Key Pair Status:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hardware Security Module (HSM) Active
              </div>
            </div>
          </div>
        </div>

        {/* MFA Setup Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-200 pb-3">
            <Smartphone className="w-5 h-5 text-blue-600" />
            2-Factor MFA Authenticator
          </h3>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-2">
              <QrCode className="w-16 h-16 text-slate-800" />
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> TOTP Authenticator Active
              </span>
              <p className="text-slate-500 text-[11px]">
                Configured with Google Authenticator / Authy. Requires 120-second dynamic OTP code upon login.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
