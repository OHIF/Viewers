import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const SMARTCARE_API_BASE = 'https://api.smartcareplus.in/dicom-viewer';
const IMAGING_AI_API_BASE = 'https://api.imaging.smartcareplus.in';

const SECTIONS = [
  { key: 'clinicalIndication', label: 'Clinical Indication' },
  { key: 'findings', label: 'Findings' },
  { key: 'impression', label: 'Impression' },
  { key: 'patientSummary', label: 'Patient Summary' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'additionalNotes', label: 'Additional Notes' },
  { key: 'declaration', label: 'Declaration' },
];

type SectionKey = (typeof SECTIONS)[number]['key'];

type ReportState = Record<SectionKey, string> & {
  status: 'draft' | 'final';
};

type ViewerActionRequired = {
  type?: string;
  message?: string;
  create_template_url?: string;
  current_template_id?: string | null;
  templates?: TemplateOption[];
};

type TemplateOption = {
  id: string;
  name: string;
  short_description?: string;
  version_id?: string | null;
  version_number?: number | null;
  default_values?: Partial<Record<SectionKey, string>>;
  radiology_sections?: string[];
};

const EMPTY_REPORT: ReportState = {
  clinicalIndication: '',
  findings: '',
  impression: '',
  patientSummary: '',
  recommendations: '',
  additionalNotes: '',
  declaration: '',
  status: 'draft',
};

const DEFAULT_FRONTEND_SECTIONS: SectionKey[] = ['clinicalIndication', 'findings', 'impression'];

function storageToFrontendSection(value: string): SectionKey | string {
  switch (value) {
    case 'clinical_indication':
      return 'clinicalIndication';
    case 'patient_summary':
      return 'patientSummary';
    case 'additional_notes':
      return 'additionalNotes';
    default:
      return value;
  }
}

function normalizeSectionList(value: unknown, fallback: SectionKey[]): SectionKey[] {
  if (!Array.isArray(value) || !value.length) {
    return fallback;
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(storageToFrontendSection)
    .filter((item): item is SectionKey => SECTIONS.some(section => section.key === item));
}

function isTemplateOption(value: unknown): value is TemplateOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TemplateOption).id === 'string' &&
    typeof (value as TemplateOption).name === 'string'
  );
}

function normalizeTemplateOptions(value: unknown): TemplateOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isTemplateOption);
}

