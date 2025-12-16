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

const DEFAULT_API_ENDPOINT = 'http://localhost:8000/chat';

function ChatSection({ apiEndpoint = DEFAULT_API_ENDPOINT, disabled = false }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Add user message immediately
    addMessage(message, 'user');
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
      console.error('Chat error:', error);
      addMessage('Sorry, I am having trouble connecting. Please try again.', 'bot');
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

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Messages area */}
      <div className="bg-background max-h-64 min-h-32 overflow-y-auto rounded border p-2">
        <div className="flex flex-col gap-2">
          {/* Initial welcome message */}
          <div className="flex flex-col items-start">
            <div className="bg-muted text-foreground flex max-w-[85%] items-start gap-2 rounded px-2 py-1">
              <Icons.Info className="mt-0.5 h-3 w-3 shrink-0" />
              <div className="text-xs">
                Hello! I'm your MRI Assistant. I'm here to help interpret and explain your MRI
                report. What questions do you have?
              </div>
            </div>
            <span className="text-muted-foreground mt-0.5 text-[10px]">Assistant</span>
          </div>

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded px-2 py-1 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="text-xs">{msg.text}</div>
              </div>
              <span className="text-muted-foreground mt-0.5 text-[10px]">
                {msg.role === 'user' ? 'You' : 'Assistant'} • {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="bg-muted text-foreground flex max-w-[85%] items-center gap-2 rounded px-2 py-1">
                <Icons.LoadingSpinner className="h-3 w-3 animate-spin" />
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
          placeholder="Ask about the MRI report..."
          disabled={isLoading || disabled}
          maxLength={500}
          className="flex-1 text-xs"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading || disabled}
          size="sm"
        >
          {isLoading ? <Icons.LoadingSpinner className="h-4 w-4 animate-spin" /> : 'Send'}
        </Button>
      </div>
    </div>
  );
}

export default ChatSection;
