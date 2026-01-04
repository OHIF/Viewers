import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Icons } from '@ohif/ui-next';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSectionProps {
  apiEndpoint?: string;
  disabled?: boolean;
}

// Storage key for chat session ID (set by report generation)
const CHAT_SESSION_ID_KEY = 'chat_session_id';

function ChatSection({ apiEndpoint, disabled = false }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the API base URL from environment (same as file upload)
  // @ts-ignore - REACT_APP_CHAT_API_URL is injected at build time
  const chatApiUrl = process.env.REACT_APP_CHAT_API_URL || '';
  const ephemeralChatEndpoint = apiEndpoint || (chatApiUrl
    ? `${chatApiUrl}/api/ephemeral_chat`
    : '/api/ephemeral_chat');

  // Log the endpoint on mount for debugging
  useEffect(() => {
    console.log('[ChatSection] Ephemeral chat endpoint:', ephemeralChatEndpoint);
  }, [ephemeralChatEndpoint]);

  // Check for chat session ID on mount and when storage changes
  useEffect(() => {
    const checkSessionId = () => {
      const storedSessionId = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
      if (storedSessionId && storedSessionId !== chatSessionId) {
        setChatSessionId(storedSessionId);
        console.log('[ChatSection] Chat session ID loaded:', storedSessionId);
      }
    };

    // Check immediately
    checkSessionId();

    // Listen for storage events (in case it's set from another component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CHAT_SESSION_ID_KEY) {
        checkSessionId();
      }
    };

    // Also poll periodically in case sessionStorage is updated in same tab
    const intervalId = setInterval(checkSessionId, 1000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [chatSessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, role: 'user' | 'bot') => {
    const newMessage: Message = {
      id: `${role}-${Date.now()}-${Math.random()}`,
      text,
      role,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) {
      return;
    }

    // Check if we have a session ID
    const currentSessionId = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
    console.log('[ChatSection] Current session ID:', currentSessionId);

    if (!currentSessionId) {
      addMessage(message, 'user');
      addMessage('Please generate a report first to start chatting about it.', 'bot');
      setInputValue('');
      return;
    }

    // Add user message immediately
    addMessage(message, 'user');
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('[ChatSection] Sending message to:', ephemeralChatEndpoint);
      console.log('[ChatSection] Request body:', { message, sessionId: currentSessionId });

      const response = await fetch(ephemeralChatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId: currentSessionId }),
        credentials: 'include',
      });

      console.log('[ChatSection] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChatSection] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ChatSection] Response data:', data);

      // Handle various response formats from the API
      const botResponse =
        data.result ??
        data.output ??
        data.message ??
        data.reply ??
        data.response ??
        data.text ??
        JSON.stringify(data);

      addMessage(botResponse, 'bot');
    } catch (error) {
      console.error('[ChatSection] Chat error:', error);
      addMessage(`Sorry, I am having trouble connecting. Error: ${error.message}`, 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputValue.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  const isReportReady = !!chatSessionId;

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Status indicator */}
      <div
        className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
          isReportReady
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}
      >
        <div
          className={`h-2 w-2 rounded-full ${isReportReady ? 'bg-green-400' : 'bg-yellow-400'}`}
        />
        {isReportReady ? 'Report ready - you can chat now' : 'Generate a report to start chatting'}
      </div>

      {/* Messages area */}
      <div className="bg-background max-h-64 min-h-32 overflow-y-auto rounded border p-2">
        <div className="flex flex-col gap-2">
          {/* Initial welcome message */}
          <div className="flex flex-col items-start">
            <div className="bg-orange-900/50 text-orange-100 flex max-w-[85%] items-start gap-2 rounded px-2 py-1">
              <Icons.Info className="mt-0.5 h-3 w-3 shrink-0 text-orange-400" />
              <div className="text-xs">
                {isReportReady
                  ? "Hello! I'm your MRI Assistant. Your report is ready - ask me anything about it!"
                  : "Hello! I'm your MRI Assistant. Please click the 'Report' button in the Study Browser to generate a report first, then we can discuss it."}
              </div>
            </div>
            <span className="text-orange-400/70 mt-0.5 text-[10px]">Assistant</span>
          </div>

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded px-2 py-1 ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-900/50 text-orange-100'
                }`}
              >
                <div className="text-xs">{msg.text}</div>
              </div>
              <span className="mt-0.5 text-[10px] text-orange-400/70">
                {msg.role === 'user' ? 'You' : 'Assistant'} • {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="bg-orange-900/50 text-orange-100 flex max-w-[85%] items-center gap-2 rounded px-2 py-1">
                <Icons.LoadingSpinner className="h-3 w-3 animate-spin text-orange-400" />
                <div className="text-xs">Thinking...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReportReady ? 'Ask about the MRI report...' : 'Generate a report first...'}
          disabled={isLoading || disabled || !isReportReady}
          maxLength={500}
          className="flex-1 text-xs border-orange-500/50 bg-orange-900/20 text-orange-100 placeholder:text-orange-400/50 focus:border-orange-500 focus:ring-orange-500/30"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading || disabled || !isReportReady}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white"
        >
          {isLoading ? (
            <Icons.LoadingSpinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default ChatSection;
