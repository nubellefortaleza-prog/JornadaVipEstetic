
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  onClose: () => void;
}

const GeminiChat: React.FC<Props> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Sou seu assistente VIP. Como posso ajudar com seus cuidados hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const history = messages.map(m => ({ 
      role: m.role === 'user' ? 'user' : 'model', 
      parts: m.text 
    }));

    const response = await chatWithGemini(userMsg, [] as any);
    setMessages(prev => [...prev, { role: 'assistant', text: response || "Desculpe, tive um problema." }]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1A1A1B]">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#1A1A1B]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sage rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1A1A1B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Gemini Assistant</h2>
            <p className="text-[10px] text-sage animate-pulse">Online para você</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-sage text-[#1A1A1B] font-medium' 
                : 'bg-white/5 border border-white/10 text-white/80'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-white/40 text-xs flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Pensando...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/10 bg-[#1A1A1B]">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 px-4 focus-within:border-sage transition-colors">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tire sua dúvida estática..."
            className="flex-1 bg-transparent py-3 outline-none text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="p-2 text-sage disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiChat;
