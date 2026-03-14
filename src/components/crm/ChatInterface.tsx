import React, { useState, useEffect } from 'react';
import { chatService } from '../../services/chatService';
import { aiAgentService } from '../../services/aiAgentService';

export const ChatInterface = ({ conversationId, role }: { conversationId: string, role: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async (isAutomated = false) => {
    await chatService.sendMessage(conversationId, input, isAutomated);
    if (!isAutomated) {
      await aiAgentService.processMessage(conversationId, input, role);
    }
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(m => <div key={m.id}>{m.content}</div>)}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={() => sendMessage()}>Enviar</button>
      <button onClick={() => aiAgentService.autoInteractClient(conversationId, 50000)}>Proposta Automática</button>
    </div>
  );
};
