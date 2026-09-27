import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Database, Search, Filter, Plus, ChevronRight, Lock, ShieldCheck, FileText, Download, Eye, CheckCircle2, RotateCcw } from 'lucide-react';
import DocumentViewerModal from '../components/DocumentViewerModal';

export default function CaseListPage({ navigateTo: propNavigateTo }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'documents'
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedDocModal, setSelectedDocModal] = useState(null);

  const handleNavigateCase = (caseId) => {
    if (propNavigateTo) return propNavigateTo('cases', caseId);
    navigate(`/cases/${caseId}`);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [casesRes, docsRes] = await Promise.all([
          api.get('/cases'),
          api.get('/documents')
        ]);
        setCases(casesRes.data.cases || []);
        setDocuments(docsRes.data.documents || []);
      } catch (err) {
        console.error('Failed to load cases and documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleDownloadDoc = async (docObj, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await api.get(`/documents/${docObj.id}/download`, { responseType: 'blob' });
      const type = response.headers['content-type'] || docObj.mimeType || 'application/pdf';
      const blob = new Blob([response.data], { type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = docObj.originalFileName || (docObj.title ? `${docObj.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${docObj.id}.pdf`);
      if (!/\.(pdf|txt|docx|json)$/i.test(filename)) {
        filename += '.pdf';
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download restricted: ${err.response?.data?.message || 'Unauthorized clearance'}`);
    }
  };

  const queryLower = searchQuery.toLowerCase().trim();

  // Search filtering logic for cases
  const filteredCases = cases.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    // Check if case ID, title, or FIR matches
    const caseMatch = c.title.toLowerCase().includes(queryLower) ||
                      c.id.toLowerCase().includes(queryLower) ||
                      (c.firNumber && c.firNumber.toLowerCase().includes(queryLower));

    // Check if any document inside this case matches search query
    const docMatch = documents.some(d => d.caseId === c.id && (
      (d.title && d.title.toLowerCase().includes(queryLower)) ||
      (d.id && d.id.toLowerCase().includes(queryLower)) ||
      (d.originalFileName && d.originalFileName.toLowerCase().includes(queryLower)) ||
      (d.category && d.category.toLowerCase().includes(queryLower))
    ));

    return matchesStatus && (caseMatch || docMatch);
  });

  // Search filtering logic for documents
  const filteredDocs = documents.filter(d => {
    const matchesSearch = !queryLower ||
      (d.title && d.title.toLowerCase().includes(queryLower)) ||
      (d.id && d.id.toLowerCase().includes(queryLower)) ||
      (d.caseId && d.caseId.toLowerCase().includes(queryLower)) ||
      (d.category && d.category.toLowerCase().includes(queryLower)) ||
      (d.originalFileName && d.originalFileName.toLowerCase().includes(queryLower));

    return matchesSearch;
  });

  return (
    <div className="case-list-page space-y-6">
      {/* Header Toolbar */}
      <div className="white-card p-4 border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cases'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Legal Cases ({cases.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-cyan-300" />
              <span>All Vault Documents ({documents.length})</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/upload')}
            className="btn btn-primary text-xs flex items-center gap-2 py-2 px-4 font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>+ Upload Legal Evidence</span>
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by FIR, Case ID (e.g. CASE-2026-8891), Document Title, File Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs"
            />
          </div>

          {activeTab === 'cases' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field case-filter-select py-2 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_TRIAL">Under Trial</option>
              <option value="INVESTIGATION_IN_PROGRESS">Investigation In Progress</option>
              <option value="CHARGE_SHEET_FILED">Charge Sheet Filed</option>
            </select>
          )}

          {(searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="btn btn-secondary text-xs flex items-center gap-1.5 py-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="white-card p-12 text-center text-slate-400 font-mono text-xs">
          Loading clearance-filtered legal cases & vault storage index...
        </div>
      ) : activeTab === 'cases' ? (
        /* Case Cards View */
        <div className="case-card-grid">
          {filteredCases.length === 0 ? (
            <div className="white-card p-12 text-center space-y-3 border border-slate-200">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-base">No Matching Cases Found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No legal cases match query "{searchQuery}" under your clearance authorization.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="btn btn-primary text-xs inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset Search & Show All Cases
              </button>
            </div>
          ) : (
            filteredCases.map(c => {
              const caseDocs = documents.filter(d => d.caseId === c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => handleNavigateCase(c.id)}
                  className="white-card case-card p-5 border border-slate-200 white-card-hover cursor-pointer space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base font-mono">{c.firNumber || c.id}</span>
                      <span className="badge badge-info font-mono">{c.status}</span>
                      <span className="badge badge-purple text-[10px]">{caseDocs.length} Documents</span>
                    </div>
                    <span className="badge badge-clearance-3 shrink-0">Clearance L{c.clearanceRequired} Required</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg">{c.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                  {/* Document pills attached to this case */}
                  {caseDocs.length > 0 && (
                    <div className="case-file-list pt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">Case Files:</span>
                      {caseDocs.map(d => (
                        <div
                          key={d.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocModal(d);
                          }}
                          className="case-file-chip bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-1.5 px-2.5 rounded-lg text-xs flex items-center gap-2 font-mono transition-colors text-slate-800"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-bold">{d.title}</span>
                          <span className="text-[10px] text-slate-400">({d.id})</span>
                          {d.access?.canDownload && <button
                            onClick={(ev) => handleDownloadDoc(d, ev)}
                            title="Download Decrypted PDF"
                            className="p-1 hover:bg-blue-600 hover:text-white rounded transition-colors text-slate-500 ml-1"
                          >
                            <Download className="w-3 h-3" />
                          </button>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="case-card-footer pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 font-sans">
                    <div>Lead Officer: <strong className="text-slate-800">{c.leadInvestigator}</strong> • Prosecutor: <strong className="text-slate-800">{c.prosecutor}</strong></div>
                    <div className="flex items-center gap-1 text-blue-600 font-bold hover:underline">
                      View Case Directory & Evidence Vault <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Vault Documents Tab View */
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="white-card p-12 text-center space-y-3 border border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-base">No Vault Documents Found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No encrypted vault documents match search query "{searchQuery}".
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary text-xs inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Clear Search
              </button>
            </div>
          ) : (
            filteredDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocModal(doc)}
                className="white-card p-4 border border-slate-200 hover:border-blue-400 cursor-pointer flex flex-wrap items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-sans">{doc.title}</span>
                      <span className="badge badge-info font-mono text-[10px]">{doc.id}</span>
                      <span className="badge badge-success font-mono text-[10px]">v{doc.version || '1.0'}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                      <span>Case: <strong className="text-blue-700">{doc.caseId}</strong></span>
                      <span>•</span>
                      <span>Category: {doc.category}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">✓ AES-256 Encrypted & Stored in DB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.access?.canDownload && <button
                    onClick={(e) => handleDownloadDoc(doc, e)}
                    className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <Download className="w-4 h-4" /> Download Decrypted File
                  </button>}
                  <button
                    onClick={() => setSelectedDocModal(doc)}
                    className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDocModal && (
        <DocumentViewerModal
          doc={selectedDocModal}
          isOpen={!!selectedDocModal}
          onClose={() => setSelectedDocModal(null)}
        />
      )}
    </div>
  );
}
