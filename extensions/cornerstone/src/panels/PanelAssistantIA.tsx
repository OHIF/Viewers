import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  ScrollArea,
  Icons,
  useImageViewer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ohif/ui-next';

const API_STUDY_EXTERNAL = (base: string, externalId: string, includeArchived = false) =>
  `${base.replace(/\/$/, '')}/api/study/external/${encodeURIComponent(externalId)}${includeArchived ? '?includeArchived=1' : ''}`;
const API_STUDY_AGENTS = (base: string) =>
  `${base.replace(/\/$/, '')}/api/study/agents`;
const API_CONVERSATION_CREATE = (base: string) =>
  `${base.replace(/\/$/, '')}/api/study/conversation/create`;
const API_CONVERSATION_MESSAGE = (base: string, conversationId: number) =>
  `${base.replace(/\/$/, '')}/api/study/conversation/${conversationId}/message`;
const API_STUDY_IMAGE = (base: string, studyId: number) =>
  `${base.replace(/\/$/, '')}/api/study/${studyId}/image`;
const API_CONVERSATION_ARCHIVE = (base: string, conversationId: number) =>
  `${base.replace(/\/$/, '')}/api/study/conversation/${conversationId}/archive`;

type MessageItem = {
  id: number;
  content: string;
  response: string | null;
  fileUrls: string | null;
};

type Conversation = {
  id: number;
  conversationId: string | null;
  agent: number | null;
  prompt: number | null;
  study: number | null;
  messages: MessageItem[];
  createdAt?: string;
};

type Study = {
  id: number;
  name: string | null;
  externalId: string | null;
  description: string | null;
  conversations?: Conversation[];
};

type Prompt = {
  id: number;
  name: string | null;
  template: string | null;
  agent: number;
};

type Agent = {
  id: number;
  name: string | null;
  targetEntity: string | null;
  sendImages: boolean;
  prompts: Prompt[];
};

type PendingImage = {
  key: string;
  file: File;
  previewUrl: string;
  imageId: number | null;
  status: 'uploading' | 'done' | 'error';
};

const REFLECTION_PHRASES = [
  'Analyse des structures anatomiques',
  'Lecture intelligente de l\'élément...',
  'Extraction des caractéristiques...',
  'Comparaison avec les référentiels...',
  'Génération des hypothèses...',
  'Vérification de cohérence...',
  'Traitement des données...',
  'Synthèse en cours...',
  'Préparation de la réponse...',
  'Finalisation...',
];

function getConversationLabel(conv: Conversation): string {
  const firstContent = conv.messages?.[0]?.content?.trim();
  if (!firstContent) return 'New Chat';
  return firstContent.length > 40 ? firstContent.slice(0, 40) + '...' : firstContent;
}

function groupConversationsByPeriod(convs: Conversation[]): { label: string; conversations: Conversation[] }[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const groups: { label: string; maxAge: number; conversations: Conversation[] }[] = [
    { label: "Aujourd'hui", maxAge: day, conversations: [] },
    { label: 'Il y a une semaine', maxAge: 7 * day, conversations: [] },
    { label: 'Il y a 3 semaines', maxAge: 21 * day, conversations: [] },
    { label: 'Il y a 1 mois', maxAge: 30 * day, conversations: [] },
  ];
  const fallback = { label: 'Anciennes', maxAge: Infinity, conversations: [] as Conversation[] };
  const sorted = [...convs].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : (a.id * 1e6);
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : (b.id * 1e6);
    return tb - ta;
  });
  sorted.forEach((c, i) => {
    const t = c.createdAt ? new Date(c.createdAt).getTime() : now - i * day;
    const age = now - t;
    const group = groups.find(g => age < g.maxAge) ?? fallback;
    group.conversations.push(c);
  });
  const result = groups.filter(g => g.conversations.length > 0).map(({ label, conversations }) => ({ label, conversations }));
  if (fallback.conversations.length > 0) result.push({ label: fallback.label, conversations: fallback.conversations });
  return result;
}

const IA_ICON_SIZE = 'h-4 w-4';

