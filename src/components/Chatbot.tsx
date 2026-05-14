import React, { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api/chat';
import type { Message } from '../api/chat';
import { Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import './Chatbot.css';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const assistantMessage = await sendMessage(newMessages);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError('죄송합니다. 메시지를 보내는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <div className="header-info">
          <Bot className="header-icon" size={24} />
          <div>
            <h1>영단어 퀴즈 봇</h1>
            <p>English Vocab Quiz Bot</p>
          </div>
        </div>
        <button onClick={resetChat} className="reset-button" title="대화 초기화">
          <RefreshCw size={18} />
        </button>
      </header>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <Bot size={48} className="welcome-icon" />
            <h2>안녕하세요! 👋</h2>
            <p>원하는 <strong>주제</strong>(예: 여행, 비즈니스)나 <br /><strong>난이도</strong>(예: 초급, 고급)를 말씀해 주세요!</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role}`}>
            <div className="message-icon">
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-bubble">
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message-icon">
              <Bot size={20} />
            </div>
            <div className="message-bubble loading">
              <Loader2 className="spinner" size={18} />
              <span>생각 중...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading} className="send-button">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