function applyTemplateDefaults(value: ReportState, template: TemplateOption | null): ReportState {
  if (!template?.default_values) {
    return value;
  }

  const nextValue = { ...value };

  SECTIONS.forEach(section => {
    const defaultValue = template.default_values?.[section.key];
    if ((!nextValue[section.key] || !nextValue[section.key].trim()) && defaultValue?.trim()) {
      nextValue[section.key] = defaultValue;
    }
  });

  return nextValue;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300 transition-colors hover:bg-gray-600"
    >
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

function AIDialog({
  noteText,
  report,
  sections,
  onGenerate,
  onClose,
  loading,
}: {
  noteText: string;
  report: ReportState;
  sections: { key: SectionKey; label: string }[];
  onGenerate: (source: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const sourceOptions = [
    { key: 'notes', label: 'Study Notes', value: noteText },
    ...sections.map(section => ({
      key: section.key,
      label: section.label,
      value: report[section.key] || '',
    })),
  ];

  const [selected, setSelected] = useState<Record<string, boolean>>({ notes: true });
  const [extraContext, setExtraContext] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const toggle = (key: string) => setSelected(prev => ({ ...prev, [key]: !prev[key] }));

  const anyReady =
    sourceOptions.some(option => selected[option.key] && option.value?.trim()) ||
    (showExtra && extraContext.trim());

  const handleGenerate = () => {
    const parts = sourceOptions
      .filter(option => selected[option.key] && option.value?.trim())
      .map(option => `${option.label}:\n${option.value.trim()}`);

    if (showExtra && extraContext.trim()) {
      parts.push(`Additional Context:\n${extraContext.trim()}`);
    }

    if (parts.length) {
      onGenerate(parts.join('\n\n'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-80 rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl">
        <div className="mb-1 text-lg font-bold text-white">Generate with AI</div>
        <p className="mb-4 text-xs text-gray-400">Select sources to send to Gemini:</p>

        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {sourceOptions.map(option => (
            <label
              key={option.key}
              className="group flex cursor-pointer items-start gap-2"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-purple-500"
                checked={!!selected[option.key]}
                onChange={() => toggle(option.key)}
              />
              <span className="text-sm text-gray-200 transition-colors group-hover:text-white">
                {option.label}
                {option.value?.trim() ? (
                  <span className="block max-w-[200px] truncate text-xs text-gray-500">
                    {option.value.slice(0, 55)}…
                  </span>
                ) : (
                  <span className="block text-xs text-gray-600">(empty)</span>
                )}
              </span>
            </label>
          ))}

          <div className="my-2 border-t border-gray-800" />

          <label className="group flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-purple-500"
              checked={showExtra}
              onChange={() => setShowExtra(value => !value)}
            />
            <span className="text-sm text-gray-200 group-hover:text-white">Additional Context</span>
          </label>

          {showExtra && (
            <textarea
              className="mt-1 w-full resize-none rounded border border-gray-600 bg-gray-800 p-2 text-sm text-white focus:border-purple-500 focus:outline-none"
              rows={3}
              placeholder="Symptoms, history, clinical notes…"
              value={extraContext}
              onChange={event => setExtraContext(event.target.value)}
            />
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !anyReady}
            className="flex-1 rounded bg-gradient-to-r from-purple-600 to-blue-600 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const PanelStudyNotes = ({ servicesManager }) => {
  const { userAuthenticationService, viewportGridService, displaySetService } =
    servicesManager.services;

  const [studyInstanceUID, setStudyInstanceUID] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [report, setReport] = useState<ReportState>(EMPTY_REPORT);
  const [reportStatus, setReportStatus] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [viewerMode, setViewerMode] = useState<'lab_booking' | 'standalone'>('standalone');
  const [toggleableSections, setToggleableSections] = useState(true);
  const [availableSections, setAvailableSections] =
    useState<SectionKey[]>(DEFAULT_FRONTEND_SECTIONS);
  const [enabledSections, setEnabledSections] = useState<SectionKey[]>(DEFAULT_FRONTEND_SECTIONS);
  const [actionRequired, setActionRequired] = useState<ViewerActionRequired | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateVersionId, setSelectedTemplateVersionId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const getAuthHeader = () => {
    const header = userAuthenticationService.getAuthorizationHeader();
    return header && typeof header === 'object' ? header.Authorization : header;
  };

  const getRequestHeaders = () => {
    const authorization = getAuthHeader();
    return {
      ...(authorization ? { Authorization: authorization } : {}),
      'Content-Type': 'application/json',
    };
  };

  const getActiveUID = () => {
    const { activeViewportId, viewports } = viewportGridService.getState();
    if (activeViewportId && viewports.get(activeViewportId)) {
      const viewport = viewports.get(activeViewportId);
      if (viewport.displaySetInstanceUIDs?.length > 0) {
        const displaySet = displaySetService.getDisplaySetByUID(viewport.displaySetInstanceUIDs[0]);
        return displaySet?.StudyInstanceUID;
      }
    }
    return null;
  };

  const visibleSections = useMemo(
    () => SECTIONS.filter(section => enabledSections.includes(section.key)),
    [enabledSections]
  );

  const fetchNotes = async (uid: string) => {
    setNoteStatus('Loading…');
    try {
      const response = await fetch(`${SMARTCARE_API_BASE}/studies/${uid}/notes`, {
        headers: getRequestHeaders(),
      });
      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setNoteText(data.note_text || '');
      setNoteStatus('');
    } catch {
      setNoteStatus('Error loading');
    }
  };

  const fetchReport = async (
    uid: string,
    templateId?: string | null,
    templateVersionId?: string | null
  ) => {
    try {
      const params = new URLSearchParams();
      if (templateId) {
        params.set('template_id', templateId);
      }
      if (templateVersionId) {
        params.set('template_version_id', templateVersionId);
      }

      const response = await fetch(
        `${SMARTCARE_API_BASE}/studies/${uid}/report${params.toString() ? `?${params.toString()}` : ''}`,
        {
          headers: getRequestHeaders(),
        }
      );
      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      const templateOptions = normalizeTemplateOptions(data.templates);
      const actionTemplateOptions = normalizeTemplateOptions(data.actionRequired?.templates);
      const allTemplates = templateOptions.length > 0 ? templateOptions : actionTemplateOptions;
      const activeTemplate = isTemplateOption(data.template) ? data.template : null;
      const selectedTemplate =
        activeTemplate ||
        allTemplates.find(template => template.id === data.actionRequired?.current_template_id) ||
        allTemplates[0] ||
        null;

      setReport(
        applyTemplateDefaults(
          {
            clinicalIndication: data.clinicalIndication || '',
            findings: data.findings || '',
            impression: data.impression || '',
            patientSummary: data.patientSummary || '',
            recommendations: data.recommendations || '',
            additionalNotes: data.additionalNotes || '',
            declaration: data.declaration || '',
            status: data.status === 'final' ? 'final' : 'draft',
          },
          selectedTemplate
        )
      );
      setViewerMode(data.viewerMode === 'lab_booking' ? 'lab_booking' : 'standalone');
      setToggleableSections(data.toggleableSections === true);
      setAvailableSections(normalizeSectionList(data.availableSections, DEFAULT_FRONTEND_SECTIONS));
      setEnabledSections(normalizeSectionList(data.enabledSections, DEFAULT_FRONTEND_SECTIONS));
      setActionRequired(data.actionRequired || null);
      setTemplates(allTemplates);
      setSelectedTemplateId(
        selectedTemplate?.id ||
          data.actionRequired?.current_template_id ||
          allTemplates[0]?.id ||
          null
      );
      setSelectedTemplateVersionId(
        selectedTemplate?.version_id ||
          allTemplates.find(template => template.id === selectedTemplate?.id)?.version_id ||
          null
      );
      setIsFinalized(data.status === 'final');
    } catch {
      setReport(EMPTY_REPORT);
      setViewerMode('standalone');
      setToggleableSections(true);
      setAvailableSections(DEFAULT_FRONTEND_SECTIONS);
      setEnabledSections(DEFAULT_FRONTEND_SECTIONS);
      setActionRequired(null);
      setTemplates([]);
      setSelectedTemplateId(null);
      setSelectedTemplateVersionId(null);
      setIsFinalized(false);
    }
  };

  // These services are stable singletons for the extension lifecycle.
  /* eslint-disable react-hooks/exhaustive-deps */
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
        setViewerMode('standalone');
        setToggleableSections(true);
        setAvailableSections(DEFAULT_FRONTEND_SECTIONS);
        setEnabledSections(DEFAULT_FRONTEND_SECTIONS);
        setActionRequired(null);
        setTemplates([]);
        setSelectedTemplateId(null);
        setSelectedTemplateVersionId(null);
        setAiError('');
        fetchNotes(uid);
        fetchReport(uid);
      }
    };

    update();
    const subscriptionOne = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      update
    );
    const subscriptionTwo = viewportGridService.subscribe(
      viewportGridService.EVENTS.LAYOUT_CHANGED,
      update
    );

    return () => {
      subscriptionOne.unsubscribe();
      subscriptionTwo.unsubscribe();
    };
  }, [studyInstanceUID]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const saveNotes = async () => {
    if (!studyInstanceUID) {
      return;
    }

    setNoteStatus('Saving…');
    try {
      const response = await fetch(`${SMARTCARE_API_BASE}/studies/${studyInstanceUID}/notes`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ note_text: noteText }),
      });
      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setNoteText(data.note_text || '');
      setNoteStatus('Saved ✓');
      setTimeout(() => setNoteStatus(''), 3000);
    } catch {
      setNoteStatus('Error saving');
    }
  };

  const saveReport = async (status: 'draft' | 'final') => {
    if (
      !studyInstanceUID ||
      ((actionRequired?.type === 'create_template' || actionRequired?.type === 'select_template') &&
        !selectedTemplateId)
    ) {
      return;
    }

    if (status === 'final') {
      const confirmed = window.confirm(
        'Finalize and release this report? This will lock the report fields.'
      );
      if (!confirmed) {
        return;
      }
    }

    setReportStatus(status === 'final' ? 'Releasing…' : 'Saving…');
    try {
      const response = await fetch(`${SMARTCARE_API_BASE}/studies/${studyInstanceUID}/report`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
          ...report,
          status,
          enabledSections,
          templateId: selectedTemplateId,
          templateVersionId: selectedTemplateVersionId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save');
      }

      setReport({
        clinicalIndication: data.clinicalIndication || '',
        findings: data.findings || '',
        impression: data.impression || '',
        patientSummary: data.patientSummary || '',
        recommendations: data.recommendations || '',
        additionalNotes: data.additionalNotes || '',
        declaration: data.declaration || '',
        status: data.status === 'final' ? 'final' : 'draft',
      });
      setAvailableSections(normalizeSectionList(data.availableSections, DEFAULT_FRONTEND_SECTIONS));
      setEnabledSections(normalizeSectionList(data.enabledSections, enabledSections));
      setActionRequired(data.actionRequired || null);
      const templateOptions = normalizeTemplateOptions(data.templates);
      const actionTemplateOptions = normalizeTemplateOptions(data.actionRequired?.templates);
      const allTemplates = templateOptions.length > 0 ? templateOptions : actionTemplateOptions;
      const activeTemplate = isTemplateOption(data.template) ? data.template : null;
      setTemplates(allTemplates);
      setSelectedTemplateId(
        activeTemplate?.id ||
          data.actionRequired?.current_template_id ||
          selectedTemplateId ||
          allTemplates[0]?.id ||
          null
      );
      setSelectedTemplateVersionId(activeTemplate?.version_id || selectedTemplateVersionId);
      setIsFinalized(data.status === 'final');
      setReportStatus(status === 'final' ? 'Released ✓' : 'Saved ✓');
      setTimeout(() => setReportStatus(''), 3000);
    } catch (error: unknown) {
      setReportStatus(error instanceof Error && error.message ? error.message : 'Error saving');
    }
  };

  const handleGenerate = async (shortReport: string) => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await fetch(`${IMAGING_AI_API_BASE}/ai/enhance-report`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ study_id: studyInstanceUID, short_report: shortReport }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed');
      }

      const data = await response.json();
      if (data.enhancedReport?.raw) {
        setAiError('AI returned unstructured text. Try again.');
      } else {
        setReport(prev => ({
          ...prev,
          clinicalIndication: data.enhancedReport.clinicalIndication || prev.clinicalIndication,
          findings: data.enhancedReport.findings || prev.findings,
          impression: data.enhancedReport.impression || prev.impression,
          patientSummary: data.enhancedReport.patientSummary || prev.patientSummary,
          recommendations: data.enhancedReport.recommendations || prev.recommendations,
        }));
        setShowDialog(false);
      }
    } catch (error: unknown) {
      setAiError(error instanceof Error && error.message ? error.message : 'Generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const copyAllReport = () => {
    const text = visibleSections
      .map(section => `${section.label.toUpperCase()}\n${report[section.key] || ''}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const handleTemplateSelection = (template: TemplateOption) => {
    setSelectedTemplateId(template.id);
    setSelectedTemplateVersionId(template.version_id || null);
    if (studyInstanceUID) {
      fetchReport(studyInstanceUID, template.id, template.version_id || null);
    }
  };

  if (!studyInstanceUID) {
    return <div className="p-4 text-sm text-white">Please select a viewport to begin.</div>;
  }

  const authHeader = getAuthHeader();
  const token = authHeader?.split(' ')[1];
  let userRole = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.user_role || '';
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  if (userRole !== 'radiologist') {
    return (
      <div className="p-4 text-sm text-gray-400">
        Reporting and notes are restricted to radiologists.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-black pb-8 text-white">
      <div className="p-4">
        <div className="mb-2 text-base font-bold">Study Notes</div>
        <textarea
          className="w-full resize-none rounded border border-gray-700 bg-gray-800 p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          rows={4}
          value={noteText}
          onChange={event => setNoteText(event.target.value)}
          placeholder="Raw radiologist notes…"
        />
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-xs ${
              noteStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {noteStatus}
          </span>
          <button
            onClick={saveNotes}
            disabled={noteStatus === 'Saving…' || noteStatus === 'Loading…'}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Save Notes
          </button>
        </div>
      </div>

      <div className="mx-4 border-t border-gray-800" />

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">Report Writing</span>
            <span className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-400">
              {viewerMode === 'lab_booking' ? 'Linked To Booking' : 'Standalone'}
            </span>
            {isFinalized ? (
              <span className="rounded border border-green-700/50 bg-green-900/50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-400">
                Finalized
              </span>
            ) : (
              <span className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aiError && (
              <span className="max-w-[140px] truncate text-xs text-red-400">{aiError}</span>
            )}
            <button
              onClick={() => {
                setAiError('');
                setShowDialog(true);
              }}
              disabled={isFinalized}
              className={`rounded px-3 py-1.5 text-sm font-semibold shadow transition-all ${
                isFinalized
                  ? 'cursor-not-allowed bg-gray-800 text-gray-600'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500'
              }`}
            >
              AI
            </button>
            <button
              onClick={copyAllReport}
              className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-600"
            >
              Copy All
            </button>
          </div>
        </div>

        {toggleableSections && (
          <div className="bg-gray-950/70 mb-4 rounded border border-gray-800 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Visible Sections
            </div>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.filter(section => availableSections.includes(section.key)).map(section => {
                const active = enabledSections.includes(section.key);
                return (
                  <button
                    key={section.key}
                    type="button"
                    disabled={isFinalized}
                    onClick={() =>
                      setEnabledSections(prev =>
                        prev.includes(section.key)
                          ? prev.filter(item => item !== section.key)
                          : [...prev, section.key]
                      )
                    }
                    className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-400'
                    } ${
                      isFinalized
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:border-blue-400 hover:text-white'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewerMode === 'lab_booking' &&
          (templates.length > 0 ||
            selectedTemplate ||
            actionRequired?.type === 'select_template' ||
            actionRequired?.type === 'create_template') && (
            <div className="bg-gray-950/70 mb-4 rounded border border-gray-800 p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Report Template
              </div>

              {templates.length > 1 && (
                <div className="space-y-2">
                  {templates.map(template => {
                    const active = template.id === selectedTemplateId;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelection(template)}
                        className={`block w-full rounded border p-3 text-left transition-colors ${
                          active
                            ? 'bg-blue-950/40 border-blue-500'
                            : 'border-gray-800 bg-gray-900 hover:border-blue-800'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">{template.name}</div>
                        {template.short_description ? (
                          <div className="mt-1 text-xs text-gray-400">
                            {template.short_description}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {actionRequired?.create_template_url && (
                <button
                  onClick={() =>
                    window.open(actionRequired.create_template_url, '_blank', 'noopener,noreferrer')
                  }
                  className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  Create Template
                </button>
              )}
            </div>
          )}
        {selectedTemplate && (
          <div className="m-4">
            <div className="text-sm font-semibold text-blue-100">{selectedTemplate.name}</div>
            {selectedTemplate.short_description ? (
              <div className="mt-1 text-xs text-blue-100/70">
                {selectedTemplate.short_description}
              </div>
            ) : null}
          </div>
        )}

        {actionRequired?.type === 'create_template' && !selectedTemplateId ? (
          <div className="bg-amber-950/40 rounded border border-amber-800 p-4">
            <div className="mb-2 text-sm font-semibold text-amber-300">Template Required</div>
            <p className="text-sm text-amber-100">
              {actionRequired.message ||
                'Create a radiology template for this test before writing the report here.'}
            </p>
            {actionRequired.create_template_url && (
              <button
                onClick={() =>
                  window.open(actionRequired.create_template_url, '_blank', 'noopener,noreferrer')
                }
                className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Create Template
              </button>
            )}
          </div>
        ) : actionRequired?.type === 'select_template' && !selectedTemplateId ? (
          <div className="bg-amber-950/40 rounded border border-amber-800 p-4">
            <div className="mb-2 text-sm font-semibold text-amber-300">Select Template</div>
            <p className="text-sm text-amber-100">
              {actionRequired.message || 'Select a template for this lab test to continue.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleSections.map(section => (
                <div
                  key={section.key}
                  className="group"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 group-focus-within:text-blue-300">
                      {section.label}
                    </span>
                    <CopyBtn text={report[section.key]} />
                  </div>
                  <textarea
                    rows={3}
                    value={report[section.key]}
                    readOnly={isFinalized}
                    onChange={event =>
                      setReport(prev => ({
                        ...prev,
                        [section.key]: event.target.value,
                      }))
                    }
                    placeholder={`Enter ${section.label.toLowerCase()}…`}
                    className={`w-full resize-none rounded border bg-gray-800 p-2.5 text-sm text-white transition-all duration-200 focus:outline-none ${
                      isFinalized
                        ? 'cursor-not-allowed border-gray-700/50 text-gray-400 opacity-80 selection:bg-gray-700'
                        : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">
              <span
                className={`text-xs font-medium ${
                  reportStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {reportStatus}
              </span>
              {isFinalized ? (
                <button
                  onClick={() => saveReport('draft')}
                  className="flex items-center gap-2 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-gray-600"
                >
                  Reopen as Draft
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => saveReport('draft')}
                    disabled={reportStatus === 'Saving…'}
                    className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-bold text-gray-200 transition-all hover:bg-gray-700 disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => saveReport('final')}
                    disabled={reportStatus === 'Releasing…'}
                    className="rounded bg-gradient-to-r from-green-700 to-green-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:from-green-600 hover:to-green-500 disabled:opacity-50"
                  >
                    Finalize &amp; Release
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showDialog && (
        <AIDialog
          noteText={noteText}
          report={report}
          sections={visibleSections}
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
  commandsManager: PropTypes.object,
};

export default PanelStudyNotes;
