import React, { useState, useEffect } from 'react';
import { Settings, X, Key, ShieldCheck, Cpu, Sliders } from 'lucide-react';

export default function SettingsPanel({ isOpen, onClose, config, onConfigChange }) {
  const [provider, setProvider] = useState(config.provider || 'gemini');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [modelName, setModelName] = useState(config.modelName || '');

  // Default models based on provider
  const geminiModels = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast, Recommended)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep reasoning)' }
  ];

  const openaiModels = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Lightweight)' },
    { value: 'gpt-4o', label: 'GPT-4o (Powerful)' }
  ];

  useEffect(() => {
    // If provider changes and model name is not compatible, set to default
    if (provider === 'gemini') {
      const isGeminiModel = geminiModels.some(m => m.value === modelName);
      if (!isGeminiModel) setModelName('gemini-1.5-flash');
    } else {
      const isOpenAIModel = openaiModels.some(m => m.value === modelName);
      if (!isOpenAIModel) setModelName('gpt-4o-mini');
    }
  }, [provider]);

  const handleSave = () => {
    onConfigChange({
      provider,
      apiKey: apiKey.trim(),
      modelName
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Settings size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">AI Model Configuration</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={13} className="text-indigo-400" />
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`py-2.5 px-4 rounded-xl font-medium border text-sm transition-all duration-200 ${
                  provider === 'gemini'
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-900/35 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
                }`}
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`py-2.5 px-4 rounded-xl font-medium border text-sm transition-all duration-200 ${
                  provider === 'openai'
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/5'
                    : 'bg-slate-900/35 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
                }`}
              >
                OpenAI GPT
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={13} className="text-indigo-400" />
              Model Name
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-slate-200 text-sm font-medium glass-input focus:ring-1 focus:ring-indigo-500"
            >
              {provider === 'gemini' 
                ? geminiModels.map(m => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)
                : openaiModels.map(m => <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>)
              }
            </select>
          </div>

          {/* Custom API Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key size={13} className="text-indigo-400" />
              API Key (Optional)
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder={provider === 'gemini' ? "Override Gemini API Key..." : "Enter OpenAI API Key..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium glass-input"
              />
              {provider === 'gemini' && !apiKey && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 hover:cursor-pointer flex items-center gap-1" title="Server key is configured.">
                  <ShieldCheck size={16} />
                </div>
              )}
            </div>
            
            <p className="text-[11px] text-slate-500 leading-normal">
              {provider === 'gemini' 
                ? "The system automatically uses the Gemini API key configured on the server. Enter a key here to override it."
                : "You must provide an OpenAI API key to use OpenAI GPT models."
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-900/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] shadow-md shadow-indigo-600/10 transition-all duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
