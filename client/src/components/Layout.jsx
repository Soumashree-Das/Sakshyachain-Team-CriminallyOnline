import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Search, Bell, BellRing, Lock, Database, Cpu, ShieldAlert,
  SlidersHorizontal, Users, Smartphone, User, FileText, CheckCircle2, Menu, X, LogOut, ChevronRight, HardDrive, Key, GitFork,
  Briefcase, Settings, Building
} from 'lucide-react';
import UserSwitcherModal from './UserSwitcherModal';
import MFALoginModal from './MFALoginModal';
import BreakGlassModal from './BreakGlassModal';
import NetworkContextBanner from './NetworkContextBanner';
import api from '../services/api';

export default function Layout() {
  const { user, isBoss, isSupervisor, isITAdmin, isBreakGlassSupervisor, logout, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingAccessRequests, setPendingAccessRequests] = useState(0);
  const [accessNotice, setAccessNotice] = useState(null);
  const [pendingBreakGlass, setPendingBreakGlass] = useState([]);
  const [emergencySoundEnabled, setEmergencySoundEnabled] = useState(false);
  const [tamperAlert, setTamperAlert] = useState(null);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const seenTamperAlerts = useRef(new Set());
  const seenApprovalSteps = useRef(new Set());
  const emergencyAudioRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const closeMenusOutside = event => {
      if (!event.target.closest('.portal-menu')) {
        navRef.current?.querySelectorAll('.portal-menu[open]').forEach(menu => { menu.open = false; });
      }
    };
    const closeMenusOnEscape = event => {
      if (event.key === 'Escape') navRef.current?.querySelectorAll('.portal-menu[open]').forEach(menu => { menu.open = false; });
    };
    document.addEventListener('pointerdown', closeMenusOutside);
    document.addEventListener('keydown', closeMenusOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenusOutside);
      document.removeEventListener('keydown', closeMenusOnEscape);
    };
  }, []);

  const playTamperAlarm = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      await context.resume();
      [880, 660, 880].forEach((frequency, index) => {
        const startAt = context.currentTime + index * 0.28;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.23);
      });
      window.setTimeout(() => context.close(), 1200);
    } catch (error) {
      console.warn('Browser blocked the tamper alarm sound:', error);
    }
  };

  useEffect(() => {
    if (!isITAdmin) return undefined;
    let mounted = true;
    const showTamperAlert = alert => {
      if (!alert || alert.category !== 'EVIDENCE_TAMPERING') return;
      setTamperAlert(alert);
      if (!seenTamperAlerts.current.has(alert.id)) {
        seenTamperAlerts.current.add(alert.id);
        playTamperAlarm();
      }
    };
    const handleIncidentBroadcast = event => {
      if (!event.newValue) return;
      try {
        const alert = JSON.parse(event.newValue);
        if (Date.now() - Number(alert.emittedAt || 0) < 60_000) showTamperAlert(alert);
      } catch { /* Ignore malformed cross-tab notifications. */ }
    };
    window.addEventListener('storage', handleIncidentBroadcast);
    const pollTamperAlerts = async () => {
      try {
        const response = await api.get('/audit/alerts');
        if (!mounted) return;
        const active = (response.data.alerts || []).find(alert => alert.category === 'EVIDENCE_TAMPERING' && alert.status === 'OPEN');
        setTamperAlert(active || null);
        if (active) showTamperAlert(active);
      } catch { /* Preserve the portal if the alert feed is temporarily unavailable. */ }
    };
    pollTamperAlerts();
    const timer = window.setInterval(pollTamperAlerts, 3000);
    return () => { mounted = false; window.clearInterval(timer); window.removeEventListener('storage', handleIncidentBroadcast); };
  }, [isITAdmin, alarmEnabled]);

  useEffect(() => {
    if (!user) return undefined;
    seenApprovalSteps.current = new Set();
    let mounted = true;
    const pollAccessRequests = async () => {
      try {
        const response = await api.get('/access-requests');
        if (!mounted) return;
        const requests = response.data.requests || [];
        const needingApproval = requests.flatMap(request => {
          const steps = [];
          if (request.ownerId === user.id && request.ownerDecision === 'PENDING') steps.push({ request, role: 'file owner' });
          if (request.supervisorId === user.id && request.ownerDecision === 'APPROVED' && request.supervisorDecision === 'PENDING') steps.push({ request, role: 'supervisor' });
          return steps;
        });
        setPendingAccessRequests(needingApproval.length);
        const unseen = needingApproval.find(({ request, role }) => {
          const key = `${request.id}:${role}`;
          if (seenApprovalSteps.current.has(key)) return false;
          seenApprovalSteps.current.add(key);
          return true;
        });
        if (unseen) setAccessNotice(unseen);
      } catch {
        // Keep the rest of the portal usable while the approval queue is offline.
      }
    };
    pollAccessRequests();
    const timer = setInterval(pollAccessRequests, 4000);
    return () => { mounted = false; clearInterval(timer); };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !isBreakGlassSupervisor) {
      setPendingBreakGlass([]);
      return undefined;
    }
    let mounted = true;
    const pollBreakGlassRequests = async () => {
      try {
        const response = await api.get('/emergency/active');
        if (!mounted) return;
        setPendingBreakGlass((response.data.allRequests || []).filter(
          request => request.status === 'PENDING_APPROVAL' && request.supervisorId === user.id && request.userId !== user.id
        ));
      } catch {
        // Emergency request polling should not interrupt normal portal work.
      }
    };
    pollBreakGlassRequests();
    const timer = window.setInterval(pollBreakGlassRequests, 2500);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [user?.id, isBreakGlassSupervisor]);

  const enableEmergencySound = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!emergencyAudioRef.current) emergencyAudioRef.current = new AudioContextClass();
      await emergencyAudioRef.current.resume();
      setEmergencySoundEnabled(emergencyAudioRef.current.state === 'running');
    } catch (error) {
      console.warn('Browser could not enable emergency alert sound:', error);
    }
  };

  useEffect(() => {
    if (!isBreakGlassSupervisor || !emergencySoundEnabled || pendingBreakGlass.length === 0) return undefined;
    const context = emergencyAudioRef.current;
    if (!context || context.state !== 'running') return undefined;
    const playEmergencyBeep = () => {
      [880, 660, 880].forEach((frequency, index) => {
        const startAt = context.currentTime + index * 0.24;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.11, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.2);
      });
    };
    playEmergencyBeep();
    const timer = window.setInterval(playEmergencyBeep, 1800);
    return () => window.clearInterval(timer);
  }, [isBreakGlassSupervisor, emergencySoundEnabled, pendingBreakGlass.length]);

  // Modals state
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isMFAOpen, setIsMFAOpen] = useState(false);
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);

  // Redirect to login if user is unauthenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ lockoutMessage: authError }} />;
  }

  // Route Guard: If an Employee attempts to access Boss-only pages directly via URL bar
  const bossOnlyPaths = ['/audit', '/break-glass', '/admin/users', '/admin/devices', '/admin/device-registry'];
  const isTargetingBossPage = bossOnlyPaths.some(p => location.pathname.startsWith(p));
  if (isTargetingBossPage && !(isSupervisor || isITAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isITAdmin && ['/break-glass', '/admin/devices'].some(p => location.pathname.startsWith(p))) return <Navigate to="/dashboard" replace />;
  if (location.pathname.startsWith('/admin/users') && !isITAdmin) return <Navigate to="/dashboard" replace />;
  if (location.pathname.startsWith('/admin/device-registry') && !isITAdmin) return <Navigate to="/dashboard" replace />;
  if (location.pathname.startsWith('/system/documents') && !isITAdmin) return <Navigate to="/dashboard" replace />;

  // Organized sidebar navigation grouped by operational area
  const getSidebarSections = () => {
    const dashboardItem = { id: 'dashboard', label: 'Dashboard', icon: SlidersHorizontal, path: '/dashboard' };
    const casesItem = { id: 'cases', label: 'Cases & Evidence', icon: Briefcase, path: '/cases' };
    const uploadItem = { id: 'upload', label: 'Upload & Ingest', icon: FileText, path: '/upload' };
    const accessItem = { id: 'access', label: 'Request Access', icon: Key, path: '/access-requests' };

    const graphItem = { id: 'graph', label: 'Knowledge Graph', icon: GitFork, path: '/graph' };
    const ragItem = { id: 'rag', label: 'AI Evidence Assistant', icon: Cpu, path: '/rag' };
    const searchItem = { id: 'search', label: 'Evidence Search', icon: Search, path: '/cases' };
    const orgHierarchyItem = { id: 'org-hierarchy', label: 'Org Hierarchy', icon: Building, path: '/org-hierarchy' };

    const integrityItem = { id: 'integrity', label: 'Integrity Scanner', icon: ShieldCheck, path: '/integrity' };
    const auditItem = { id: 'audit', label: 'Audit Trail', icon: Lock, path: '/audit' };
    const alertsItem = { id: 'alerts', label: 'Security Alerts', icon: Bell, path: '/alerts' };
    const breakGlassItem = { id: 'break-glass', label: 'Break-Glass Access', icon: ShieldAlert, path: '/break-glass' };

    const usersItem = { id: 'admin-users', label: 'Users & Roles', icon: Users, path: '/admin/users' };
    const deviceRegistryItem = { id: 'device-registry', label: 'Device Registry', icon: HardDrive, path: '/admin/device-registry' };
    const devicesItem = { id: 'admin-devices', label: 'Device Approvals', icon: Smartphone, path: '/admin/devices' };
    const policiesItem = { id: 'admin-policies', label: 'System Policies', icon: Settings, path: '/admin' };

    // Employee interface — limited to core workflow + investigation
    if (isITAdmin) return [
      { title: 'SYSTEM', items: [dashboardItem, casesItem, { id: 'users', label: 'Users & Roles', icon: Users, path: '/admin/users' }, deviceRegistryItem, { id: 'org', label: 'Organization', icon: Building, path: '/org-hierarchy' }, { id: 'documents', label: 'Documents', icon: FileText, path: '/system/documents' }, graphItem, { id: 'integrity', label: 'Integrity Monitor', icon: ShieldCheck, path: '/integrity' }, accessItem, auditItem, alertsItem] }
    ];
    if (isSupervisor) {
      return [
        { title: 'OVERSIGHT', items: [dashboardItem, casesItem, { id: 'access', label: 'Access Requests & Approval Queue', icon: FileText, path: '/access-requests' }, alertsItem, auditItem, orgHierarchyItem] },
      ];
    }
    return [
      { title: 'CORE', items: [dashboardItem, casesItem, accessItem, { id: 'shared', label: 'Shared With Me', icon: Lock, path: '/cases' }, orgHierarchyItem] },
      { title: 'WORK', items: [uploadItem, graphItem, ragItem, searchItem] },
      { title: 'SECURITY', items: [integrityItem, alertsItem] },
    ];
  };

  const sidebarSections = getSidebarSections();

  const getClearanceBadge = (level) => {
    switch (level) {
      case 5: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Level 5 • Top Secret</span>;
      case 4: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Level 4 • Restricted</span>;
      case 3: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Level 3 • Field Officer</span>;
      case 2: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Level 2 • Field Staff</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Level 1 • Standard</span>;
    }
  };

  return (
    <div className="portal-shell min-h-screen text-[#334155] flex flex-col font-sans">
      {/* Network Security Context Bar */}
      <NetworkContextBanner />

      {/* Top Header Navigation */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="portal-emblem">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-lg tracking-tight">SākshyaChain</span>
                  <span className="portal-role-tag">
                    {isITAdmin ? 'IT ADMIN — ACCESS CUSTODIAN' : isSupervisor ? 'SUPERVISOR OVERSIGHT' : 'EMPLOYEE PORTAL'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:block font-medium">Digital Document & Legal Evidence System</div>
              </div>
            </Link>
          </div>

          {/* Right Controls & User Profile Pill */}
          <div className="flex items-center gap-2.5">
            {/* Boss-Only Header Controls: Break Glass Emergency & Security Alerts */}
            {isBoss && (
              <>
                <Link
                  to="/alerts"
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  title="Live Security Alerts"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </Link>
              </>
            )}

            {user && <button
              onClick={() => setIsBreakGlassOpen(true)}
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title={isITAdmin ? 'Monitor Break-Glass Emergency Requests' : isBreakGlassSupervisor ? 'Review Break-Glass Requests' : 'Request Break-Glass Emergency Access'}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isITAdmin ? 'Break-Glass Monitor' : isBreakGlassSupervisor ? 'Supervisor Approvals' : 'Break Glass'}</span>
            </button>}

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => isBoss && setIsUserSwitcherOpen(true)}
                  className={`flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2.5 transition-colors ${
                    isBoss ? 'hover:bg-slate-100 cursor-pointer' : 'cursor-default'
                  }`}
                  title={isBoss ? "Supervisor profile" : "Employee profile"}
                >
                  <div className="w-7 h-7 rounded-md font-bold flex items-center justify-center text-xs text-white bg-blue-600">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.role}</div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
        {/* Navigation shares this header container, forming one continuous header. */}
        <nav ref={navRef} className={`portal-nav ${mobileMenuOpen ? 'portal-nav-open' : ''}`} aria-label="Main navigation">
          <div className="portal-nav-inner">
            <Link className="portal-home" to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            {sidebarSections.map(section => (
              <details className="portal-menu" name="primary-navigation" key={section.title}>
                <summary>{section.title.charAt(0) + section.title.slice(1).toLowerCase()} <ChevronRight aria-hidden="true" /></summary>
                <div className="portal-dropdown">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    return <Link key={item.id} to={item.path} onClick={() => setMobileMenuOpen(false)} className={location.pathname.startsWith(item.path) ? 'portal-link-active' : ''}><Icon />{item.label}</Link>;
                  })}
                </div>
              </details>
            ))}
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
            <div className="portal-nav-actions">
              <Link
                to={`/access-requests?tab=${isSupervisor ? 'supervisor' : 'owner'}`}
                className="portal-nav-action relative"
                title="Access requests needing your approval"
                aria-label={`Access approval queue, ${pendingAccessRequests} pending`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                {pendingAccessRequests > 0 && <span className="portal-nav-badge">{pendingAccessRequests}</span>}
              </Link>
              <button onClick={() => setIsMFAOpen(true)} className="portal-nav-action" title="2-Factor MFA Verification">
                <Lock className="w-3.5 h-3.5" />
                <span>MFA Re-Auth</span>
              </button>
              {user && <button onClick={logout} className="portal-nav-action" title="Sign out & return to Login Page">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>}
            </div>
          </div>
        </nav>
      </header>

      {isITAdmin && tamperAlert && (
        <div role="alert" className="sticky top-[64px] z-30 flex flex-wrap items-center justify-between gap-3 bg-rose-700 px-4 py-3 text-white shadow-lg animate-pulse">
          <div className="flex items-center gap-3"><BellRing className="h-5 w-5" /><div><b>SECURITY ALARM — EVIDENCE TAMPERING</b><div className="text-xs">{tamperAlert.userName || tamperAlert.actor} · {tamperAlert.docId} · Account and evidence temporarily locked.</div></div></div>
          <div className="flex items-center gap-2"><button onClick={() => { setAlarmEnabled(true); playTamperAlarm(); }} className="rounded border border-white/60 px-3 py-1.5 text-xs font-bold">{alarmEnabled ? 'Play alarm' : 'Enable / play alarm'}</button><Link to={`/alerts?incident=${encodeURIComponent(tamperAlert.id)}`} onClick={() => { setAlarmEnabled(true); playTamperAlarm(); setTamperAlert(null); }} className="rounded bg-white px-3 py-1.5 text-xs font-bold text-rose-800">View incident</Link></div>
        </div>
      )}

      {accessNotice && (
        <div role="status" className="fixed top-20 right-4 z-50 max-w-sm rounded-xl border border-blue-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Access approval needed</p>
              <p className="mt-1 text-sm text-slate-700">{accessNotice.request.requester?.name || 'An employee'} requested access to {accessNotice.request.document?.title || 'a document'}.</p>
              <p className="mt-1 text-xs text-slate-500">You are the {accessNotice.role}. The queue refreshes every few seconds.</p>
              <button onClick={() => { setAccessNotice(null); navigate(`/access-requests?tab=${accessNotice.role === 'supervisor' ? 'supervisor' : 'owner'}`); }} className="mt-3 btn btn-primary text-xs">Review request</button>
            </div>
            <button onClick={() => setAccessNotice(null)} aria-label="Dismiss notification" className="text-slate-400 hover:text-slate-700">×</button>
          </div>
        </div>
      )}

      {isBreakGlassSupervisor && pendingBreakGlass.length > 0 && (
        <section role="alert" aria-live="assertive" className="fixed right-4 top-24 z-[1100] w-[min(26rem,calc(100vw-2rem))] rounded-xl border-2 border-rose-500 bg-rose-950 p-4 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <BellRing className="mt-0.5 h-5 w-5 shrink-0 animate-pulse text-amber-300" />
            <div className="min-w-0 flex-1">
              <h2 className="font-bold tracking-wide">EMERGENCY ACCESS REQUEST</h2>
              <p className="mt-1 text-sm">{pendingBreakGlass[0].userName} · {pendingBreakGlass[0].caseId}</p>
              <p className="mt-1 line-clamp-3 text-xs text-rose-100">{pendingBreakGlass[0].reason}</p>
              {pendingBreakGlass.length > 1 && <p className="mt-1 text-xs font-semibold text-amber-200">{pendingBreakGlass.length - 1} more request(s) awaiting review</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {!emergencySoundEnabled && <button onClick={enableEmergencySound} className="rounded-md bg-amber-300 px-3 py-2 text-xs font-bold text-slate-900">Enable emergency sound</button>}
                <button onClick={() => setIsBreakGlassOpen(true)} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-rose-900">Review request</button>
              </div>
              {emergencySoundEnabled && <p className="mt-2 text-[11px] text-rose-200">Emergency alarm repeats until pending requests are approved.</p>}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Outlet for Page Content */}
      <main className={`portal-content flex-1 min-w-0 px-6 py-6 overflow-x-hidden ${location.pathname === '/cases' || location.pathname.startsWith('/access-requests') ? 'portal-content-wide' : ''}`}>
        <Outlet />
      </main>

      {/* Global Modals (User Switcher only for Boss) */}
      {isBoss && (
        <UserSwitcherModal
          isOpen={isUserSwitcherOpen}
          onClose={() => setIsUserSwitcherOpen(false)}
        />
      )}

      <MFALoginModal
        isOpen={isMFAOpen}
        onClose={() => setIsMFAOpen(false)}
      />

      {isBoss && (
        <BreakGlassModal
          isOpen={isBreakGlassOpen}
          onClose={() => setIsBreakGlassOpen(false)}
        />
      )}

      {/* Footer Status Bar */}
      <footer className="bg-white border-t border-[#E2E8F0] py-3 text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            <span className="text-slate-700 font-semibold">SākshyaChain System Status:</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">REST API ONLINE</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors font-medium underline underline-offset-2">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-blue-600 transition-colors font-medium underline underline-offset-2">Terms of Service</Link>
            <span>•</span>
            <span>Role Isolation: <strong className={isITAdmin ? "text-blue-700" : isBoss ? "text-rose-600" : "text-blue-600"}>{isITAdmin ? "System Read-Only" : isBoss ? "Supervisor Oversight" : "Employee Operations"}</strong></span>
            <span>•</span>
            <span>AES-256 Vault: <strong className="text-slate-700">Encrypted at Rest</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
