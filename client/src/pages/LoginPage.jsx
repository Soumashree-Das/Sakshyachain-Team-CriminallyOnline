import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Key, ArrowLeft, ArrowRight, Award, Users, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ navigateTo: propNavigateTo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithITAdminCredentials, loginWithEmployeeCredentials, verifyLoginOTP } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const [employeeUsername, setEmployeeUsername] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSecretCode, setAdminSecretCode] = useState('');

  const handleCredentials = async event => {
    event.preventDefault();
    if (honeypot) return;
    setAuthenticating(true);
    setAuthError(null);
    try {
      const pending = selectedPortal === 'IT_ADMIN'
        ? await loginWithITAdminCredentials(adminUsername, adminPassword, adminSecretCode)
        : await loginWithEmployeeCredentials(employeeUsername, employeePassword);
      setChallenge(pending);
    } catch (error) {
      setAuthError(`${selectedPortal === 'IT_ADMIN' ? 'IT Admin' : 'Employee'} sign-in failed: ${error.message}`);
    } finally {
      setAuthenticating(false);
    }
  };

  const handleVerifyOtp = async event => {
    event.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      await verifyLoginOTP(challenge.challengeId, otp);
      if (propNavigateTo) return propNavigateTo('dashboard');
      navigate('/dashboard');
    } catch (error) {
      setAuthError(`OTP verification failed: ${error.message}`);
    } finally {
      setAuthenticating(false);
    }
  };

  const resetPortal = () => { setSelectedPortal(null); setChallenge(null); setOtp(''); setShowOtp(false); setAuthError(null); };

  return (
    <div className="login-page min-h-screen px-4 py-10 font-sans text-slate-800 sm:px-6">
      <input type="text" name="b_hp_field" value={honeypot} onChange={event => setHoneypot(event.target.value)} tabIndex="-1" autoComplete="off" className="hidden opacity-0 absolute -z-50 pointer-events-none" aria-hidden="true" />
      <main className="login-main mx-auto flex min-h-[calc(100vh-5rem)] w-full items-center justify-center">
        <div className="login-layout">
          <aside className="login-visual" aria-label="Satyamev Jayate national emblem">
            <img src="/indian-flag.jpg" alt="Indian flag with the map of India and Ashoka Chakra" />
            <p>JUSTICE <span>·</span> INTEGRITY <span>·</span> SERVICE</p>
          </aside>
          <section className="login-content">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20"><ShieldCheck className="h-8 w-8" /></div>
          <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900">SĀKSHYACHAIN</h1>
          <p className="mt-1 text-xs font-medium text-slate-600">Secure Digital Evidence Portal</p>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {location.state?.lockoutMessage && <div role="alert" className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-center text-sm font-semibold text-rose-900">{location.state.lockoutMessage}</div>}
          {authError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs text-red-800">{authError}</div>}

          {!selectedPortal ? (
            <>
              <h2 className="text-center text-lg font-bold text-slate-900">Choose your sign-in portal</h2>
              <p className="mt-1 text-center text-xs text-slate-500">Select the account type for this prototype.</p>
              <div className="mt-5 space-y-3">
                <button type="button" onClick={() => { setSelectedPortal('EMPLOYEE'); setAuthError(null); }} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/50">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Users className="h-5 w-5" /></span><span className="flex-1"><strong className="block text-sm text-slate-900">Employee</strong><span className="text-xs text-slate-500">Investigators and other staff</span></span><ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
                <button type="button" onClick={() => { setSelectedPortal('IT_ADMIN'); setAuthError(null); }} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/50">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Award className="h-5 w-5" /></span><span className="flex-1"><strong className="block text-sm text-slate-900">IT Admin</strong><span className="text-xs text-slate-500">Read-only system access custodian</span></span><ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900"><strong>Prototype portal selection.</strong> In the final implementation, a registered device or IP will determine the portal and open its sign-in page directly.</div>
            </>
          ) : challenge ? (
            <>
              <button type="button" onClick={resetPortal} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700"><ArrowLeft className="h-3.5 w-3.5" />Start over</button>
              <div className="mb-5"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800"><Key className="h-3.5 w-3.5" /> TWO-STEP VERIFICATION</div><h2 className="text-lg font-bold text-slate-900">Verify it’s you</h2><p className="mt-1 text-xs leading-5 text-slate-600">Enter the six-digit verification code to finish signing in as {challenge.displayName}.</p></div>
              <div role="status" className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">Your verification code expires in {challenge.expiresInSeconds} seconds.</div>
              <form onSubmit={handleVerifyOtp} className="space-y-3"><label className="block text-xs font-semibold text-slate-800">6-digit OTP<div className="relative mt-1.5"><input required type={showOtp ? 'text' : 'password'} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 pr-11 text-center font-mono text-lg tracking-[0.3em]" placeholder="••••••" /><button type="button" onClick={() => setShowOtp(value => !value)} aria-label={showOtp ? 'Hide OTP' : 'Show OTP'} title={showOtp ? 'Hide OTP' : 'Show OTP'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">{showOtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label><button type="submit" disabled={authenticating || otp.length !== 6} className="btn btn-primary flex w-full items-center justify-center gap-2 py-3 text-xs font-extrabold disabled:opacity-60"><Key className="h-4 w-4" />{authenticating ? 'Verifying…' : 'Verify OTP and sign in'}</button></form>
            </>
          ) : (
            <>
              <button type="button" onClick={resetPortal} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700"><ArrowLeft className="h-3.5 w-3.5" />Choose another portal</button>
              {selectedPortal === 'IT_ADMIN' ? (
                <><div className="mb-5"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800"><Award className="h-3.5 w-3.5" /> IT ADMIN · ACCESS CUSTODIAN</div><h2 className="text-lg font-bold text-slate-900">IT Admin sign-in</h2><p className="mt-1 text-xs leading-5 text-slate-600">System-wide view access; may grant or revoke employee document access.</p></div>
                  <form onSubmit={handleCredentials} className="space-y-3"><label className="block text-xs font-semibold text-slate-800">Admin username<input required autoComplete="username" value={adminUsername} onChange={event => setAdminUsername(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" placeholder="Enter IT Admin username" /></label><label className="block text-xs font-semibold text-slate-800">Password<input type="password" required autoComplete="current-password" value={adminPassword} onChange={event => setAdminPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" placeholder="Enter password" /></label><label className="block text-xs font-semibold text-slate-800">IT Admin secret code<input type="password" required autoComplete="off" value={adminSecretCode} onChange={event => setAdminSecretCode(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" placeholder="Enter admin-only code" /></label><div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-[11px] text-slate-600"><strong className="block text-blue-900">Demo Admin usernames</strong><code>it_admin1</code> · <code>it_admin2</code><span className="mt-1 block">Credentials are in the prototype handout.</span></div><button type="submit" disabled={authenticating} className="btn btn-primary flex w-full items-center justify-center gap-2 py-3 text-xs font-extrabold disabled:opacity-60"><UserCheck className="h-4 w-4" />{authenticating ? 'Checking credentials…' : 'Continue to OTP'}</button></form></>
              ) : (
                <><div className="mb-5"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800"><Users className="h-3.5 w-3.5" /> EMPLOYEE PORTAL</div><h2 className="text-lg font-bold text-slate-900">Employee sign-in</h2><p className="mt-1 text-xs leading-5 text-slate-600">Use your employee ID as your username. OTP is required for every sign-in.</p></div>
                  <form onSubmit={handleCredentials} className="space-y-3"><label className="block text-xs font-semibold text-slate-800">Employee ID<input required autoComplete="username" value={employeeUsername} onChange={event => setEmployeeUsername(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" placeholder="e.g. POL-101" /></label><label className="block text-xs font-semibold text-slate-800">Password<input type="password" required autoComplete="current-password" value={employeePassword} onChange={event => setEmployeePassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" placeholder="Enter your password" /></label><div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-slate-600">Hardcoded demonstration credentials are listed in <strong className="text-blue-900">DEMO_CREDENTIALS_AND_ACCESS_FLOW.md</strong> in the project folder.</div><button type="submit" disabled={authenticating} className="btn btn-primary flex w-full items-center justify-center gap-2 py-3 text-xs font-extrabold disabled:opacity-60"><UserCheck className="h-4 w-4" />{authenticating ? 'Checking credentials…' : 'Continue to OTP'}</button></form></>
              )}
            </>
          )}
        </div>
        <footer className="mt-6 text-center text-[11px] text-slate-500"><div className="flex items-center justify-center gap-3"><Link to="/privacy" className="underline underline-offset-4 hover:text-blue-600">Privacy</Link><span>·</span><Link to="/terms" className="underline underline-offset-4 hover:text-blue-600">Terms</Link><span>·</span><span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-blue-600" /> AES-256-GCM vault</span></div><p className="mt-2 font-mono text-slate-400">© 2026 SākshyaChain</p></footer>
          </section>
        </div>
      </main>
    </div>
  );
}
