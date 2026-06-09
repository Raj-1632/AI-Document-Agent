import React, { useState, useEffect } from 'react';
import { Settings, Sparkles, FileText, Upload, HelpCircle, Bot, Globe, Shield } from 'lucide-react';
import UploadZone from './components/UploadZone';
import DocumentSummary from './components/DocumentSummary';
import ChatInterface from './components/ChatInterface';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [activeDoc, setActiveDoc] = useState(null);
  const [docList, setDocList] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(true);
  const [backendStatus, setBackendStatus] = useState('offline');

  // Load configuration from local storage or set default
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('pdf_rag_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing saved config", e);
      }
    }
    return {
      provider: 'gemini',
      apiKey: '',
      modelName: 'gemini-2.5-flash'
    };
  });

  // Save config to local storage
  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('pdf_rag_config', JSON.stringify(newConfig));
  };

  // Fetch document history and check server health on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setBackendStatus('online');
        }

        const res = await fetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          setDocList(data);
          // Set active document as the most recent upload if available
          if (data.length > 0) {
            setActiveDoc(data[data.length - 1]);
            setShowUploader(false);
          }
        }
      } catch (err) {
        console.error("Backend offline or connection failed", err);
        setBackendStatus('offline');
      }
    };

    fetchDocuments();
  }, []);

  const handleUploadSuccess = (newDoc) => {
    setDocList(prev => [...prev.filter(d => d.id !== newDoc.id), newDoc]);
    setActiveDoc(newDoc);
    setShowUploader(false);
  };

  const handleSelectDoc = (doc) => {
    setActiveDoc(doc);
    setShowUploader(false);
  };

  const handleDeleteDoc = async (docId) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedList = docList.filter(d => d.id !== docId);
        setDocList(updatedList);
        
        if (activeDoc?.id === docId) {
          if (updatedList.length > 0) {
            setActiveDoc(updatedList[updatedList.length - 1]);
          } else {
            setActiveDoc(null);
            setShowUploader(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden bg-slate-950">
      {/* Decorative blurred background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="w-full py-4 px-6 md:px-12 border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/10">
              <Bot size={20} />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
                DocIntel <span className="text-[10px] py-0.5 px-1.5 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">RAG</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Document Intelligence System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Server Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/30 border border-slate-800/80 text-[11px] font-semibold text-slate-400">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              Server: {backendStatus === 'online' ? 'Connected' : 'Offline'}
            </div>

            {/* Config Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-800 bg-slate-900/35 hover:bg-slate-900/60 hover:border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all duration-200"
            >
              <Settings size={14} className="text-slate-400" />
              Configure
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Main View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 flex flex-col md:grid md:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Panel: Document Uploader & Details */}
        <section className="col-span-12 md:col-span-5 flex flex-col gap-5 overflow-y-auto pr-0 md:pr-2 max-h-[85vh]">
          {/* Uploader Card */}
          {showUploader ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload Document</h2>
                {activeDoc && (
                  <button 
                    onClick={() => setShowUploader(false)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View active summary
                  </button>
                )}
              </div>
              <UploadZone onUploadSuccess={handleUploadSuccess} config={config} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Details</h2>
                <button
                  onClick={() => setShowUploader(true)}
                  className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-600/10 text-[10px] font-bold text-indigo-400 transition-all"
                >
                  <Upload size={12} />
                  Upload New
                </button>
              </div>
              
              <DocumentSummary
                activeDoc={activeDoc}
                docList={docList}
                onSelectDoc={handleSelectDoc}
                onDeleteDoc={handleDeleteDoc}
              />
            </div>
          )}
        </section>

        {/* Right Panel: Interactive RAG Chat */}
        <section className="col-span-12 md:col-span-7 h-[65vh] md:h-[78vh] flex flex-col">
          <ChatInterface activeDoc={activeDoc} config={config} />
        </section>
      </main>

      {/* Global Configuration settings panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}
