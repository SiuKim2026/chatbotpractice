import React, { useState, useRef, useEffect } from 'react';
import { sendMessageStream } from '../api/chat';
import type { Message } from '../api/chat';
import { Send, User, Bot, Loader2, RefreshCw, ChevronLeft } from 'lucide-react';
import './Chatbot.css';

const TOPICS = ['일상 회화', '비즈니스 영어', '공항/여행 영어', '토익/수능 필수 단어'];
const DIFFICULTIES = ['초급', '중급', '고급'];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendContent = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    let assistantMessageContent = '';

    try {
      let isFirstChunk = true;
      await sendMessageStream(newMessages, (chunk) => {
        if (isFirstChunk) {
          setIsLoading(false);
          isFirstChunk = false;
          assistantMessageContent = chunk;
          setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessageContent }]);
        } else {
          assistantMessageContent += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = { ...updated[lastIndex], content: assistantMessageContent };
            }
            return updated;
          });
        }
      });
    } catch (err: any) {
      setError(`죄송합니다. 메시지를 보내는 중 오류가 발생했습니다. (${err.message || err})`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await sendContent(input);
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleDifficultySelect = async (difficulty: string) => {
    const content = `주제: ${selectedTopic} 난이도: ${difficulty} 위 조건에 맞는 영어 단어 퀴즈를 시작해줘.`;
    setSelectedTopic(null);
    await sendContent(content);
  };

  const resetChat = () => {
    setMessages([]);
    setError(null);
    setSelectedTopic(null);
  };

  const isWelcome = messages.length === 0;

  /* 퀵 선택 패널: 대화 중에도 입력창 위에 표시 */
  const renderQuickPanel = () => {
    if (!selectedTopic) {
      return (
        <div className="quick-panel">
          <p className="quick-panel-title">🎯 주제 선택</p>
          <div className="quick-buttons topic-buttons">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                className="selection-btn quick-btn"
                onClick={() => handleTopicSelect(topic)}
                disabled={isLoading}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="quick-panel">
        <div className="quick-panel-header">
          <button
            className="back-btn"
            onClick={() => setSelectedTopic(null)}
          >
            <ChevronLeft size={14} />
            주제 변경
          </button>
          <div className="selected-topic-badge">
            <span>📌 {selectedTopic}</span>
          </div>
        </div>
        <p className="quick-panel-title">⚡ 난이도 선택</p>
        <div className="quick-buttons difficulty-buttons">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              className={`selection-btn difficulty-btn difficulty-${diff}`}
              onClick={() => handleDifficultySelect(diff)}
              disabled={isLoading}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>
    );
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
        {isWelcome && (
          <div className="welcome-message">
            <Bot size={48} className="welcome-icon" />
            <h2>안녕하세요! 👋</h2>
            <p className="welcome-sub">아래 버튼으로 주제를 선택하거나 직접 입력하세요.</p>
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

      {/* 주제/난이도 단계별 퀵 선택 패널 (항상 표시) */}
      {renderQuickPanel()}

      <form onSubmit={handleSend} className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="또는 직접 입력하세요..."
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
