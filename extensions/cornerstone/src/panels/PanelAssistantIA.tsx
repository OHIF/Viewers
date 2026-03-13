import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  ScrollArea,
  Icons,
  useImageViewer,
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

const PaperclipIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedConversationId(prev =>
        prev === conversationId ? null : prev
      );
    },
    [baseUrl]
  );

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
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid response: ${text.slice(0, 80)}`);
    }
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
        setErrorLog({
          route: lastRoute,
          url: studyUrl,
          message: errBody || `Study: ${studyRes.status}`,
          status: studyRes.status,
          timestamp: new Date().toISOString(),
          method: 'GET',
        });
        throw new Error(errBody || `Study: ${studyRes.status}`);
      }
      const studyData = (await parseJsonResponse(studyRes)) as Study;
      setStudy(studyData);
      const fromApi = Array.isArray(studyData.conversations) ? studyData.conversations : [];
      setConversations(prev => {
        const merged = [...fromApi];
        prev.forEach(c => {
          if (!merged.some(m => m.id === c.id)) merged.push(c);
        });
        return merged.sort((a, b) => a.id - b.id);
      });
      setSelectedConversationId(prev => {
        if (fromApi.length === 0) return prev;
        return fromApi[fromApi.length - 1]?.id ?? null;
      });

      lastRoute = 'GET /api/study/agents';
      const agentsRes = await fetch(agentsUrl);
      if (!agentsRes.ok) {
        const errBody = await agentsRes.text();
        setErrorLog({
          route: lastRoute,
          url: agentsUrl,
          message: errBody || `Agents: ${agentsRes.status}`,
          status: agentsRes.status,
          timestamp: new Date().toISOString(),
          method: 'GET',
        });
        throw new Error(errBody || `Agents: ${agentsRes.status}`);
      }
      const agentsData = (await parseJsonResponse(agentsRes)) as Agent[];
      setAgents(agentsData);
      setSelectedAgentId(prev => (prev === null && agentsData.length > 0 ? agentsData[0].id : prev));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur chargement';
      setError(msg);
      setErrorLog({
        route: lastRoute || 'GET (study or agents)',
        url: lastRoute.includes('agents') ? agentsUrl : studyUrl,
        message: msg,
        timestamp: new Date().toISOString(),
        method: 'GET',
      });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, externalId]);

  useEffect(() => {
    fetchStudyAndAgents();
  }, [fetchStudyAndAgents]);

  useEffect(() => {
    const handleLoadAllConversations = () => {
      setShowArchived(prev => {
        const next = !prev;
        fetchStudyAndAgents(next);
        return next;
      });
    };
    window.addEventListener('pacsia:load-all-conversations', handleLoadAllConversations);
    return () => window.removeEventListener('pacsia:load-all-conversations', handleLoadAllConversations);
  }, [fetchStudyAndAgents]);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadOneImage = useCallback(
    async (file: File): Promise<number> => {
      if (!baseUrl || !study) throw new Error('Configuration manquante');
      const url = API_STUDY_IMAGE(baseUrl, study.id);
      const base64 = await fileToBase64(file);
      const body = { filename: file.name, base64 };
      console.log(`[AssistantIA] Uploading image to: ${url}`, { fileName: file.name, size: file.size });
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[AssistantIA] Upload failed: ${res.status}`, errBody);
        throw new Error(errBody || `Upload image: ${res.status}`);
      }
      const data = (await parseJsonResponse(res)) as Record<string, unknown>;
      console.log('[AssistantIA] Upload response:', data);
      const returnedId = (data?.id ?? data?.image_id) as number | undefined;
      if (returnedId == null) throw new Error(`Image upload: no id in response (keys: ${Object.keys(data).join(', ')})`);
      return returnedId;
    },
    [baseUrl, study, fileToBase64]
  );

  const handleFilesSelected = useCallback(
    (selectedFiles: FileList) => {
      if (!selectedFiles.length || !study || !baseUrl) return;
      const now = Date.now();
      const entries: PendingImage[] = Array.from(selectedFiles).map((file, i) => ({
        key: `img-${now}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
        imageId: null,
        status: 'uploading' as const,
      }));
      setPendingImages(prev => [...prev, ...entries]);
      entries.forEach(entry => {
        uploadOneImage(entry.file)
          .then(id => {
            console.log(`[AssistantIA] Image uploaded: ${entry.file.name} => id=${id}`);
            setPendingImages(prev =>
              prev.map(p =>
                p.key === entry.key ? { ...p, imageId: id, status: 'done' as const } : p
              )
            );
          })
          .catch(err => {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[AssistantIA] Image upload failed: ${entry.file.name}`, msg);
            setError(`Upload ${entry.file.name}: ${msg}`);
            setPendingImages(prev =>
              prev.map(p =>
                p.key === entry.key ? { ...p, status: 'error' as const } : p
              )
            );
          });
      });
    },
    [study, baseUrl, uploadOneImage]
  );

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !study || selectedAgentId === null || !baseUrl || sending) return;
    setSending(true);
    setError(null);
    setErrorLog(null);

    const imageIds = pendingImages
      .filter(p => p.status === 'done' && p.imageId != null)
      .map(p => p.imageId as number);

    const isNewConversation = selectedConversationId === null;

    if (isNewConversation) {
      const createUrl = API_CONVERSATION_CREATE(baseUrl);
      const body: { study_id: number; agent_id: number; message: string; image_ids?: number[] } = {
        study_id: study.id,
        agent_id: selectedAgentId,
        message: text,
      };
      if (imageIds.length > 0) body.image_ids = imageIds;
      try {
        const res = await fetch(createUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await parseJsonResponse(res)) as {
          conversation?: Conversation;
          error?: string;
        };
        if (!res.ok) {
          setErrorLog({
            route: 'POST /api/study/conversation/create',
            url: createUrl,
            message: data?.error || `Erreur ${res.status}`,
            status: res.status,
            timestamp: new Date().toISOString(),
            method: 'POST',
            requestBody: JSON.stringify(body),
          });
          throw new Error(data?.error || `Erreur ${res.status}`);
        }
        if (data.conversation) {
          setConversations(prev => [...prev, data.conversation as Conversation]);
          setSelectedConversationId(data.conversation.id);
          setMessage('');
          clearAllPendingImages();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur envoi';
        setError(msg);
        setErrorLog(prev =>
          prev ?? {
            route: 'POST /api/study/conversation/create',
            url: createUrl,
            message: msg,
            timestamp: new Date().toISOString(),
            method: 'POST',
            requestBody: JSON.stringify(body),
          }
        );
      } finally {
        setSending(false);
      }
      return;
    }

    const messageBody: { message: string; agent_id: number; image_ids?: number[] } = {
      message: text,
      agent_id: selectedAgentId,
    };
    if (imageIds.length > 0) messageBody.image_ids = imageIds;
    const messageUrl = API_CONVERSATION_MESSAGE(baseUrl, selectedConversationId);
    try {
      const res = await fetch(messageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageBody),
      });
      const data = (await parseJsonResponse(res)) as {
        conversation?: Conversation;
        message?: MessageItem;
        error?: string;
      };
      if (!res.ok) {
        setErrorLog({
          route: 'POST /api/study/conversation/{id}/message',
          url: messageUrl,
          message: data?.error || `Erreur ${res.status}`,
          status: res.status,
          timestamp: new Date().toISOString(),
          method: 'POST',
          requestBody: JSON.stringify(messageBody),
        });
        throw new Error(data?.error || `Erreur ${res.status}`);
      }
      if (data.conversation) {
        setConversations(prev =>
          prev.map(c => (c.id === selectedConversationId ? data.conversation! : c))
        );
      } else if (data.message) {
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConversationId
              ? { ...c, messages: [...(c.messages ?? []), data.message!] }
              : c
          )
        );
      }
      setMessage('');
      clearAllPendingImages();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur envoi';
      setError(msg);
      setErrorLog(prev =>
        prev ?? {
          route: 'POST /api/study/conversation/{id}/message',
          url: messageUrl,
          message: msg,
          timestamp: new Date().toISOString(),
          method: 'POST',
          requestBody: JSON.stringify(messageBody),
        }
      );
    } finally {
      setSending(false);
    }
  };

  const noConfig = !baseUrl;
  const noStudy = !externalId;

  if (noConfig) {
    return (
      <div className="flex flex-1 flex-col gap-2 overflow-auto p-3 text-primary">
        <p className="text-sm">
          Configurez <code className="rounded bg-bkg-primary px-1">ekkoPacsApi.baseUrl</code> ou{' '}
          <code className="rounded bg-bkg-primary px-1">ekkoPacsApi.proxyPath</code> dans la
          configuration.
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

  const selectedConversation =
    selectedConversationId != null
      ? conversations.find(c => c.id === selectedConversationId) ?? null
      : null;

  const someImagesStillUploading = pendingImages.some(p => p.status === 'uploading');

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bkg-primary">
      {/* Chat header */}
      <div className="flex shrink-0 flex-col gap-1 border-b border-b-primary/20 px-2 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant={selectedConversationId === null ? 'default' : 'secondary'}
            size="sm"
            className="text-secondary-foreground"
            onClick={() => setSelectedConversationId(null)}
          >
            New Chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setSelectedConversationId(null)}
            title="Nouvelle conversation"
          >
            <Icons.ByName name="Add" />
          </Button>
          <div className="flex flex-1 justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => fetchStudyAndAgents(showArchived)}
              title="Actualiser"
            >
              <Icons.ByName name="Refresh" />
            </Button>
          </div>
        </div>
        {showArchived && (
          <div className="flex items-center justify-between rounded bg-primary/10 px-2 py-1">
            <span className="text-xs text-primary">Conversations archivées incluses</span>
            <button
              type="button"
              onClick={() => {
                setShowArchived(false);
                fetchStudyAndAgents(false);
              }}
              className="rounded p-0.5 text-primary hover:bg-primary/20"
              title="Masquer les archivées"
            >
              <Icons.ByName name="Cancel" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {conversations.length > 0 && (
          <ScrollArea className="max-h-[120px]">
            <div className="flex flex-col gap-0.5 pr-1">
              {conversations.map(conv => {
                const firstContent = conv.messages?.[0]?.content?.trim();
                const label = firstContent
                  ? firstContent.slice(0, 40) + (firstContent.length > 40 ? '...' : '')
                  : 'New Chat';
                const isSelected = conv.id === selectedConversationId;
                return (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center rounded hover:bg-primary/15 ${
                      isSelected ? 'bg-primary/20 text-primary' : 'text-secondary-foreground'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedConversationId(conv.id)}
                      className="flex-1 truncate px-2 py-1.5 text-left text-sm"
                    >
                      {label}
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        archiveConversation(conv.id);
                      }}
                      className="mr-1 hidden shrink-0 rounded p-0.5 text-secondary-foreground hover:bg-destructive/20 hover:text-destructive group-hover:block"
                      title="Clore la conversation"
                      aria-label="Clore la conversation"
                    >
                      <Icons.ByName name="Cancel" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Zone de saisie */}
      <div className="shrink-0 border-b border-b-primary/20 p-3">
        <div className="rounded-lg border border-primary/25 bg-bkg-low p-2">
          <div className="mb-1 rounded bg-bkg-primary/50 px-2 py-1 text-xs text-secondary-foreground">
            @Ajouter du contexte
          </div>

          {/* Miniatures des images jointes */}
          {pendingImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingImages.map(p => (
                <div
                  key={p.key}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-primary/25 bg-black"
                >
                  <img
                    src={p.previewUrl}
                    alt={p.file.name}
                    className="h-full w-full object-cover"
                  />
                  {p.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Icons.ByName name="LoadingSpinner" className="h-5 w-5 text-white" />
                    </div>
                  )}
                  {p.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Icons.ByName name="StatusError" className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  {p.status === 'done' && (
                    <div className="absolute bottom-0.5 right-0.5 rounded-full bg-green-600 p-0.5">
                      <Icons.ByName name="StatusSuccess" className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePendingImage(p.key)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white hover:bg-black/90"
                    aria-label="Retirer"
                  >
                    <Icons.ByName name="Cancel" className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input + trombone + send */}
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFilesSelected(files);
                }
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-secondary-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              title="Joindre des images"
              disabled={sending || loading}
            >
              <PaperclipIcon />
            </Button>
            <Input
              placeholder="Lancer une analyse ou rediger un compte-rendu..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent text-primary placeholder:text-secondary-foreground focus-visible:ring-0"
              disabled={sending || loading}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={sending || loading || !message.trim() || someImagesStillUploading}
              data-cy="assistant-ia-send"
              title={someImagesStillUploading ? 'Images en cours de synchronisation...' : 'Envoyer'}
            >
              <Icons.ByName name="ArrowDown" className="rotate-180" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          {error && (
            <div className="flex flex-col gap-2 rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>{error}</span>
              {errorLog && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit border-destructive/50 text-destructive hover:bg-destructive/20"
                  onClick={downloadErrorLogFile}
                >
                  Telecharger le log d&apos;erreur
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-secondary-foreground">
              <Icons.ByName name="LoadingSpinner" className="h-4 w-4" />
              Chargement de l&apos;etude et des agents...
            </div>
          )}

          {!loading && agents.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                Agents disponibles
              </span>
              <div className="flex flex-wrap gap-2">
                {agents.map(agent => (
                  <Button
                    key={agent.id}
                    variant={selectedAgentId === agent.id ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="text-xs"
                  >
                    {agent.name ?? `Agent ${agent.id}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedConversation?.messages?.length > 0 && (
            <div className="flex flex-col gap-3">
              {selectedConversation.messages.map(msg => (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                    {msg.content}
                  </div>
                  {msg.response && (
                    <div className="rounded-lg border border-primary/20 bg-bkg-low px-3 py-2 text-sm text-primary">
                      {msg.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && agents.length === 0 && !error && (
            <p className="text-sm text-secondary-foreground">
              Aucun agent disponible pour cette etude.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
