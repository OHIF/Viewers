import React, { useState } from 'react';

function SideChatPanel({ servicesManager, commandsManager }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { text: inputValue, timestamp: new Date() }]);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary-dark p-4">
      <h2 className="text-white text-lg mb-4">Chat</h2>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-white mb-2">
            <span className="text-xs text-gray-400">
              {msg.timestamp.toLocaleTimeString()}
            </span>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          className="flex-1 px-3 py-2 bg-black text-white rounded"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-primary-light text-white rounded hover:bg-primary-main"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default SideChatPanel;
