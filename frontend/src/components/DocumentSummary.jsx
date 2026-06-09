import React from 'react';
import { FileText, Trash2, Calendar, FileDown, Layers, Hash } from 'lucide-react';

export default function DocumentSummary({ activeDoc, docList, onSelectDoc, onDeleteDoc }) {
  if (!activeDoc) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center py-12">
        <FileText size={40} className="mx-auto text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Document Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Upload a PDF or select a previously processed document from the history below to get started.
        </p>
      </div>
    );
  }

  const { id, file_name, page_count, file_size_kb, summary, keywords } = activeDoc;

  return (
    <div className="space-y-5">
      {/* Active Document Details Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10">
              <FileText size={20} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-200 truncate max-w-[180px] md:max-w-[240px]" title={file_name}>
                {file_name}
              </h3>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  {page_count} {page_count === 1 ? 'page' : 'pages'}
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span>{file_size_kb} KB</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onDeleteDoc(id)}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all active:scale-95"
            title="Delete document index"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileDown size={14} className="text-indigo-400" />
          Document Summary
        </h4>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
          {summary}
        </p>
      </div>

      {/* Key Topics / Keywords */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Hash size={14} className="text-indigo-400" />
          Key Terminology & Topics
        </h4>
        <div className="flex flex-wrap gap-2">
          {keywords && keywords.length > 0 ? (
            keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-950/20 transition-all duration-200"
              >
                {kw}
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No topics extracted.</p>
          )}
        </div>
      </div>

      {/* Document History list (Previously uploaded) */}
      {docList.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Processed Documents ({docList.length})
          </h4>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {docList.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                  doc.id === id
                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-medium'
                    : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
                }`}
              >
                <span className="truncate max-w-[85%]">{doc.file_name}</span>
                <span className="text-[10px] text-slate-500">{doc.page_count}p</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