const CloseIcon = () => (
  <svg className={IA_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function renderMarkdown(text: string): React.ReactNode {
  const applyInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      let earliest: { idx: number; len: number; node: React.ReactNode; full: string } | null = null;
      if (boldMatch && boldMatch.index !== undefined) {
        const idx = boldMatch.index;
        if (!earliest || idx < earliest.idx) {
          earliest = { idx, len: boldMatch[0].length, node: <strong key={`b${key}`}>{boldMatch[1]}</strong>, full: boldMatch[0] };
        }
      }
      if (codeMatch && codeMatch.index !== undefined) {
        const idx = codeMatch.index;
        if (!earliest || idx < earliest.idx) {
          earliest = { idx, len: codeMatch[0].length, node: <code key={`c${key}`} className="rounded bg-[#1e1e1e] px-1 py-0.5 text-[#e5e5e5]">{codeMatch[1]}</code>, full: codeMatch[0] };
        }
      }
      if (!earliest) {
        parts.push(remaining);
        break;
      }
      if (earliest.idx > 0) parts.push(remaining.slice(0, earliest.idx));
      parts.push(earliest.node);
      remaining = remaining.slice(earliest.idx + earliest.len);
      key++;
    }
    return parts;
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul${elements.length}`} className="ml-4 list-disc space-y-0.5">{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.match(/^### /)) {
      flushList();
      elements.push(<h3 key={i} className="mt-3 mb-1 text-sm font-bold text-white">{applyInline(line.replace(/^### /, ''))}</h3>);
    } else if (line.match(/^## /)) {
      flushList();
      elements.push(<h2 key={i} className="mt-4 mb-1 text-base font-bold text-white">{applyInline(line.replace(/^## /, ''))}</h2>);
    } else if (line.match(/^# /)) {
      flushList();
      elements.push(<h1 key={i} className="mt-4 mb-1 text-lg font-bold text-white">{applyInline(line.replace(/^# /, ''))}</h1>);
    } else if (line.match(/^- /)) {
      listItems.push(<li key={i} className="text-[#e5e5e5]">{applyInline(line.replace(/^- /, ''))}</li>);
    } else if (line.trim() === '') {
      flushList();
      elements.push(<div key={i} className="h-2" />);
    } else {
      flushList();
      elements.push(<p key={i} className="text-[#e5e5e5]">{applyInline(line)}</p>);
    }
  });
  flushList();
  return <>{elements}</>;
}

const PlusIcon = () => (
  <svg className={IA_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className={IA_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className={IA_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const HistoryClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className={IA_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const SendArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className={IA_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16V8M8 12l4-4 4 4" />
  </svg>
);

export default function PanelAssistantIA(): React.ReactNode {
  const appConfig = typeof window !== 'undefined' ? window.config : {};
  const proxyPath = appConfig?.ekkoPacsApi?.proxyPath ?? '';
  const baseUrlConfig = appConfig?.ekkoPacsApi?.baseUrl ?? '';
  const baseUrl =
    baseUrlConfig ||
    (proxyPath && typeof window !== 'undefined' ? window.location.origin + proxyPath : '');

  const viewerContext = useImageViewer();
  const studyInstanceUIDs = viewerContext?.StudyInstanceUIDs ?? [];
  const externalId = studyInstanceUIDs[0] ?? null;

  const [study, setStudy] = useState<Study | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<{
    route: string;
    url: string;
    message: string;
    status?: number;
    timestamp: string;
    method?: 'GET' | 'POST';
    requestBody?: string;
  } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingTabId, setSendingTabId] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reflectionSeconds, setReflectionSeconds] = useState(0);
  const [archiving, setArchiving] = useState(false);
  const [lastSentContent, setLastSentContent] = useState<string | null>(null);
  const [draftTabs, setDraftTabs] = useState<string[]>(['draft-0']);
  const [selectedDraftKey, setSelectedDraftKey] = useState<string | null>('draft-0');
  const [dragTab, setDragTab] = useState<{ type: 'conv'; id: number; fromIndex: number } | { type: 'draft'; key: string; fromIndex: number } | null>(null);
  const [dropIndex, setDropIndex] = useState<{ type: 'conv'; index: number } | { type: 'draft'; index: number } | null>(null);
  const [isDragOverImage, setIsDragOverImage] = useState(false);
  const draftCounterRef = useRef(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reflectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleNewChat = useCallback(() => {
    const key = `draft-${draftCounterRef.current++}`;
    setDraftTabs(prev => [...prev, key]);
    setSelectedDraftKey(key);
    setSelectedConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: number) => {
    setSelectedConversationId(id);
    setSelectedDraftKey(null);
  }, []);

  const handleSelectDraft = useCallback((key: string) => {
    setSelectedDraftKey(key);
    setSelectedConversationId(null);
  }, []);

  const handleCloseDraft = useCallback((key: string) => {
    setDraftTabs(prev => {
      const remaining = prev.filter(k => k !== key);
      if (key === selectedDraftKey) {
        if (remaining.length > 0) {
          setSelectedDraftKey(remaining[remaining.length - 1]);
          setSelectedConversationId(null);
        } else if (conversations.length > 0) {
          setSelectedDraftKey(null);
          setSelectedConversationId(conversations[conversations.length - 1].id);
        } else {
          setSelectedDraftKey(null);
          setSelectedConversationId(null);
        }
      }
      return remaining;
    });
  }, [selectedDraftKey, conversations]);

  const reorderConversations = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setConversations(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const reorderDrafts = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraftTabs(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const removePendingImage = useCallback((key: string) => {
    setPendingImages(prev => {
      const item = prev.find(p => p.key === key);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(p => p.key !== key);
    });
  }, []);

  const clearAllPendingImages = useCallback(() => {
    setPendingImages(prev => {
      prev.forEach(p => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return [];
    });
  }, []);

  const archiveConversation = useCallback(
    async (conversationId: number) => {
      if (!baseUrl) return;
      const url = API_CONVERSATION_ARCHIVE(baseUrl, conversationId);
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const errBody = await res.text();
        setError(errBody || `Erreur archivage: ${res.status}`);
        return;
      }
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setHistoryConversations(prev => prev.filter(c => c.id !== conversationId));
      setSelectedConversationId(prev =>
        prev === conversationId ? null : prev
      );
    },
    [baseUrl]
  );

  const clearAllDrafts = useCallback(() => {
    setDraftTabs([]);
    setSelectedDraftKey(null);
  }, []);

  const archiveOthers = useCallback(async () => {
    if (!selectedConversationId || archiving) return;
    setArchiving(true);
    const ids = conversations.filter(c => c.id !== selectedConversationId).map(c => c.id);
    for (const id of ids) {
      await archiveConversation(id);
    }
    setDraftTabs([]);
    setSelectedDraftKey(null);
    setArchiving(false);
  }, [conversations, selectedConversationId, archiving, archiveConversation]);

  const archiveAll = useCallback(async () => {
    if (archiving) return;
    setArchiving(true);
    const ids = [...conversations].map(c => c.id);
    for (const id of ids) {
      await archiveConversation(id);
    }
    setSelectedConversationId(null);
    setDraftTabs([]);
    setSelectedDraftKey(null);
    setArchiving(false);
  }, [conversations, archiving, archiveConversation]);

  function downloadErrorLogFile() {
    if (!errorLog) return;
    const method = errorLog.method ?? 'GET';
    let curlLine = `curl -X ${method} '${errorLog.url}'`;
    if (method === 'POST' && errorLog.requestBody) {
      const escaped = errorLog.requestBody.replace(/'/g, "'\\''");
      curlLine += ` -H 'Content-Type: application/json' -d '${escaped}'`;
    }
    const lines = [
      '=== Log d\'erreur Assistant IA / Ekko Pacs API ===',
      '',
      `Date / heure : ${errorLog.timestamp}`,
      `Route : ${errorLog.route}`,
      `URL appelee : ${errorLog.url}`,
      `Message : ${errorLog.message}`,
      errorLog.status != null ? `Status HTTP : ${errorLog.status}` : '',
      '',
      '--- CURL pour reproduire la requete ---',
      '',
      curlLine,
      '',
      '--- Fin du log ---',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ekko-pacs-api-error-${errorLog.timestamp.replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function parseJsonResponse(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text || text.trimStart().startsWith('<')) {
      throw new Error('Response HTML received. Check URL and proxy.');
    }
    return JSON.parse(text);
  }

  const fetchStudyAndAgents = useCallback(async (includeArchived = false) => {
    if (!baseUrl || !externalId) return;
    setLoading(true);
    setError(null);
    setErrorLog(null);
    const studyUrl = API_STUDY_EXTERNAL(baseUrl, externalId, includeArchived);
    const agentsUrl = API_STUDY_AGENTS(baseUrl);
    let lastRoute = '';
    try {
      lastRoute = 'GET /api/study/external/{externalId}';
      const studyRes = await fetch(studyUrl);
      if (!studyRes.ok) {
        const errBody = await studyRes.text();
        setErrorLog({ route: lastRoute, url: studyUrl, message: errBody || `Study: ${studyRes.status}`, status: studyRes.status, timestamp: new Date().toISOString(), method: 'GET' });
        throw new Error(errBody || `Study: ${studyRes.status}`);
      }
      const studyData = (await parseJsonResponse(studyRes)) as Study;
      setStudy(studyData);
      const fromApi = Array.isArray(studyData.conversations) ? studyData.conversations : [];
      setConversations(prev => {
        const merged = [...fromApi];
        prev.forEach(c => { if (!merged.some(m => m.id === c.id)) merged.push(c); });
        return merged.sort((a, b) => a.id - b.id);
      });
      if (fromApi.length > 0) {
        setSelectedConversationId(fromApi[fromApi.length - 1]?.id ?? null);
        setSelectedDraftKey(null);
      }

      lastRoute = 'GET /api/study/agents';
      const agentsRes = await fetch(agentsUrl);
      if (!agentsRes.ok) {
        const errBody = await agentsRes.text();
        setErrorLog({ route: lastRoute, url: agentsUrl, message: errBody || `Agents: ${agentsRes.status}`, status: agentsRes.status, timestamp: new Date().toISOString(), method: 'GET' });
        throw new Error(errBody || `Agents: ${agentsRes.status}`);
      }
      const agentsData = (await parseJsonResponse(agentsRes)) as Agent[];
      setAgents(agentsData);
      setSelectedAgentId(prev => (prev === null && agentsData.length > 0 ? agentsData[0].id : prev));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur chargement';
      setError(msg);
      setErrorLog({ route: lastRoute || 'GET (study or agents)', url: lastRoute.includes('agents') ? agentsUrl : studyUrl, message: msg, timestamp: new Date().toISOString(), method: 'GET' });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, externalId]);

  useEffect(() => { fetchStudyAndAgents(); }, [fetchStudyAndAgents]);

  useEffect(() => {
    (window as any).__pacsiaIAPanelOpen = true;
    window.dispatchEvent(new CustomEvent('pacsia:panel-opened'));
    return () => {
      (window as any).__pacsiaIAPanelOpen = false;
      window.dispatchEvent(new CustomEvent('pacsia:panel-closed'));
    };
  }, []);

  useEffect(() => {
    const handleLoadAllConversations = () => setHistoryOpen(true);
    window.addEventListener('pacsia:load-all-conversations', handleLoadAllConversations);
    return () => window.removeEventListener('pacsia:load-all-conversations', handleLoadAllConversations);
  }, []);

  useEffect(() => {
    if (!historyOpen || !baseUrl || !externalId) return;
    setHistoryLoading(true);
    const studyUrl = API_STUDY_EXTERNAL(baseUrl, externalId, true);
    fetch(studyUrl)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Study: ${res.status}`)))
      .then((data: Study) => setHistoryConversations(Array.isArray(data.conversations) ? data.conversations : []))
      .catch(() => setHistoryConversations([]))
      .finally(() => setHistoryLoading(false));
  }, [historyOpen, baseUrl, externalId]);

  useEffect(() => {
    if (sending) {
      setReflectionSeconds(0);
      reflectionIntervalRef.current = setInterval(() => setReflectionSeconds(s => s + 1), 1000);
    } else {
      if (reflectionIntervalRef.current) { clearInterval(reflectionIntervalRef.current); reflectionIntervalRef.current = null; }
      setReflectionSeconds(0);
    }
    return () => { if (reflectionIntervalRef.current) { clearInterval(reflectionIntervalRef.current); reflectionIntervalRef.current = null; } };
  }, [sending]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [conversations, sending, selectedConversationId]);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1]); };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadOneImage = useCallback(
    async (file: File): Promise<number> => {
      if (!baseUrl || !study) throw new Error('Configuration manquante');
      const url = API_STUDY_IMAGE(baseUrl, study.id);
      const base64 = await fileToBase64(file);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, base64 }) });
      if (!res.ok) { const errBody = await res.text(); throw new Error(errBody || `Upload image: ${res.status}`); }
      const data = (await parseJsonResponse(res)) as Record<string, unknown>;
      const returnedId = (data?.id ?? data?.image_id) as number | undefined;
      if (returnedId == null) throw new Error(`Image upload: no id in response`);
      return returnedId;
    },
    [baseUrl, study, fileToBase64]
  );

  const handleFilesSelected = useCallback(
    (selectedFiles: FileList) => {
      if (!selectedFiles.length || !study || !baseUrl) return;
      const now = Date.now();
      const entries: PendingImage[] = Array.from(selectedFiles).map((file, i) => ({
        key: `img-${now}-${i}`, file, previewUrl: URL.createObjectURL(file), imageId: null, status: 'uploading' as const,
      }));
      setPendingImages(prev => [...prev, ...entries]);
      entries.forEach(entry => {
        uploadOneImage(entry.file)
          .then(id => setPendingImages(prev => prev.map(p => p.key === entry.key ? { ...p, imageId: id, status: 'done' as const } : p)))
          .catch(err => {
            setError(`Upload ${entry.file.name}: ${err instanceof Error ? err.message : String(err)}`);
            setPendingImages(prev => prev.map(p => p.key === entry.key ? { ...p, status: 'error' as const } : p));
          });
      });
    },
    [study, baseUrl, uploadOneImage]
  );

  useEffect(() => {
    const handleViewportCaptured = (e: Event) => {
      const file = (e as CustomEvent).detail?.file as File | undefined;
      if (file && study && baseUrl) {
        const fileList = new DataTransfer();
        fileList.items.add(file);
        handleFilesSelected(fileList.files);
      }
    };
    window.addEventListener('pacsia:viewport-captured', handleViewportCaptured);
    return () => window.removeEventListener('pacsia:viewport-captured', handleViewportCaptured);
  }, [study, baseUrl, handleFilesSelected]);

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverImage(false);
      const files = e.dataTransfer?.files;
      if (files?.length && study && baseUrl) handleFilesSelected(files);
    },
    [study, baseUrl, handleFilesSelected]
  );

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) e.dataTransfer.dropEffect = 'copy';
    setIsDragOverImage(true);
  }, []);

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOverImage(false);
  }, []);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !study || selectedAgentId === null || !baseUrl || sending) return;
    setMessage('');
    clearAllPendingImages();
    setSending(true);
    const activeTabId = selectedDraftKey ?? (selectedConversationId != null ? `conv-${selectedConversationId}` : null);
    setSendingTabId(activeTabId);
    setLastSentContent(text);
    setError(null);
    setErrorLog(null);

    const imageIds = pendingImages.filter(p => p.status === 'done' && p.imageId != null).map(p => p.imageId as number);
    const isNewConversation = selectedConversationId === null;

    if (isNewConversation) {
      const createUrl = API_CONVERSATION_CREATE(baseUrl);
      const body: { study_id: number; agent_id: number; message: string; image_ids?: number[] } = { study_id: study.id, agent_id: selectedAgentId, message: text };
      if (imageIds.length > 0) body.image_ids = imageIds;
      try {
        const res = await fetch(createUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = (await parseJsonResponse(res)) as { conversation?: Conversation; error?: string };
        if (!res.ok) {
          setErrorLog({ route: 'POST /api/study/conversation/create', url: createUrl, message: data?.error || `Erreur ${res.status}`, status: res.status, timestamp: new Date().toISOString(), method: 'POST', requestBody: JSON.stringify(body) });
          throw new Error(data?.error || `Erreur ${res.status}`);
        }
        if (data.conversation) {
          setConversations(prev => [...prev, data.conversation as Conversation]);
          setSelectedConversationId(data.conversation.id);
          if (selectedDraftKey) {
            setDraftTabs(prev => prev.filter(k => k !== selectedDraftKey));
            setSelectedDraftKey(null);
          }
          setMessage('');
          clearAllPendingImages();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur envoi';
        setError(msg);
      } finally {
        setSending(false);
        setSendingTabId(null);
        setLastSentContent(null);
      }
      return;
    }

    const messageBody: { message: string; agent_id: number; image_ids?: number[] } = { message: text, agent_id: selectedAgentId };
    if (imageIds.length > 0) messageBody.image_ids = imageIds;
    const messageUrl = API_CONVERSATION_MESSAGE(baseUrl, selectedConversationId);
    try {
      const res = await fetch(messageUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messageBody) });
      const data = (await parseJsonResponse(res)) as { conversation?: Conversation; message?: MessageItem; error?: string };
      if (!res.ok) {
        setErrorLog({ route: 'POST /api/study/conversation/{id}/message', url: messageUrl, message: data?.error || `Erreur ${res.status}`, status: res.status, timestamp: new Date().toISOString(), method: 'POST', requestBody: JSON.stringify(messageBody) });
        throw new Error(data?.error || `Erreur ${res.status}`);
      }
      if (data.conversation) {
        setConversations(prev => prev.map(c => (c.id === selectedConversationId ? data.conversation! : c)));
      } else if (data.message) {
        setConversations(prev => prev.map(c => c.id === selectedConversationId ? { ...c, messages: [...(c.messages ?? []), data.message!] } : c));
      }
      setMessage('');
      clearAllPendingImages();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur envoi');
    } finally {
      setSending(false);
      setSendingTabId(null);
      setLastSentContent(null);
    }
  };

  const noConfig = !baseUrl;
  const noStudy = !externalId;

  if (noConfig) {
    return (
      <div className="flex flex-1 flex-col gap-2 overflow-auto p-3 text-primary">
        <p className="text-sm">
          Configurez <code className="rounded bg-bkg-primary px-1">ekkoPacsApi.baseUrl</code> ou{' '}
          <code className="rounded bg-bkg-primary px-1">ekkoPacsApi.proxyPath</code> dans la configuration.
        </p>
      </div>
    );
  }
  if (noStudy) {
    return (
      <div className="flex flex-1 flex-col gap-2 overflow-auto p-3 text-primary">
        <p className="text-sm">Ouvrez une etude pour utiliser l&apos;Assistant IA.</p>
      </div>
    );
  }

  const selectedConversation = selectedConversationId != null ? conversations.find(c => c.id === selectedConversationId) ?? null : null;
  const someImagesStillUploading = pendingImages.some(p => p.status === 'uploading');
  const currentTabId = selectedDraftKey ?? (selectedConversationId != null ? `conv-${selectedConversationId}` : null);
  const isCurrentTabSending = sending && sendingTabId === currentTabId;
  const hasStartedCurrentConversation = isCurrentTabSending || (selectedConversationId != null && (selectedConversation?.messages?.length ?? 0) > 0);
  const showHistoryRecap = !hasStartedCurrentConversation;

  const lastThreeConversations = [...conversations]
    .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : b.id) - (a.createdAt ? new Date(a.createdAt).getTime() : a.id))
    .slice(0, 3);

  const handleSelectFromHistory = (id: number) => {
    setSelectedConversationId(id);
    setSelectedDraftKey(null);
    setHistoryOpen(false);
    fetchStudyAndAgents(true);
  };

  const renderInputZone = () => (
    <div className="shrink-0 p-3">
      <div className="rounded-lg border border-[#404040] bg-[#333] p-3">
        {pendingImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingImages.map(p => (
              <div key={p.key} className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-[#404040] bg-black">
                <img src={p.previewUrl} alt={p.file.name} className="h-full w-full object-cover" />
                {p.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Icons.ByName name="LoadingSpinner" className={`${IA_ICON_SIZE} text-white`} />
                  </div>
                )}
                {p.status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Icons.ByName name="StatusError" className={`${IA_ICON_SIZE} text-destructive`} />
                  </div>
                )}
                {p.status === 'done' && (
                  <div className="absolute bottom-0.5 right-0.5 rounded-full bg-green-600 p-0.5">
                    <Icons.ByName name="StatusSuccess" className={`${IA_ICON_SIZE} text-white`} />
                  </div>
                )}
                <button type="button" onClick={() => removePendingImage(p.key)} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white hover:bg-black/90" aria-label="Retirer">
                  <Icons.ByName name="Cancel" className={IA_ICON_SIZE} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          placeholder="Lancer une analyse ou rédiger un compte-rendu..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="w-full min-h-[4.5rem] resize-none border-0 bg-transparent text-sm text-white placeholder:text-[#737373] focus:outline-none"
          disabled={sending || loading}
          rows={3}
        />
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files?.length) handleFilesSelected(e.target.files); e.target.value = ''; }} />
        <div className="mt-2 flex items-center justify-between">
          {agents.length > 0 ? (
            <Select value={selectedAgentId != null && agents.some(a => a.id === selectedAgentId) ? String(selectedAgentId) : ''} onValueChange={v => setSelectedAgentId(v ? Number(v) : null)}>
              <SelectTrigger className="h-7 w-[110px] border-0 bg-transparent text-xs text-[#a3a3a3] hover:bg-[#404040]">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#404040]">
                {agents.map(a => (
                  <SelectItem key={a.id} value={String(a.id)} className="text-white focus:bg-[#3f3f3f]">{a.name ?? `Agent ${a.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-[#737373]">Agent</span>
          )}
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending || loading} className="rounded p-1.5 text-[#a3a3a3] hover:bg-[#404040] hover:text-white disabled:opacity-50" title="Joindre des images">
              <ImageIcon />
            </button>
            <button type="button" disabled={sending || loading} className="rounded p-1.5 text-[#a3a3a3] hover:bg-[#404040] hover:text-white disabled:opacity-50" title="Dictée vocale">
              <MicIcon />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || loading || !message.trim() || someImagesStillUploading}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#282828] hover:bg-[#e5e5e5] disabled:opacity-30"
              title={someImagesStillUploading ? 'Images en cours...' : 'Envoyer'}
              data-cy="assistant-ia-send"
            >
              <SendArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
      <style>{`
        @keyframes ia-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ia-tab-scroll::-webkit-scrollbar { height: 2px; }
        .ia-tab-scroll::-webkit-scrollbar-track { background: transparent; }
        .ia-tab-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 1px; }
        .ia-tab-scroll::-webkit-scrollbar-thumb:hover { background: #666; }
        .ia-tab-scroll { scrollbar-width: thin; scrollbar-color: #444 transparent; }
      `}</style>

      {/* Tab bar: conversations first, then New Chat drafts on the right */}
      <div className="flex shrink-0 items-center gap-0 border-b border-[#333] bg-[#252525] px-1 py-1">
        <div className="ia-tab-scroll flex min-w-0 flex-1 items-center gap-0 overflow-x-auto">
          {conversations.map((conv, idx) => {
            const label = getConversationLabel(conv);
            const isSelected = conv.id === selectedConversationId;
            const isDropTarget = dropIndex?.type === 'conv' && dropIndex.index === idx;
            const isDragging = dragTab?.type === 'conv' && dragTab.id === conv.id;
            return (
              <div
                key={conv.id}
                draggable
                onDragStart={e => {
                  setDragTab({ type: 'conv', id: conv.id, fromIndex: idx });
                  e.dataTransfer.setData('text/plain', `conv:${conv.id}`);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDropIndex({ type: 'conv', index: idx });
                }}
                onDragLeave={() => setDropIndex(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (dragTab?.type === 'conv') reorderConversations(dragTab.fromIndex, idx);
                  setDragTab(null);
                  setDropIndex(null);
                }}
                onDragEnd={() => { setDragTab(null); setDropIndex(null); }}
                className={`group relative shrink-0 cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <div className={`max-w-[160px] truncate px-3 py-1.5 pr-6 text-sm ${isSelected ? 'bg-[#1e1e1e] text-white' : 'text-[#808080] hover:text-[#cccccc]'} ${isDropTarget ? 'ring-1 ring-inset ring-white/50' : ''}`}>
                  {label}
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); archiveConversation(conv.id); }}
                  className="absolute right-1 top-1/2 hidden -translate-y-1/2 p-0.5 group-hover:flex"
                  aria-label="Fermer"
                >
                  <CloseIcon />
                </button>
              </div>
            );
          })}
          {draftTabs.map((key, idx) => {
            const isSelected = selectedDraftKey === key;
            const isDropTarget = dropIndex?.type === 'draft' && dropIndex.index === idx;
            const isDragging = dragTab?.type === 'draft' && dragTab.key === key;
            return (
              <div
                key={key}
                draggable
                onDragStart={e => {
                  setDragTab({ type: 'draft', key, fromIndex: idx });
                  e.dataTransfer.setData('text/plain', `draft:${key}`);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDropIndex({ type: 'draft', index: idx });
                }}
                onDragLeave={() => setDropIndex(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (dragTab?.type === 'draft') reorderDrafts(dragTab.fromIndex, idx);
                  setDragTab(null);
                  setDropIndex(null);
                }}
                onDragEnd={() => { setDragTab(null); setDropIndex(null); }}
                className={`group relative shrink-0 cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
                onClick={() => handleSelectDraft(key)}
              >
                <div className={`truncate px-3 py-1.5 pr-6 text-sm ${isSelected ? 'bg-[#1e1e1e] text-white' : 'text-[#808080] hover:text-[#cccccc]'} ${isDropTarget ? 'ring-1 ring-inset ring-white/50' : ''}`}>
                  New Chat
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleCloseDraft(key); }}
                  className="absolute right-1 top-1/2 hidden -translate-y-1/2 p-0.5 group-hover:flex"
                  aria-label="Fermer"
                >
                  <CloseIcon />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 pl-1">
          <button type="button" onClick={handleNewChat} className="rounded p-1 hover:bg-[#333]" title="Nouveau chat">
            <PlusIcon />
          </button>
          <button type="button" onClick={() => setHistoryOpen(true)} className="rounded p-1 text-[#808080] hover:bg-[#333] hover:text-white" title="Historique">
            <HistoryClockIcon />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="rounded p-1 text-[#808080] hover:bg-[#333] hover:text-white" title="Options" disabled={archiving}>
                <Icons.ByName name="More" className={IA_ICON_SIZE} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2d2d2d] border-[#404040]">
              <DropdownMenuItem
                onClick={() => {
                  if (selectedConversationId != null) {
                    archiveConversation(selectedConversationId);
                  } else if (selectedDraftKey) {
                    handleCloseDraft(selectedDraftKey);
                  }
                }}
                disabled={(selectedConversationId == null && selectedDraftKey == null) || archiving}
                className="text-white focus:bg-[#3f3f3f]"
              >
                Archiver le chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={archiveOthers} disabled={conversations.length <= 1 || archiving} className="text-white focus:bg-[#3f3f3f]">
                Archiver les autres chats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={archiveAll} disabled={conversations.length === 0 || archiving} className="text-white focus:bg-[#3f3f3f]">
                Archiver tous les chats
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content drop zone for images */}
      <div
        className="relative flex flex-1 flex-col min-h-0"
        onDragOver={handleImageDragOver}
        onDragLeave={handleImageDragLeave}
        onDrop={handleImageDrop}
      >
        {isDragOverImage && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded border-2 border-dashed border-[#555] bg-[#1e1e1e]/95">
            <span className="text-sm font-medium text-[#a3a3a3]">Déposer l&apos;image ici</span>
          </div>
        )}

      {/* History popin */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] bg-[#1e1e1e] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Historique des conversations</DialogTitle>
          </DialogHeader>
          <Input placeholder="Chercher..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="mb-3 bg-[#2a2a2a] border-[#333] text-white placeholder:text-[#666]" />
          {historyLoading ? (
            <div className="flex items-center gap-2 py-4 text-[#808080]">
              <Icons.ByName name="LoadingSpinner" className={IA_ICON_SIZE} />
              Chargement...
            </div>
          ) : historyConversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#666]">Aucun historique de chat</div>
          ) : (
            <ScrollArea className="max-h-[50vh] pr-2">
              {groupConversationsByPeriod(
                historySearch.trim()
                  ? historyConversations.filter(c => getConversationLabel(c).toLowerCase().includes(historySearch.trim().toLowerCase()))
                  : historyConversations
              ).map(({ label, conversations: groupConvs }) => (
                <div key={label} className="mb-4">
                  <div className="mb-1.5 text-xs font-medium text-[#666]">{label}</div>
                  <div className="flex flex-col gap-0.5">
                    {groupConvs.map(conv => {
                      const isActive = conv.id === selectedConversationId;
                      return (
                        <div key={conv.id} className={`group flex items-center gap-2 rounded px-2 py-2 ${isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#252525]'}`}>
                          <button type="button" onClick={() => handleSelectFromHistory(conv.id)} className="flex flex-1 min-w-0 items-center gap-2 text-left">
                            <span className="flex shrink-0 text-[#808080]"><Icons.ByName name="Checked" className={IA_ICON_SIZE} /></span>
                            <span className="min-w-0 truncate text-sm text-white">{getConversationLabel(conv)}</span>
                          </button>
                          {isActive && <span className="shrink-0 text-[#22c55e]"><Icons.ByName name="StatusSuccess" className={IA_ICON_SIZE} /></span>}
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                            <button type="button" onClick={e => { e.stopPropagation(); }} className="rounded p-1 text-[#808080] hover:text-white" title="Renommer">
                              <Icons.ByName name="Pencil" className={IA_ICON_SIZE} />
                            </button>
                            <button type="button" onClick={e => { e.stopPropagation(); archiveConversation(conv.id); }} className="rounded p-1 text-[#808080] hover:text-destructive" title="Archiver">
                              <Icons.ByName name="Trash" className={IA_ICON_SIZE} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Input zone on top when no conversation started */}
      {showHistoryRecap && renderInputZone()}

      {/* Content area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="flex flex-col gap-4 p-3 text-white">
          {error && (
            <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>{error}</span>
              {errorLog && (
                <Button type="button" variant="outline" size="sm" className="mt-2 border-destructive/50 text-destructive hover:bg-destructive/20" onClick={downloadErrorLogFile}>
                  Télécharger le log d&apos;erreur
                </Button>
              )}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[#808080]">
              <Icons.ByName name="LoadingSpinner" className={IA_ICON_SIZE} />
              Chargement de l&apos;étude et des agents...
            </div>
          )}
          {hasStartedCurrentConversation && (
            <>
              {selectedConversation?.messages?.map(msg => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="self-end rounded-2xl bg-[#333] px-4 py-2 text-sm text-white">{msg.content}</div>
                  {msg.response && (
                    <div className="rounded-lg border border-[#333] bg-[#252525] px-3 py-2 text-sm">{renderMarkdown(msg.response)}</div>
                  )}
                </div>
              ))}
              {isCurrentTabSending && lastSentContent && (
                <div className="flex flex-col gap-2">
                  <div className="self-end rounded-2xl bg-[#333] px-4 py-2 text-sm text-white">{lastSentContent}</div>
                  <div className="text-xs italic text-[#808080]">Réflexion pendant {reflectionSeconds} s</div>
                  <div className="rounded-lg border border-[#333] bg-[#252525] px-3 py-3">
                    <div className="space-y-1 text-sm">
                      <div className="font-medium text-white">
                        {REFLECTION_PHRASES[reflectionSeconds % REFLECTION_PHRASES.length]}
                      </div>
                      <div
                        style={{
                          background: 'linear-gradient(90deg, #555 0%, #e5e5e5 50%, #555 100%)',
                          backgroundSize: '200% 100%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: 'ia-shimmer 2s linear infinite',
                        }}
                      >
                        {REFLECTION_PHRASES[(reflectionSeconds + 1) % REFLECTION_PHRASES.length]}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {!loading && agents.length === 0 && !error && (
            <p className="text-sm text-[#808080]">Aucun agent disponible pour cette étude.</p>
          )}
        </div>
      </ScrollArea>

      {/* Anciens Chats */}
      {showHistoryRecap && (
        <div className="shrink-0 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-medium text-[#808080]">
              <Icons.ByName name="ChevronDown" className={IA_ICON_SIZE} />
              Anciens Chats
            </span>
            <button type="button" onClick={() => setHistoryOpen(true)} className="text-xs text-[#666] hover:text-white">Tout voir</button>
          </div>
          {lastThreeConversations.length > 0 ? (
            <div className="mt-1.5 flex flex-col gap-0.5">
              {lastThreeConversations.map(conv => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`rounded px-2 py-1.5 text-left text-sm ${conv.id === selectedConversationId ? 'bg-[#2a2a2a] text-white' : 'text-[#808080] hover:bg-[#252525] hover:text-white'}`}
                >
                  {getConversationLabel(conv)}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-center text-xs text-[#666]">Aucun historique de chat</div>
          )}
        </div>
      )}

      {/* Input zone at bottom when conversation started */}
      {!showHistoryRecap && renderInputZone()}
      </div>
    </div>
  );
}
