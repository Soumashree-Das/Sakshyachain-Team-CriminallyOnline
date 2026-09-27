import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, KeyRound } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="page-with-watermark min-h-screen text-slate-800 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center space-y-6">
        
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200 mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold font-mono rounded-full">
            HTTP 404 • ROUTE UNMAPPED
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight pt-2">
            Requested Resource Not Found
          </h1>
          <p className="text-slate-500 text-xs leading-relaxed">
            The target digital vault route, evidence hash, or audit node does not exist or has been restricted by clearance access control.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1 text-xs font-mono">
          <div className="text-slate-500">Security Diagnostic:</div>
          <div className="text-slate-700 font-semibold">• Path: {window.location.pathname}</div>
          <div className="text-slate-700 font-semibold">• Status: 404_NOT_FOUND</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            <KeyRound className="w-4 h-4" /> Portal Gateway
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition"
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
