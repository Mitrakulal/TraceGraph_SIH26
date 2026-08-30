import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InvestigatorChatProps {
  contextData: any; // The graph and alert details bundled
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const InvestigatorChat: React.FC<InvestigatorChatProps> = ({ contextData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am your AI Investigator Copilot. I have analyzed the graph topology and the ML Risk Scores for this alert. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/xai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: contextData
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** Failed to communicate with the AI model. (${error.message})` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full card border-purple-100 shadow-sm overflow-hidden bg-white">
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="font-bold text-slate-800 text-sm">AI Investigator Copilot</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-purple-600" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm'
            }`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="prose prose-sm prose-slate max-w-none text-[13px] leading-relaxed prose-p:mb-3 prose-p:mt-0 prose-ul:my-2 prose-li:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-purple-600" />
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce" />
              <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce delay-75" />
              <div className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-100">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this graph..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
