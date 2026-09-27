import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Database, FileText, Clock, Lock, ArrowLeft, Plus, Eye, Key, CheckCircle2, Download } from 'lucide-react';
import DocumentViewerModal from '../components/DocumentViewerModal';
import DigitalSignerModal from '../components/DigitalSignerModal';
import UploadModal from '../components/UploadModal';

export default function CaseDetailPage({ caseId: propCaseId, navigateTo: propNavigateTo }) {
  const { id: routeCaseId } = useParams();
  const navigate = useNavigate();
  const caseId = propCaseId || routeCaseId || 'CASE-2026-8891';

  const { user, isBoss } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [caseObj, setCaseObj] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedDocViewer, setSelectedDocViewer] = useState(null);
  const [selectedDocSigner, setSelectedDocSigner] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const [casesRes, docsRes] = await Promise.all([
        api.get('/cases'),
        api.get(`/documents?caseId=${caseId}`)
      ]);
      const found = (casesRes.data.cases || []).find(c => c.id === caseId);
      setCaseObj(found || casesRes.data.cases[0]);
      setDocuments(docsRes.data.documents || []);
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [caseId, user]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/cases')} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Case Directory
      </button>

      {/* Case Header Banner */}
      <div className="white-card p-6 border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="badge badge-info font-mono text-xs">{caseObj?.firNumber || caseId}</span>
            <span className="badge badge-success font-mono">{caseObj?.status || 'UNDER_TRIAL'}</span>
          </div>
          <span className="badge badge-clearance-3">Clearance L{caseObj?.clearanceRequired || 3} Required</span>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{caseObj?.title || 'State vs. Cyber Syndicate'}</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{caseObj?.description}</p>

        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div>Lead Investigator: <strong className="text-slate-900">{caseObj?.leadInvestigator}</strong></div>
          <div>Public Prosecutor: <strong className="text-slate-900">{caseObj?.prosecutor}</strong></div>
          <div>Presiding Magistrate: {isBoss ? <strong className="text-rose-700">{caseObj?.presidingJudge}</strong> : <span className="font-mono text-slate-400 italic">[RESTRICTED - BOSS EYES ONLY]</span>}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'documents' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Case Documents ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Overview & Jurisdiction
        </button>

        {isBoss && (
          <button
            onClick={() => navigate('/audit')}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" /> Audit DAG Graph ➔
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Legal Case Evidence Files</h3>
            <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Case Document
            </button>
          </div>

          <div className="case-document-grid">
            {documents.map(doc => (
              <div key={doc.id} className="white-card case-document-card p-4 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="case-document-info space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="case-document-title font-bold text-slate-900 text-sm">{doc.title}</span>
                    <span className="badge badge-success font-mono text-[10px]">v{doc.version || '1.0'}</span>
                  </div>
                  <div className="case-document-meta text-slate-500">Doc ID: <span className="font-mono text-slate-700">{doc.id}</span> • Author: {doc.authorName} ({doc.department})</div>
                </div>

                <div className="case-document-actions flex items-center gap-3">
                  {doc.signature ? (
                    <span className="badge badge-success flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RSA Verified
                    </span>
                  ) : (
                    <span className="badge badge-warning">Unsigned</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedDocViewer(doc)} className="btn btn-secondary py-1 px-2.5 text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-600" /> {isBoss ? 'View & Verify' : 'View File'}
                    </button>

                    {/* Signature Option: STRICTLY BOSS ROLE PRIVILEGE */}
                    {isBoss && (
                      <button onClick={() => setSelectedDocSigner(doc)} className="btn btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 border-rose-300 text-rose-700 hover:bg-rose-50">
                        <Key className="w-3.5 h-3.5 text-rose-600" /> Apply Signature
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="white-card p-6 border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-sm">Case Summary & Jurisdiction</div>
          <p className="text-slate-600 leading-relaxed">{caseObj?.description}</p>
        </div>
      )}

      {/* Render Active Modals */}
      {selectedDocViewer && (
        <DocumentViewerModal
          doc={selectedDocViewer}
          isOpen={!!selectedDocViewer}
          onClose={() => setSelectedDocViewer(null)}
        />
      )}

      {selectedDocSigner && (
        <DigitalSignerModal
          doc={selectedDocSigner}
          isOpen={!!selectedDocSigner}
          onClose={() => setSelectedDocSigner(null)}
          onSigned={loadCaseData}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploaded={loadCaseData}
        />
      )}
    </div>
  );
}
