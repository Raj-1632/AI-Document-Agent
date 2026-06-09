import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadZone({ onUploadSuccess, config }) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const FILE_SIZE_LIMIT_MB = 15;
  const FILE_SIZE_LIMIT_BYTES = FILE_SIZE_LIMIT_MB * 1024 * 1024;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    setError(null);

    // 1. Validation: Only PDFs
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("Unsupported format. Please upload a PDF document.");
      return;
    }

    // 2. Validation: File size limit
    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      setError(`File size exceeds the limit of ${FILE_SIZE_LIMIT_MB}MB.`);
      return;
    }

    setIsUploading(true);
    setProgressText('Uploading document to server...');
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', config.provider);
    if (config.apiKey) {
      formData.append('api_key', config.apiKey);
    }

    try {
      // Simulate progress stages
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          if (prev === 40) {
            setProgressText('Parsing PDF content...');
          } else if (prev === 70) {
            setProgressText('Extracting keywords and generating summary...');
          }
          return prev + 10;
        });
      }, 800);

      // Perform upload API call
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process document');
      }

      setUploadProgress(100);
      setProgressText('Document processed successfully!');
      
      const result = await response.json();
      
      // Delay slightly to show 100% completion
      setTimeout(() => {
        onUploadSuccess(result);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred during processing.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed glass-panel text-center transition-all duration-300 ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01] shadow-lg shadow-indigo-500/5' 
            : 'border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/10'
        } ${isUploading ? 'pointer-events-none' : 'hover:cursor-pointer'}`}
        onClick={!isUploading ? onButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="py-6 flex flex-col items-center space-y-4 w-full max-w-xs">
            <Loader2 className="animate-spin text-indigo-400" size={40} />
            <div className="space-y-2 w-full">
              <p className="text-sm font-semibold text-slate-200">{progressText}</p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/55">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">{uploadProgress}% Complete</p>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 text-slate-400 border border-slate-800 group-hover:text-indigo-400 transition-colors">
              <UploadCloud size={28} className="text-indigo-400 animate-pulse-slow" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop your PDF here, or <span className="text-indigo-400 hover:text-indigo-300">browse</span>
              </p>
              <p className="text-xs text-slate-500">Supports PDF files up to {FILE_SIZE_LIMIT_MB}MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3.5 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
