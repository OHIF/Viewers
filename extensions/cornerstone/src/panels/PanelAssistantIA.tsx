import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Input,
  ScrollArea,
  Icons,
  useImageViewer,
} from '@ohif/ui-next';

const API_STUDY_EXTERNAL = (base: string, externalId: string) =>
  `${base.replace(/\/$/, '')}/api/study/external/${encodeURIComponent(externalId)}`;
const API_STUDY_AGENTS = (base: string) =>
  `${base.replace(/\/$/, '')}/api/study/agents`;
const API_CONVERSATION_CREATE = (base: string) =>
  `${base.replace(/\/$/, '')}/api/study/conversation/create`;

type Study = {
  id: number;
  name: string | null;
  externalId: string | null;
  description: string | null;
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
  } | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);

  function downloadErrorLogFile() {
    if (!errorLog) return;
    const lines = [
      '=== Log d\'erreur Assistant IA / Ekko Pacs API ===',
      '',
      `Date / heure : ${errorLog.timestamp}`,
      `Route : ${errorLog.route}`,
      `URL appelée : ${errorLog.url}`,
      `Message : ${errorLog.message}`,
      errorLog.status != null ? `Status HTTP : ${errorLog.status}` : '',
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
      throw new Error('Réponse HTML reçue (redirection ou page d’erreur). Vérifiez l’URL et le proxy.');
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Réponse invalide: ${text.slice(0, 80)}…`);
    }
  }

  const fetchStudyAndAgents = useCallback(async () => {
    if (!baseUrl || !externalId) {
      return;
    }
    setLoading(true);
    setError(null);
    setErrorLog(null);
    const studyUrl = API_STUDY_EXTERNAL(baseUrl, externalId);
    const agentsUrl = API_STUDY_AGENTS(baseUrl);
    let lastRoute = '';
    try {
      lastRoute = `GET /api/study/external/{externalId}`;
      const studyRes = await fetch(studyUrl);
      if (!studyRes.ok) {
        const errBody = await studyRes.text();
        setErrorLog({
          route: lastRoute,
          url: studyUrl,
          message: errBody || `Study: ${studyRes.status}`,
          status: studyRes.status,
          timestamp: new Date().toISOString(),
        });
        throw new Error(errBody || `Study: ${studyRes.status}`);
      }
      const studyData = (await parseJsonResponse(studyRes)) as Study;
      setStudy(studyData);

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
        route: lastRoute || 'GET (étude ou agents)',
        url: lastRoute.includes('agents') ? agentsUrl : studyUrl,
        message: msg,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, externalId]);

  useEffect(() => {
    fetchStudyAndAgents();
  }, [fetchStudyAndAgents]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !study || selectedAgentId === null || !baseUrl || sending) {
      return;
    }
    setSending(true);
    setError(null);
    setErrorLog(null);
    const createUrl = API_CONVERSATION_CREATE(baseUrl);
    try {
      const body: {
        study_id: number;
        agent_id: number;
        message?: string;
        prompt_id?: number;
      } = {
        study_id: study.id,
        agent_id: selectedAgentId,
        message: text,
      };
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
        });
        throw new Error(data?.error || `Erreur ${res.status}`);
      }
      if (data.conversation) {
        setConversation(data.conversation);
        setMessage('');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur envoi';
      setError(msg);
      setErrorLog({
        route: 'POST /api/study/conversation/create',
        url: createUrl,
        message: msg,
        timestamp: new Date().toISOString(),
      });
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
        <p className="text-sm">Ouvrez une étude pour utiliser l&apos;Assistant IA.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bkg-primary">
      {/* Chat header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-b-primary/20 px-3 py-2">
        <Button
          variant="secondary"
          size="sm"
          className="text-secondary-foreground"
        >
          New Chat
        </Button>
        <div className="flex flex-1 justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Icons.ByName name="Add" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Icons.ByName name="Refresh" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Icons.ByName name="More" />
          </Button>
        </div>
      </div>

      {/* Input zone */}
      <div className="shrink-0 border-b border-b-primary/20 p-3">
        <div className="rounded-lg border border-primary/25 bg-bkg-low p-2">
          <div className="mb-1 rounded bg-bkg-primary/50 px-2 py-1 text-xs text-secondary-foreground">
            @Ajouter du contexte
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Lancer une analyse ou rédiger un compte-rendu..."
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
              disabled={sending || loading || !message.trim()}
              data-cy="assistant-ia-send"
            >
              <Icons.ByName name="ArrowDown" className="rotate-180" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content: agents + conversation */}
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
                  Télécharger le log d&apos;erreur
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-secondary-foreground">
              <Icons.ByName name="LoadingSpinner" className="h-4 w-4" />
              Chargement de l&apos;étude et des agents…
            </div>
          )}

          {/* Agents list — under the chat */}
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

          {/* Conversation messages */}
          {conversation?.messages?.length > 0 && (
            <div className="flex flex-col gap-3">
              {conversation.messages.map(msg => (
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
              Aucun agent disponible pour cette étude.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
