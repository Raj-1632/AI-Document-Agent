import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CornerDownLeft, Sparkles, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function ChatInterface({ activeDoc, config }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "What are the main findings or arguments in this document?",
    "Summarize the key methodologies or data presented.",
    "Are there any limitations or future research discussed?",
    "List the major conclusions of this study/document."
  ];

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Reset chat when active document changes
  useEffect(() => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
  }, [activeDoc?.id]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    if (!textToSend) {
      setInput('');
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_id: activeDoc.id,
          question: text,
          provider: config.provider,
          api_key: config.apiKey || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get answer');
      }

      const result = await response.json();
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.answer,
        citations: result.citations || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error: ${err.message || 'Something went wrong while retrieving the answer. Please check your API configuration.'}`,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
      
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/25 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">AI Document Assistant</h3>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeDoc ? `Chatting with: ${activeDoc.file_name}` : 'Awaiting Document'}
            </p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {!activeDoc ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-80">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500">
              <Bot size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-300">Chat Interface Locked</h4>
              <p className="text-xs text-slate-500 max-w-xs">Upload a PDF document to unlock RAG chatting capabilities.</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="space-y-6 my-auto pt-4 max-w-md mx-auto">
            {/* Greeting */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 mb-2">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <h4 className="text-base font-extrabold text-slate-200 tracking-tight">
                Ask anything about the document
              </h4>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                The assistant extracts text and searches the vector store to provide grounded, source-cited answers.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center">
                Suggested Prompts
              </p>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="p-3 text-left rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300 hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-950/10 active:scale-[0.99] transition-all duration-200 leading-normal font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start items-start gap-3.5 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot size={16} />
                </div>
                <div className="glass-panel p-4 rounded-2xl rounded-tl-none border border-slate-800 max-w-[85%] flex items-center h-9 justify-center min-w-[60px]">
                  <div className="dot-flashing"></div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/10">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!activeDoc || isLoading}
            placeholder={activeDoc ? "Ask a question about the document..." : "Upload a PDF file to begin..."}
            rows={1}
            className="w-full pl-4 pr-12 py-3 rounded-2xl text-sm font-medium glass-input resize-none h-[46px] flex items-center leading-normal"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!activeDoc || !input.trim() || isLoading}
            className={`absolute right-2.5 p-2 rounded-xl transition-all ${
              input.trim() && activeDoc && !isLoading
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/10 active:scale-95'
                : 'text-slate-600 bg-transparent'
            }`}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Inner Chat Message component to encapsulate citation logic
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const hasCitations = message.citations && message.citations.length > 0;

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
          <Bot size={16} />
        </div>
      )}

      {/* Message Bubble */}
      <div className="max-w-[85%] space-y-2">
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed font-normal ${
            isUser
              ? 'bg-slate-900/60 border border-indigo-500/15 text-indigo-100 rounded-tr-none ml-auto'
              : message.isError
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-none'
              : 'glass-panel text-slate-200 rounded-tl-none'
          }`}
        >
          {message.text}
          
          {/* Render citations inline if they are listed as cards below */}
          {!isUser && hasCitations && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={11} />
                Sources Citations ({message.citations.length})
              </p>
              <div className="grid grid-cols-1 gap-2">
                {message.citations.map((cit, idx) => (
                  <CitationCard key={idx} citation={cit} index={idx + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/15 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
          <User size={16} />
        </div>
      )}
    </div>
  );
}

// Collapsible Citation Card Component
function CitationCard({ citation, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 transition-all duration-150"
      >
        <span className="flex items-center gap-1.5">
          <span className="inline-flex w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold items-center justify-center shrink-0">
            {index}
          </span>
          Page {citation.page_number}
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isOpen && (
        <div className="px-3 py-2.5 border-t border-slate-800/80 bg-slate-950/20">
          <p className="text-[11px] text-slate-400 leading-normal italic font-medium">
            "...{citation.text}..."
          </p>
        </div>
      )}
    </div>
  );
}
