import React, { useState, useEffect } from 'react';
import { Shield, Server, Cpu, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function NetworkContextBanner() {
  const [context, setContext] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContext();
  }, []);

  const fetchContext = async () => {
    try {
      const res = await api.get('/demo-context');
      if (res.data?.context) {
        setContext(res.data.context);
      }
    } catch (err) {
      console.warn('Could not fetch demo network context:', err.message);
    }
  };

  const handleSwitchNetwork = async (networkName) => {
    setLoading(true);
    try {
      const res = await api.post('/demo-context', { networkName });
      if (res.data?.context) {
        setContext(res.data.context);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || `Network switch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs flex items-center justify-center gap-5 font-sans">
        <span className="text-slate-400 flex items-center gap-1.5 font-mono">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          Subnet: <strong className="text-slate-200">{context?.subnet || '10.20.10.0/24'}</strong>
        </span>
        <span className="text-slate-400 flex items-center gap-1.5 font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Device: <strong className="text-cyan-300">{context?.device || 'CHIEF-INVESTIGATOR-PC-01'}</strong>
        </span>
      </div>

      {/* Switch Network Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6 border border-[#24324d] bg-[#111827] max-w-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#24324d]">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Shield className="w-5 h-5 text-blue-400" />
                Demo Network Context Switcher
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-4">
              Simulate backend network group authorization, subnet rules, and device identity validation.
            </p>

            <div className="space-y-3 font-sans">
              <button
                onClick={() => handleSwitchNetwork('MANAGER_NETWORK')}
                disabled={loading}
                className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  context?.networkName === 'MANAGER_NETWORK'
                    ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/50'
                    : 'border-slate-800 bg-[#0d1424] hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    Boss / Chief Investigator Network
                    {context?.networkName === 'MANAGER_NETWORK' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Subnet: 10.20.10.0/24 • Device: CHIEF-INVESTIGATOR-PC-01</div>
                  <div className="text-[11px] text-blue-400 font-mono mt-1">Full Admin / Security Alerts / Audit DAG Access</div>
                </div>
              </button>

              <button
                onClick={() => handleSwitchNetwork('EMPLOYEE_NETWORK')}
                disabled={loading}
                className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  context?.networkName === 'EMPLOYEE_NETWORK'
                    ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/50'
                    : 'border-slate-800 bg-[#0d1424] hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    Forensic / Officer Field Network
                    {context?.networkName === 'EMPLOYEE_NETWORK' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Subnet: 10.20.20.0/24 • Device: LAB-ANALYST-PC-07</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1">Assigned Cases & Evidence Filing Access</div>
                </div>
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-[#24324d] flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
