import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, ScrollArea, Icons } from '@ohif/ui-next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

// Storage key for chat session ID (set by report generation)
const CHAT_SESSION_ID_KEY = 'chat_session_id';

function SideChatPanel({ servicesManager, commandsManager }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the API base URL from environment (same as file upload)
  // @ts-ignore - REACT_APP_CHAT_API_URL is injected at build time
  const chatApiUrl = process.env.REACT_APP_CHAT_API_URL || '';
  const ephemeralChatEndpoint = chatApiUrl
    ? `${chatApiUrl}/api/ephemeral_chat`
    : '/api/ephemeral_chat';

  // Log the endpoint on mount for debugging
  useEffect(() => {
    console.log('[SideChatPanel] Ephemeral chat endpoint:', ephemeralChatEndpoint);
  }, [ephemeralChatEndpoint]);

  // Check for chat session ID on mount and when storage changes
  useEffect(() => {
    const checkSessionId = () => {
      const storedSessionId = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
      if (storedSessionId !== chatSessionId) {
        setChatSessionId(storedSessionId);
        if (storedSessionId) {
          console.log('[SideChatPanel] Chat session ID loaded:', storedSessionId);
        }
      }
    };

    // Check immediately
    checkSessionId();

    // Poll periodically in case sessionStorage is updated in same tab
    const intervalId = setInterval(checkSessionId, 1000);

    return () => {
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
    console.log('[SideChatPanel] Current session ID:', currentSessionId);

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
      console.log('[SideChatPanel] Sending message to:', ephemeralChatEndpoint);
      console.log('[SideChatPanel] Request body:', { message, sessionId: currentSessionId });

      const response = await fetch(ephemeralChatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId: currentSessionId }),
        credentials: 'include',
      });

      console.log('[SideChatPanel] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SideChatPanel] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[SideChatPanel] Response data:', data);

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
      console.error('[SideChatPanel] Chat error:', error);
      addMessage(`Sorry, I am having trouble connecting. Error: ${error.message}`, 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  const isReportReady = !!chatSessionId;

  return (
    <div className="flex h-full flex-col bg-black p-4">
      <h2 className="text-foreground mb-4 text-lg font-medium">Chat</h2>

      {/* Status indicator */}
      <div
        className={`mb-3 flex items-center gap-2 rounded px-2 py-1 text-xs ${
          isReportReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}
      >
        <div
          className={`h-2 w-2 rounded-full ${isReportReady ? 'bg-green-400' : 'bg-yellow-400'}`}
        />
        {isReportReady ? 'Report ready - you can chat now' : 'Generate a report to start chatting'}
      </div>

      {/* Messages area */}
      <ScrollArea className="mb-4 flex-1">
        <div className="flex flex-col gap-3 pr-2">
          {/* Welcome message */}
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] rounded-lg bg-orange-900/50 px-3 py-2 text-orange-100">
              <div className="text-sm">
                {isReportReady
                  ? "Hello! I'm your MRI Assistant. Your report is ready - ask me anything about it!"
                  : "Hello! I'm your MRI Assistant. Please click the 'Report' button in the Study Browser to generate a report first."}
              </div>
            </div>
            <span className="mt-1 text-xs text-orange-400/70">Assistant</span>
          </div>

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-900/50 text-orange-100'
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-invert prose-sm max-w-none"
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
              <span
                className={`mt-1 text-xs ${msg.role === 'user' ? 'text-orange-400/70' : 'text-orange-400/70'}`}
              >
                {msg.role === 'user' ? 'You' : 'Assistant'} • {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="flex max-w-[85%] items-center gap-2 rounded-lg bg-orange-900/50 px-3 py-2 text-orange-100">
                <Icons.LoadingSpinner className="h-4 w-4 animate-spin text-orange-400" />
                <div className="text-sm">Thinking...</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReportReady ? 'Ask about the MRI report...' : 'Generate a report first...'}
          disabled={isLoading || !isReportReady}
          className="flex-1 border-orange-500/50 bg-orange-900/20 text-orange-100 placeholder:text-orange-400/50 focus:border-orange-500 focus:ring-orange-500/30"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading || !isReportReady}
          className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-500/50"
        >
          {isLoading ? (
            <Icons.LoadingSpinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default SideChatPanel;
