import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const API_BASE = 'https://api.imaging.smartcareplus.in';

const SECTIONS = [
  { key: 'clinicalIndication', label: 'Clinical Indication' },
  { key: 'findings',           label: 'Findings' },
  { key: 'impression',         label: 'Impression' },
  { key: 'patientSummary',     label: 'Patient Summary' },
  { key: 'recommendations',    label: 'Recommendations' },
];

const EMPTY_REPORT = {
  clinicalIndication: '',
  findings: '',
  impression: '',
  patientSummary: '',
  recommendations: '',
  status: 'draft' as 'draft' | 'final',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
    >
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

// ── AI Source selection dialog ─────────────────────────────────────────────────
function AIDialog({
  noteText,
  report,
  onGenerate,
  onClose,
  loading,
}: {
  noteText: string;
  report: Record<string, string>;
  onGenerate: (source: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const SOURCE_OPTIONS = [
    { key: 'notes',              label: 'Study Notes',          value: noteText },
    { key: 'clinicalIndication', label: 'Clinical Indication',  value: report.clinicalIndication },
    { key: 'findings',           label: 'Findings',             value: report.findings },
    { key: 'impression',         label: 'Impression',           value: report.impression },
    { key: 'recommendations',    label: 'Recommendations',      value: report.recommendations },
  ];

  const [selected, setSelected] = useState<Record<string, boolean>>({ notes: true });
  const [extraContext, setExtraContext] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const toggle = (key: string) => setSelected(prev => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = () => {
    const parts: string[] = SOURCE_OPTIONS
      .filter(o => selected[o.key] && o.value?.trim())
      .map(o => `${o.label}:\n${o.value.trim()}`);
    if (showExtra && extraContext.trim()) {
      parts.push(`Additional Context:\n${extraContext.trim()}`);
    }
    if (!parts.length) return;
    onGenerate(parts.join('\n\n'));
  };

  const anyReady =
    SOURCE_OPTIONS.some(o => selected[o.key] && o.value?.trim()) ||
    (showExtra && extraContext.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-80 shadow-2xl">
        <div className="font-bold text-white mb-1 text-lg">Generate with AI</div>
        <p className="text-xs text-gray-400 mb-4">Select sources to send to Gemini:</p>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {SOURCE_OPTIONS.map(opt => (
            <label key={opt.key} className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 accent-purple-500 w-4 h-4"
                checked={!!selected[opt.key]}
                onChange={() => toggle(opt.key)}
              />
              <span className="text-sm text-gray-200 group-hover:text-white transition-colors">
                {opt.label}
                {opt.value?.trim() ? (
                  <span className="block text-xs text-gray-500 truncate max-w-[200px]">
                    {opt.value.slice(0, 55)}…
                  </span>
                ) : (
                  <span className="block text-xs text-gray-600">(empty)</span>
                )}
              </span>
            </label>
          ))}

          <div className="border-t border-gray-800 my-2" />

          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="mt-1 accent-purple-500 w-4 h-4"
              checked={showExtra}
              onChange={() => setShowExtra(v => !v)}
            />
            <span className="text-sm text-gray-200 group-hover:text-white">Additional Context</span>
          </label>
          {showExtra && (
            <textarea
              className="w-full mt-1 bg-gray-800 text-white text-sm p-2 rounded border border-gray-600
                resize-none focus:outline-none focus:border-purple-500"
              rows={3}
              placeholder="Symptoms, history, clinical notes…"
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
            />
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !anyReady}
            className="flex-1 py-2 rounded bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold
              disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? 'Generating…' : '✨ Generate'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
const PanelStudyNotes = ({ servicesManager, commandsManager }) => {
  const { userAuthenticationService, viewportGridService, displaySetService } =
    servicesManager.services;

  const [studyInstanceUID, setStudyInstanceUID] = useState<string | null>(null);

  // Study Notes
  const [noteText, setNoteText]     = useState('');
  const [noteStatus, setNoteStatus] = useState('');

  // Report sections
  const [report, setReport]             = useState<Record<string, string>>(EMPTY_REPORT);
  const [reportStatus, setReportStatus] = useState('');
  const [isFinalized, setIsFinalized]   = useState(false);

  // AI dialog
  const [showDialog, setShowDialog] = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState('');

  const getAuthHeader = () => {
    const h = userAuthenticationService.getAuthorizationHeader();
    return h && typeof h === 'object' ? h.Authorization : h;
  };

  const getActiveUID = () => {
    const { activeViewportId, viewports } = viewportGridService.getState();
    if (activeViewportId && viewports.get(activeViewportId)) {
      const vp = viewports.get(activeViewportId);
      if (vp.displaySetInstanceUIDs?.length > 0) {
        const ds = displaySetService.getDisplaySetByUID(vp.displaySetInstanceUIDs[0]);
        return ds?.StudyInstanceUID;
      }
    }
    return null;
  };

  useEffect(() => {
    const update = () => {
      const uid = getActiveUID();
      if (uid && uid !== studyInstanceUID) {
        setStudyInstanceUID(uid);
        setNoteText('');
        setNoteStatus('');
        setReport(EMPTY_REPORT);
        setReportStatus('');
        setIsFinalized(false);
        setAiError('');
        fetchNote(uid);
        fetchReport(uid);
      }
    };
    update();
    const s1 = viewportGridService.subscribe(viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED, update);
    const s2 = viewportGridService.subscribe(viewportGridService.EVENTS.LAYOUT_CHANGED, update);
    return () => {
      s1.unsubscribe();
      s2.unsubscribe();
    };
  }, [studyInstanceUID]);

  // ── Note fetch/save ──────────────────────────────────────────────────────────
  const fetchNote = async (uid: string) => {
    setNoteStatus('Loading…');
    try {
      const r = await fetch(`${API_BASE}/api/notes/${uid}`, {
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setNoteText(d.note_text || '');
      setNoteStatus('');
    } catch {
      setNoteStatus('Error loading');
    }
  };

  const saveNote = async () => {
    if (!studyInstanceUID) return;
    setNoteStatus('Saving…');
    try {
      const r = await fetch(`${API_BASE}/api/notes/${studyInstanceUID}`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: noteText }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setNoteText(d.note_text);
      setNoteStatus('Saved ✓');
      setTimeout(() => setNoteStatus(''), 3000);
    } catch {
      setNoteStatus('Error saving');
    }
  };

  // ── Report fetch/save ────────────────────────────────────────────────────────
  const fetchReport = async (uid: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/report/${uid}`, {
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setReport(d);
      setIsFinalized(d.status === 'final');
    } catch {
      /* Keep empty — non-fatal */
    }
  };

  const saveReport = async (status: 'draft' | 'final') => {
    if (!studyInstanceUID) return;
    if (status === 'final') {
      const ok = window.confirm('Finalize and release this report? This will lock the report fields.');
      if (!ok) return;
    }
    setReportStatus(status === 'final' ? 'Releasing…' : 'Saving…');
    try {
      const r = await fetch(`${API_BASE}/api/report/${studyInstanceUID}`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, status }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setReport(d);
      setIsFinalized(d.status === 'final');
      setReportStatus(status === 'final' ? 'Released ✓' : 'Saved ✓');
      setTimeout(() => setReportStatus(''), 3000);
    } catch {
      setReportStatus('Error saving');
    }
  };

  // ── AI generation ────────────────────────────────────────────────────────────
  const handleGenerate = async (shortReport: string) => {
    setAiLoading(true);
    setAiError('');
    try {
      const r = await fetch(`${API_BASE}/ai/enhance-report`, {
        method: 'POST',
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_id: studyInstanceUID, short_report: shortReport }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || 'Failed');
      }
      const d = await r.json();
      if (d.enhancedReport?.raw) {
        setAiError('AI returned unstructured text. Try again.');
      } else {
        setReport({
          clinicalIndication: d.enhancedReport.clinicalIndication || '',
          findings:           d.enhancedReport.findings           || '',
          impression:         d.enhancedReport.impression         || '',
          patientSummary:     d.enhancedReport.patientSummary     || '',
          recommendations:    d.enhancedReport.recommendations    || '',
          status:             'draft',
        });
        setShowDialog(false);
      }
    } catch (e: any) {
      setAiError(e.message || 'Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const copyAllReport = () => {
    const text = SECTIONS.map(s => `${s.label.toUpperCase()}\n${report[s.key] || ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  if (!studyInstanceUID) {
    return <div className="p-4 text-white text-sm">Please select a viewport to begin.</div>;
  }

  // ── Study Notes ───────────────────────────────────────────────
  const authHeader = getAuthHeader();
  const token = authHeader?.split(' ')[1];
  let userRole = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.user_role || '';
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  }

  if (userRole !== 'radiologist') {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Reporting and notes are restricted to radiologists.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto pb-8">

      {/* ── Study Notes ─────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="font-bold text-base mb-2">Study Notes</div>
        <textarea
          className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-700
            resize-none focus:outline-none focus:border-blue-500"
          rows={4}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Raw radiologist notes…"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${noteStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {noteStatus}
          </span>
          <button
            onClick={saveNote}
            disabled={noteStatus === 'Saving…' || noteStatus === 'Loading…'}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm
              font-semibold transition-colors disabled:opacity-50"
          >
            Save Notes
          </button>
        </div>
      </div>

      <div className="border-t border-gray-800 mx-4" />

      {/* ── Report Writing ───────────────────────────────────────────── */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Report Writing</span>
            {isFinalized ? (
              <span className="text-[10px] uppercase font-bold bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-700/50">
                🔒 Finalized
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-700">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aiError && <span className="text-xs text-red-400 max-w-[100px] truncate">{aiError}</span>}
            <button
              onClick={() => {
                setAiError('');
                setShowDialog(true);
              }}
              disabled={isFinalized}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold transition-all shadow
                ${isFinalized
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'}`}
            >
              ✨ AI
            </button>
            <button
              onClick={copyAllReport}
              className="px-3 py-1.5 rounded text-sm bg-gray-700 hover:bg-gray-600 transition-colors text-white"
            >
              Copy All
            </button>
          </div>
        </div>

        {/* Editable sections */}
        <div className="space-y-4">
          {SECTIONS.map(section => (
            <div key={section.key} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 group-focus-within:text-blue-300">
                  {section.label}
                </span>
                <CopyBtn text={report[section.key]} />
              </div>
              <textarea
                rows={3}
                value={report[section.key]}
                readOnly={isFinalized}
                onChange={e => setReport(prev => ({ ...prev, [section.key]: e.target.value }))}
                placeholder={`Enter ${section.label.toLowerCase()}…`}
                className={`w-full bg-gray-800 text-white text-sm p-2.5 rounded border resize-none
                  focus:outline-none transition-all duration-200 ${
                    isFinalized
                      ? 'border-gray-700/50 text-gray-400 opacity-80 cursor-not-allowed selection:bg-gray-700'
                      : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                  }`}
              />
            </div>
          ))}
        </div>

        {/* Save footer */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">
          <span className={`text-xs font-medium ${reportStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {reportStatus}
          </span>
          {isFinalized ? (
            <button
              onClick={() => saveReport('draft')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs
                font-bold transition-all border border-gray-600 flex items-center gap-2"
            >
              <span>✏️</span> Reopen as Draft
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => saveReport('draft')}
                disabled={reportStatus === 'Saving…'}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-200 text-sm
                  font-bold transition-all border border-gray-700 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => saveReport('final')}
                disabled={reportStatus === 'Releasing…'}
                className="px-4 py-2 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500
                  rounded text-white text-sm font-bold transition-all shadow-md disabled:opacity-50"
              >
                Finalize &amp; Release
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Dialog ───────────────────────────────────────────────── */}
      {showDialog && (
        <AIDialog
          noteText={noteText}
          report={report}
          onGenerate={handleGenerate}
          onClose={() => setShowDialog(false)}
          loading={aiLoading}
        />
      )}
    </div>
  );
};

PanelStudyNotes.propTypes = {
  servicesManager: PropTypes.object.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default PanelStudyNotes;
