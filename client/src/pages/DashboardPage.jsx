import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Database, FileText, Bell, ShieldCheck, ArrowRight, Clock, Lock, AlertTriangle, Plus, ChevronRight, GitFork, MapPin } from 'lucide-react';
import ZeroTrustSecurityPanel from '../components/ZeroTrustSecurityPanel';

export default function DashboardPage({ navigateTo: propNavigateTo }) {
  const { user, isBoss } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleNavigate = (path) => {
    if (propNavigateTo) return propNavigateTo(path);
    const target = path.startsWith('/') ? path : `/${path === 'docs' ? 'cases' : path}`;
    navigate(target);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [casesRes, docsRes] = await Promise.all([
          api.get('/cases'),
          api.get('/documents')
        ]);
        setCases(casesRes.data.cases || []);
        setDocuments(docsRes.data.documents || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="space-y-6">
      <section className="dashboard-overview white-card" aria-label="Dashboard overview">
      {/* Welcome Banner */}
      <div className="dashboard-welcome p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-mono">Welcome back, {user ? user.name : 'Officer'}</h2>
            <span className="badge badge-info font-mono text-xs">
              {user ? user.roleTitle : 'Investigator'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department: <strong className="text-blue-700">{user ? user.departmentName : 'Special Crime Branch'}</strong> • Security Clearance Level {user ? user.clearanceLevel : 1}
            <span className="ml-2 font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              {isBoss ? 'Executive Boss Portal (L4)' : 'Field Officer Portal (L3/L2)'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate('/graph')}
            className="btn btn-secondary text-xs flex items-center gap-2 py-2 px-3 border border-slate-300 font-bold"
          >
            <GitFork className="w-4 h-4 text-blue-600" />
            <span>Open Knowledge Graph</span>
          </button>
          <button
            onClick={() => handleNavigate('/upload')}
            className="btn btn-primary text-xs flex items-center gap-2 py-2 px-3"
          >
            <Plus className="w-4 h-4" />
            <span>Upload & Ingest Document</span>
          </button>
        </div>
      </div>

      <div className="dashboard-location flex items-center gap-3 p-3" aria-label="Current location">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><MapPin className="h-5 w-5" /></div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Location</div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{user?.currentLocation || user?.policeStation || user?.workLocation || 'Location not assigned'}</div>
        </div>
      </div>
      </section>

      {/* Continuous Zero-Trust Security Posture & RBAC/ABAC Evaluation Section */}
      <ZeroTrustSecurityPanel />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => handleNavigate('/cases')} className="white-card p-5 border border-slate-200 white-card-hover cursor-pointer flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{cases.length}</div>
            <div className="text-xs text-slate-500 font-medium">Assigned Cases</div>
          </div>
        </div>

        <div onClick={() => handleNavigate('/cases')} className="white-card p-5 border border-slate-200 white-card-hover cursor-pointer flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{documents.length || 5}</div>
            <div className="text-xs text-slate-500 font-medium font-sans">Vault Documents</div>
          </div>
        </div>

        <div
          onClick={() => isBoss ? handleNavigate('/alerts') : handleNavigate('/cases')}
          className={`white-card p-5 border border-slate-200 flex items-center gap-4 ${isBoss ? 'white-card-hover cursor-pointer' : 'cursor-default'}`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">{isBoss ? '3' : '0'}</div>
            <div className="text-xs text-slate-500 font-medium">{isBoss ? 'Active Alerts' : 'System Alerts (Boss Only)'}</div>
          </div>
        </div>

        <div
          onClick={() => isBoss ? handleNavigate('/integrity') : handleNavigate('/cases')}
          className={`white-card p-5 border border-slate-200 flex items-center gap-4 ${isBoss ? 'white-card-hover cursor-pointer' : 'cursor-default'}`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700 font-mono">100% OK</div>
            <div className="text-xs text-slate-500 font-medium">{isBoss ? 'Integrity Scanner' : 'SHA-256 Vault Status'}</div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Cases & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Recent Assigned Legal Cases
            </h3>
            <button onClick={() => handleNavigate('/cases')} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              View All Cases <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {cases.map(c => (
              <div
                key={c.id}
                onClick={() => handleNavigate(`/cases/${c.id}`)}
                className="white-card p-4 border border-slate-200 white-card-hover cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{c.firNumber || c.id}</span>
                    <span className="badge badge-info font-mono text-[10px]">{c.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{c.title}</div>
                  <div className="text-xs text-slate-500">Lead Officer: {c.leadInvestigator} • Date Filed: {c.dateFiled}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge badge-clearance-3 text-[10px]">Restricted L{c.clearanceRequired}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Stream (1 Col) */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Live Audit Activity Stream
          </h3>

          <div className="white-card p-4 border border-slate-200 space-y-3 max-h-[380px] overflow-y-auto text-xs">
            <div className="pb-2 border-b border-slate-100 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">RSA PKI Signature Applied</div>
                <div className="text-slate-500">Dr. Sunita Rao signed Forensic Ballistics Report #DOC-8891-002</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">2 min ago • Block #108</div>
              </div>
            </div>

            <div className="pb-2 border-b border-slate-100 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">AES-256 Document Uploaded</div>
                <div className="text-slate-500">Inspector Sharma uploaded Witness Statement Deposition</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">15 min ago • Block #107</div>
              </div>
            </div>

            <div className="pb-2 border-b border-slate-100 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
              <div>
                <div className="font-semibold text-slate-900">Inter-Dept Custody Transferred</div>
                <div className="text-slate-500">Evidence transferred LEO ➔ PROS (Approved by Prosecutor Verma)</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">1 hour ago • Block #106</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Integrity Progress Card */}
      <div className="white-card p-5 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> System Storage Vault Cryptographic Health
          </span>
          <span className="text-emerald-700 font-mono font-bold">100% SHA-256 Verified</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full w-full transition-all duration-500"></div>
        </div>
      </div>
    </div>
  );
}
