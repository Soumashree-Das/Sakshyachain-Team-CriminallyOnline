import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, Lock } from 'lucide-react';

export default function MFALoginModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  if (!isOpen) return null;
  const reauthenticate = () => { logout(); onClose(); navigate('/login'); };
  return <div className="modal-overlay"><div className="modal-content max-w-md space-y-4 border border-[#24324d] bg-[#111827] p-6 text-white">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-600/20 text-blue-400"><ShieldCheck className="h-5 w-5" /></div><h2 className="text-base font-bold">MFA re-authentication</h2></div><button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div>
    <p className="text-xs leading-relaxed text-slate-300">Start a fresh sign-in to verify credentials and enter the prototype OTP. The session will end before the login page opens.</p>
    <button onClick={reauthenticate} className="btn btn-primary flex w-full items-center justify-center gap-2 text-xs"><Lock className="h-4 w-4" />Sign out and re-authenticate</button>
  </div></div>;
}
