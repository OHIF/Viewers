import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, ScrollArea } from '@ohif/ui-next';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    // Create bot echo response
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      text: inputValue,
      role: 'bot',
      timestamp: new Date(),
    };

    // Add both messages
    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Messages area */}
      <div className="bg-background max-h-64 min-h-32 overflow-y-auto rounded border p-2">
        <div className="flex flex-col gap-2">
          {messages.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-xs">
              Start a conversation...
            </div>
          ) : (
            messages.map(msg => (
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
                  {msg.role === 'user' ? 'You' : 'Bot'} • {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
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
          placeholder="Type a message..."
          className="flex-1 text-xs"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          size="sm"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export default ChatSection;
