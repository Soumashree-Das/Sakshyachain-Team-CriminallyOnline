import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HardDrive, Network, Plus, Info, UserPlus, CheckCircle2 } from 'lucide-react';

const emptyForm = { employeeId: '', name: '', contact: '', computerIp: '', role: 'POLICE_INVESTIGATOR', designation: '', policeStation: '', workLocation: '', caseId: '' };

export default function DeviceRegistryPage() {
  const { user, isITAdmin } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [cases, setCases] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isITAdmin) return;
    Promise.all([api.get('/auth/users'), api.get('/cases')]).then(([usersResponse, casesResponse]) => {
      setRegistrations((usersResponse.data.users || []).filter(item => item.systemRole !== 'IT_ADMIN' && item.employeeId));
      setCases(casesResponse.data.cases || []);
    }).catch(() => setError('Could not load staff and case details. Refresh and try again.'));
  }, [isITAdmin]);

  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const handleRegister = async event => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage(''); setTemporaryPassword(null);
    try {
      const response = await api.post('/auth/register-user', { ...form, assignedCases: form.caseId ? [form.caseId] : [] });
      setTemporaryPassword(response.data.temporaryPassword);
      setMessage(`${response.data.user.name} (${response.data.user.employeeId}) has been registered.`);
      setRegistrations(current => [response.data.user, ...current]);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not register this employee.');
    } finally { setSaving(false); }
  };

  if (!isITAdmin) return <section className="white-card border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-900">This page is available to IT Admin only.</section>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div><div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700"><HardDrive className="h-4 w-4" /> IT Admin · staff and device management</div><h1 className="text-2xl font-bold text-slate-900">Register employee</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Register an employee ID and contact detail against the IP address of their assigned computer.</p></div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-800">PROTOTYPE REGISTRATION</span>
      </header>

      {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}
      {temporaryPassword && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-950"><CheckCircle2 className="h-4 w-4" />Temporary password — copy and share securely</div><code className="mt-2 block select-all font-mono text-lg font-bold text-slate-900">{temporaryPassword}</code><p className="mt-1 text-xs text-amber-900">This password is shown only once. The employee signs in with their employee ID and enters the fixed prototype OTP from the README.</p></div>}

      <section className="white-card border border-slate-200 p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserPlus className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Employee details</h2><p className="text-xs text-slate-500">Required: employee ID, name, contact, and computer IP.</p></div></div>
        <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Employee ID<input required name="employeeId" maxLength={32} value={form.employeeId} onChange={change} placeholder="e.g. POL-206" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Full name<input required name="name" maxLength={100} value={form.name} onChange={change} placeholder="Employee name" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Contact detail<input required name="contact" maxLength={120} value={form.contact} onChange={change} placeholder="Email or phone number" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Assigned computer IP<input required name="computerIp" maxLength={45} value={form.computerIp} onChange={change} placeholder="e.g. 10.20.10.25" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Staff role<select name="role" value={form.role} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="POLICE_INVESTIGATOR">Police investigator</option><option value="FORENSIC_SPECIALIST">Forensic specialist</option><option value="PUBLIC_PROSECUTOR">Public prosecutor</option></select></label>
          <label className="block text-xs font-semibold text-slate-700">Designation<input name="designation" maxLength={100} value={form.designation} onChange={change} placeholder="e.g. Sub-Inspector" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Police station<input name="policeStation" maxLength={120} value={form.policeStation} onChange={change} placeholder="For police staff" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Work location<input name="workLocation" maxLength={120} value={form.workLocation} onChange={change} placeholder="Office, lab, or court" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700 md:col-span-2">Initial case assignment <span className="font-normal text-slate-400">(optional)</span><select name="caseId" value={form.caseId} onChange={change} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">No case assigned yet</option>{cases.map(item => <option key={item.id} value={item.id}>{item.firNumber || item.id} · {item.title}</option>)}</select></label>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 md:col-span-2"><Plus className="h-4 w-4" />{saving ? 'Registering…' : 'Register employee'}</button>
        </form>
      </section>

      <aside className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-950"><div className="mb-1 flex items-center gap-2 font-bold"><Info className="h-4 w-4" />Prototype behavior</div>Registration is stored in the local prototype database. A temporary password is generated and shown once; OTP verification uses the fixed code documented in the README. The assigned IP is recorded for the demonstration and is not used as a live network firewall rule.</aside>

      <section className="white-card border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Registered employees</h2><p className="text-xs text-slate-500">{registrations.length} prototype accounts</p></div><Network className="h-5 w-5 text-slate-400" /></div>
        {registrations.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No registered employee accounts.</div> : <div className="mt-4 divide-y divide-slate-100">{registrations.map(item => <div key={item.id} className="grid gap-2 py-3 text-sm sm:grid-cols-4"><div><div className="font-semibold text-slate-900">{item.name}</div><div className="font-mono text-xs text-slate-500">{item.employeeId} · {item.roleTitle}</div></div><div className="text-xs text-slate-600">{item.contact || '—'}</div><div className="font-mono text-xs text-slate-600">{item.assignedIp || 'IP not recorded'}</div><div className="text-xs text-slate-600">{item.policeStation || item.workLocation || item.departmentName}</div></div>)}</div>}
      </section>
    </div>
  );
}
