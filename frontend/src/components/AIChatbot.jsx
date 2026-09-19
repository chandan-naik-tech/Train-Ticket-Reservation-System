import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageSquare } from 'lucide-react';
import api from '../utils/api';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaste! Welcome to RailVerse AI. How can I assist you with your train travels today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chatbot', { query: userMsg });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply, options: res.data.options }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Apologies, I encountered an issue processing your query. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOption = async (option) => {
    setMessages(prev => [...prev, { sender: 'user', text: option }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chatbot', { query: option });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply, options: res.data.options }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'I am unable to answer this question right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-gradient-to-tr from-railway-accent to-railway-gold text-railway-dark p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center glow-glow"
        >
          <Bot size={28} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-gray-900 animate-ping"></span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] h-[480px] bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-railway-blue to-railway-navy p-4 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center space-x-2.5">
              <Bot className="text-railway-gold" size={24} />
              <div>
                <h3 className="font-semibold text-white text-sm">RailVerse AI Co-Pilot</h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 inline-block animate-pulse"></span>
                  Active Assistant
                </span>
              </div>
            </div>
            <button onClick={toggleChat} className="text-gray-400 hover:text-white p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-railway-accent text-white rounded-br-none'
                      : 'bg-railway-navy/40 border border-gray-800 text-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                
                {/* Options / Suggestion Chips */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleQuickOption(opt)}
                        className="text-[11px] bg-slate-900 border border-gray-800 hover:border-railway-accent text-gray-300 hover:text-white rounded-full px-2.5 py-1 transition-all"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Bot size={14} className="animate-spin" />
                <span>Assistant is drafting a response...</span>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-850 bg-slate-900/60 flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about PNR, Tatkal, travel..."
              className="flex-1 glass-input py-2 px-3.5 rounded-xl text-xs"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-railway-accent rounded-xl text-white hover:opacity-90 active:scale-95 transition-all"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
