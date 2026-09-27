import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Clock3, ShieldCheck, Download, Eye, Pencil, RefreshCw } from 'lucide-react';

const Panel = ({ title, children }) => <section className="white-card p-5 border border-slate-200 space-y-4"><h2 className="font-bold text-slate-900">{title}</h2>{children}</section>;

export default function AccessRequestsPage() {
  const { user, isITAdmin, isSupervisor, allUsers } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]); const [documents, setDocuments] = useState([]); const [permissions, setPermissions] = useState([]); const [abnormalities, setAbnormalities] = useState([]);
  const [documentId, setDocumentId] = useState(''); const [caseId, setCaseId] = useState(''); const [reason, setReason] = useState(''); const [permission, setPermission] = useState('DOWNLOAD'); const [durationHours, setDurationHours] = useState(''); const [message, setMessage] = useState(''); const [submitting, setSubmitting] = useState(false); const [actingRequestId, setActingRequestId] = useState(null);
  const [decryptingRequestId, setDecryptingRequestId] = useState(null);
  const [adminGrant, setAdminGrant] = useState({ userId: '', documentId: '', permission: 'VIEW', durationHours: '' });
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(isITAdmin ? 'system' : requestedTab || 'request');
  const refresh = async () => { const [r, d, p, a] = await Promise.all([api.get('/access-requests'), isITAdmin ? api.get('/documents') : api.get('/access-requests/requestable-documents'), api.get('/access-requests/permissions'), api.get('/access-requests/abnormalities')]); setRequests(r.data.requests || []); setDocuments(d.data.documents || []); setPermissions(p.data.permissions || []); setAbnormalities(a.data.abnormalities || []); };
  useEffect(() => { refresh().catch(e => setMessage(e.response?.data?.message || 'Unable to load access workflow.')); }, []);
  useEffect(() => {
    const availableTabs = ['request', 'history', 'owner', ...(isSupervisor ? ['supervisor'] : [])];
    if (!isITAdmin && availableTabs.includes(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab, isITAdmin, isSupervisor]);
  useEffect(() => {
    const pollQueue = async () => {
      try { const response = await api.get('/access-requests'); setRequests(response.data.requests || []); } catch { /* The current view remains usable if the API is temporarily offline. */ }
    };
    const timer = setInterval(pollQueue, 4000);
    return () => clearInterval(timer);
  }, []);
  const myRequests = useMemo(() => requests.filter(r => r.requesterId === user?.id), [requests, user]);
  const supervisorRequests = useMemo(() => requests.filter(r => r.supervisorId === user?.id && r.supervisorDecision === 'PENDING'), [requests, user]);
  const ownedRequests = useMemo(() => requests.filter(r => r.ownerId === user?.id), [requests, user]);
  const supervisedRequests = useMemo(() => requests.filter(r => r.supervisorId === user?.id), [requests, user]);
  const act = async (request, decision) => { setActingRequestId(request.id); setMessage(`Recording ${decision.toLowerCase()} decision…`); try { const response = await api.post(`/access-requests/${request.id}/decision`, { decision }); setMessage(response.data.message || (decision === 'REJECTED' ? `Access denied by ${user.id === request.ownerId ? 'file owner' : 'supervisor'}.` : `${user.id === request.ownerId ? 'Owner' : 'Supervisor'} approval recorded.`)); await refresh().catch(() => {}); } catch (e) { setMessage(e.response?.data?.message || e.response?.data?.error || 'Decision failed. Check that you are signed in as the assigned approver, then refresh the queue.'); } finally { setActingRequestId(null); } };
  const handleGrantedAction = async request => {
    const shouldShowDecryption = user?.id === 'USR-POL-101' || user?.username === 'sharma_leo';
    if (shouldShowDecryption) {
      setDecryptingRequestId(request.id);
      const delayMs = 3000 + Math.floor(Math.random() * 3001);
      await new Promise(resolve => window.setTimeout(resolve, delayMs));
    }

    if (request.permission === 'DOWNLOAD') {
      try {
        const response = await api.get(`/documents/${request.documentId}/download`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = request.document?.originalFileName || `${(request.document?.title || request.documentId).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        setMessage('Approved file download started.');
      } catch (error) {
        setMessage(error.response?.data?.message || 'The approved download could not be started.');
      } finally {
        if (shouldShowDecryption) setDecryptingRequestId(null);
      }
      return;
    }
    if (shouldShowDecryption) setDecryptingRequestId(null);
    navigate(`/docs/${request.documentId}?mode=${request.permission.toLowerCase()}`);
  };
  const submit = async e => { e.preventDefault(); setSubmitting(true); setMessage('Sending your access request...'); try { const r = await api.post('/access-requests', { documentId, caseId, reason, permission, ...(durationHours ? { durationHours: Number(durationHours) } : {}) }); setMessage(`Request ${r.data.request.id} sent. Waiting for owner and supervisor approval.`); setReason(''); await refresh(); setActiveTab('history'); } catch (err) { setMessage(err.response?.data?.message || err.response?.data?.error || 'Request failed.'); } finally { setSubmitting(false); } };
  const grantEmployeeAccess = async e => { e.preventDefault(); setSubmitting(true); try { const response = await api.post('/access-requests/admin/grant', { ...adminGrant, ...(adminGrant.durationHours ? { durationHours: Number(adminGrant.durationHours) } : {}) }); setMessage(response.data.message); setAdminGrant({ ...adminGrant, durationHours: '' }); await refresh(); } catch (error) { setMessage(error.response?.data?.message || error.response?.data?.error || 'Could not grant access.'); } finally { setSubmitting(false); } };
  const revokeEmployeeAccess = async grant => { try { const response = await api.post('/access-requests/admin/revoke', { userId: grant.userId, documentId: grant.documentId, permission: grant.permission }); setMessage(response.data.message); await refresh(); } catch (error) { setMessage(error.response?.data?.message || error.response?.data?.error || 'Could not revoke access.'); } };
  const logAbnormality = async r => { const remark = window.prompt('Add an abnormality remark for this rejected request:'); if (remark === null) return; try { await api.post(`/access-requests/${r.id}/abnormality`, { remark }); setMessage('Abnormality recorded as a new audit event. Original events were not changed.'); await refresh(); } catch (e) { setMessage(e.response?.data?.error || 'Unable to log abnormality.'); } };
  const card = r => <article key={r.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><strong>{r.document?.title || r.documentId}</strong><span className="text-xs font-mono text-slate-500">{r.status}</span></div>
    <div className="grid md:grid-cols-2 gap-2 text-xs text-slate-600"><p>Requester: <b>{r.requester?.name || r.requesterId}</b> · {r.requester?.role} · {r.requester?.departmentName || r.requester?.department}</p><p>Owner: <b>{r.owner?.name || r.ownerId}</b></p><p>Supervisor: <b>{r.supervisor?.name || r.supervisorId}</b></p><p>Requested permission: <b>{r.permission}</b> · {r.expiresAt ? `until ${new Date(r.expiresAt).toLocaleString()}` : 'no expiry'}</p><p>Reason: {r.reason}</p></div>
    <div className="flex flex-wrap gap-3 text-xs"><span>Owner {r.ownerDecision === 'APPROVED' ? '✓ APPROVED' : r.ownerDecision === 'REJECTED' ? '✕ REJECTED' : '◷ PENDING'}</span><span>Supervisor {r.supervisorDecision === 'APPROVED' ? '✓ APPROVED' : r.supervisorDecision === 'REJECTED' ? '✕ REJECTED' : '◷ PENDING'}</span><span>RBAC/ABAC {r.requester && r.document ? (r.requester.clearanceLevel >= r.document.clearanceLevel ? '✓ PASS' : '✕ FAIL') : 'evaluated by policy'}</span></div>
    {r.approvals?.length > 0 && <div className="text-[11px] text-slate-500">Approval trail: {r.approvals.map(a=>`${a.approverType} ${a.decision} · ${new Date(a.timestamp).toLocaleString()}`).join(' → ')}</div>}
    <div className="rounded-lg bg-slate-50 p-3 text-xs"><b>Access decision:</b> {r.status === 'GRANTED' ? '🟢 ACCESS GRANTED' : r.status === 'REJECTED' || r.status === 'DENIED' ? '🔴 ACCESS DENIED — one required approval was denied or policy eligibility failed.' : 'WAITING FOR APPROVAL'}</div>
    {r.status === 'GRANTED' && user?.id === r.requesterId && <button disabled={!!decryptingRequestId} onClick={() => handleGrantedAction(r)} className="btn btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-60">{r.permission === 'DOWNLOAD' ? <><Download className="w-4 h-4"/>Download approved file</> : r.permission === 'EDIT' ? <><Pencil className="w-4 h-4"/>Open in edit mode</> : <><Eye className="w-4 h-4"/>Open view-only</>}</button>}
    {user?.id === r.ownerId && r.ownerDecision === 'PENDING' && <div className="flex gap-2"><button disabled={actingRequestId === r.id} onClick={() => act(r, 'APPROVED')} className="btn btn-success text-xs disabled:opacity-60"><CheckCircle2 className="inline w-4 h-4 mr-1"/>{actingRequestId === r.id ? 'Saving…' : 'Approve'}</button><button disabled={actingRequestId === r.id} onClick={() => act(r, 'REJECTED')} className="btn text-xs bg-rose-50 text-rose-700 disabled:opacity-60"><XCircle className="inline w-4 h-4 mr-1"/>Reject</button></div>}
    {user?.id === r.supervisorId && r.supervisorDecision === 'PENDING' && (r.ownerDecision === 'APPROVED' ? <div className="flex gap-2"><button disabled={actingRequestId === r.id} onClick={() => act(r, 'APPROVED')} className="btn btn-success text-xs disabled:opacity-60"><CheckCircle2 className="inline w-4 h-4 mr-1"/>{actingRequestId === r.id ? 'Saving…' : 'Approve'}</button><button disabled={actingRequestId === r.id} onClick={() => act(r, 'REJECTED')} className="btn text-xs bg-rose-50 text-rose-700 disabled:opacity-60"><XCircle className="inline w-4 h-4 mr-1"/>Reject</button></div> : <p className="text-xs text-slate-500">Supervisor decision opens after owner approval.</p>)}
  </article>;
  const tabs = isITAdmin ? [['system','System requests'],['permissions','Permissions'],['abnormalities','Abnormalities']] : [['request','Request access'],['history','My requests'],['owner','Owner requests'],...(isSupervisor ? [['supervisor','Supervisor requests']] : [])];
  const tabButton = ([id,label]) => <button key={id} onClick={()=>setActiveTab(id)} className={`px-3 py-2 rounded-lg text-xs font-semibold border ${activeTab===id?'bg-blue-50 border-blue-300 text-blue-800':'border-slate-200 text-slate-600'}`}>{label}</button>;
  return <div className="access-requests-page space-y-6">{decryptingRequestId && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="status" aria-live="polite"><div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-8 text-center shadow-2xl"><RefreshCw className="mx-auto h-12 w-12 animate-spin text-blue-600"/><h2 className="mt-5 text-lg font-bold text-slate-900">Please wait till the document is decrypted</h2><p className="mt-2 text-sm text-slate-600">Secure document preparation is in progress…</p></div></div>}<header className="white-card p-5 border border-slate-200"><div className="flex gap-3 items-center"><ShieldCheck className="text-blue-600"/><div><h1 className="text-xl font-bold">Triangular File Access</h1><p className="text-xs text-slate-600">Role determines eligibility. Ownership determines control. Both approvals determine exceptional access. Every decision is auditable.</p></div></div></header>
    {message && <div role="status" className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm">{message}</div>}
    <section className="access-flow-diagram white-card" aria-label="Access approval flow">
      <div className="access-flow-main">
        <div className="access-flow-step"><b>REQUESTER</b><span>RBAC / ABAC eligibility</span></div>
        <span className="access-flow-arrow" aria-hidden="true">→</span>
        <div className="access-flow-step access-flow-request"><b>ACCESS REQUEST</b><span>Reason · permission · duration</span><strong>Both approvals required</strong></div>
        <span className="access-flow-arrow" aria-hidden="true">→</span>
        <div className="access-flow-step"><b>FILE OWNER</b><span>Controls their file</span></div>
      </div>
      <div className="access-flow-supervisor"><b>SUPERVISOR / AUTHORITY</b><span>Independent oversight approval</span></div>
    </section>
    <nav className="flex flex-wrap gap-2">{tabs.map(tabButton)}</nav>
    {activeTab==='request' && <Panel title="REQUEST ACCESS"><form onSubmit={submit} className="grid md:grid-cols-2 gap-3"><label className="text-xs">Case<select required value={caseId} onChange={e=>{setCaseId(e.target.value);setDocumentId('');}} className="mt-1 w-full border rounded p-2"><option value="">Choose a case</option>{[...new Set(documents.map(d=>d.caseId))].map(id=><option key={id} value={id}>{documents.find(d=>d.caseId===id)?.caseTitle || id}</option>)}</select></label><label className="text-xs">File<select required value={documentId} onChange={e=>setDocumentId(e.target.value)} className="mt-1 w-full border rounded p-2"><option value="">Choose a file</option>{documents.filter(d=>!caseId || d.caseId===caseId).map(d=><option key={d.id} value={d.id}>{d.title} · {d.id}</option>)}</select></label><label className="text-xs">Requested permission<select value={permission} onChange={e=>setPermission(e.target.value)} className="mt-1 w-full border rounded p-2">{['DOWNLOAD','VIEW','EDIT','SHARE'].map(p=><option key={p}>{p}</option>)}</select></label><label className="text-xs">Duration (optional)<select value={durationHours} onChange={e=>setDurationHours(e.target.value)} className="mt-1 w-full border rounded p-2"><option value="">Until revoked</option><option value="24">24 hours</option><option value="168">7 days</option><option value="720">30 days</option></select></label><label className="text-xs md:col-span-2">Reason<textarea required value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 w-full border rounded p-2" rows="2" placeholder="Why is access needed?"/></label><button disabled={submitting} className="btn btn-primary text-xs md:col-span-2 disabled:opacity-60" type="submit">{submitting ? 'SENDING REQUEST…' : 'SEND ACCESS REQUEST'}</button></form></Panel>}
    {activeTab==='history' && <Panel title="REQUESTER — MY ACCESS HISTORY">{myRequests.length ? <div className="access-request-grid">{myRequests.map(card)}</div> : <p className="text-xs text-slate-500">No requests yet.</p>}</Panel>}
    {activeTab==='owner' && <Panel title="OWNER REQUESTS">{ownedRequests.length ? <div className="access-request-grid">{ownedRequests.map(card)}</div> : <p className="text-xs text-slate-500">No requests for your files.</p>}</Panel>}
    {activeTab==='supervisor' && isSupervisor && <Panel title="SUPERVISOR REQUESTS"><h3 className="font-semibold text-sm">Approval Queue</h3>{supervisorRequests.length ? <div className="access-request-grid">{supervisorRequests.map(card)}</div> : <p className="text-xs text-slate-500">No pending approvals.</p>}<h3 className="font-semibold text-sm pt-3">FLAGGED ACTIVITY</h3>{supervisedRequests.filter(r=>r.status==='REJECTED').length ? <div className="access-request-grid">{supervisedRequests.filter(r=>r.status==='REJECTED').map(r=>{const logs=abnormalities.filter(a=>a.requestId===r.id); return <div key={`flag-${r.id}`} className="p-3 border rounded-lg flex justify-between items-center text-xs gap-3"><span>{r.requester?.name || r.requesterId} · {r.document?.title || r.documentId} · Access rejected{logs.map(a=><small key={a.id} className="block text-slate-500">Logged: {a.remark || 'No remark'} · {new Date(a.timestamp).toLocaleString()}</small>)}</span>{!logs.length && <button onClick={()=>logAbnormality(r)} className="btn text-xs bg-amber-50 text-amber-800">LOG ABNORMALITY / ADD REMARK</button>}</div>})}</div> : <p className="text-xs text-slate-500">No rejected requests in your supervisory scope.</p>}</Panel>}
    {activeTab==='system' && isITAdmin && <Panel title="SYSTEM REQUEST RECORDS — READ ONLY">{requests.length ? <div className="access-request-grid">{requests.map(card)}</div> : <p className="text-xs text-slate-500">No requests recorded.</p>}</Panel>}
    {activeTab==='permissions' && isITAdmin && <Panel title="EMPLOYEE ACCESS — GRANT OR REVOKE"><form onSubmit={grantEmployeeAccess} className="grid md:grid-cols-4 gap-3 p-3 border rounded-lg bg-slate-50"><label className="text-xs">Employee<select required value={adminGrant.userId} onChange={e=>setAdminGrant({...adminGrant,userId:e.target.value})} className="mt-1 w-full border rounded p-2"><option value="">Select employee</option>{allUsers.filter(u=>u.systemRole!=='IT_ADMIN').map(u=><option key={u.id} value={u.id}>{u.name} · {u.id}</option>)}</select></label><label className="text-xs">Evidence<select required value={adminGrant.documentId} onChange={e=>setAdminGrant({...adminGrant,documentId:e.target.value})} className="mt-1 w-full border rounded p-2"><option value="">Select evidence</option>{documents.map(d=><option key={d.id} value={d.id}>{d.title} · {d.id}</option>)}</select></label><label className="text-xs">Permission<select value={adminGrant.permission} onChange={e=>setAdminGrant({...adminGrant,permission:e.target.value})} className="mt-1 w-full border rounded p-2">{['VIEW','DOWNLOAD','EDIT','SHARE'].map(p=><option key={p}>{p}</option>)}</select></label><label className="text-xs">Duration<select value={adminGrant.durationHours} onChange={e=>setAdminGrant({...adminGrant,durationHours:e.target.value})} className="mt-1 w-full border rounded p-2"><option value="">Until revoked</option><option value="24">24 hours</option><option value="168">7 days</option><option value="720">30 days</option></select></label><button disabled={submitting} className="btn btn-primary text-xs md:col-span-4" type="submit">{submitting ? 'Saving…' : 'Grant employee access'}</button></form>{permissions.length ? permissions.map(p=><div key={`${p.userId}-${p.documentId}-${p.permission}-${p.grantedByRequest || p.id}`} className="p-3 border rounded-lg text-xs flex flex-wrap items-center justify-between gap-3"><span><b>{p.document?.title || p.documentId}</b><span className="block text-slate-500">{p.user?.name || p.userId} · {p.permission} · {p.expiresAt ? `expires ${new Date(p.expiresAt).toLocaleString()}` : 'no expiry'}</span></span><button onClick={()=>revokeEmployeeAccess(p)} className="btn text-xs bg-rose-50 text-rose-700 border border-rose-200">Revoke access</button></div>) : <p className="text-xs text-slate-500">No explicit grants yet.</p>}</Panel>}
    {activeTab==='abnormalities' && isITAdmin && <Panel title="ABNORMALITY LOG — READ ONLY">{abnormalities.length ? abnormalities.map(a=><div key={a.id} className="p-3 border rounded-lg text-xs"><b>{a.documentId}</b> · {a.actorName} · {new Date(a.timestamp).toLocaleString()}<p>{a.remark || 'No remark'}</p></div>) : <p className="text-xs text-slate-500">No abnormality records yet.</p>}</Panel>}
    <div className="text-xs text-slate-500 flex items-center gap-2"><Clock3 className="w-4 h-4"/> Owner approval and supervisor approval are independent. Any rejection blocks access.</div>
  </div>;
}
