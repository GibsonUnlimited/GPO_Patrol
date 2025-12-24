
import React, { useState, useRef } from 'react';

interface GpoFolderInputProps {
  onGenerate: (gpoData: string[]) => void;
  isLoading: boolean;
}

const MAX_SIZE_BYTES = 100_000_000; // Increased to 100MB for bulk

const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 013.75 3h5.25a2.25 2.25 0 012.25 2.25v2.25m-7.5 0h7.5m-7.5 0a2.25 2.25 0 00-2.25 2.25v7.5A2.25 2.25 0 003.75 21h16.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-16.5" />
    </svg>
);

const BulkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h.01m0 0H3m.01 0h.01m0 0H3m.01 0h.01M3 21h.01m0 0H3m.01 0h.01m0 0H3m.01 0h.01M3 6h.01m0 0H3m.01 0h.01m0 0H3m.01 0h.01M11 13.5h.01m0 0H11m.01 0h.01m0 0H11m.01 0h.01M11 21h.01m0 0H11m.01 0h.01m0 0H11m.01 0h.01M11 6h.01m0 0H11m.01 0h.01m0 0H11m.01 0h.01M19 13.5h.01m0 0H19m.01 0h.01m0 0H19m.01 0h.01M19 21h.01m0 0H19m.01 0h.01m0 0H19m.01 0h.01M19 6h.01m0 0H19m.01 0h.01m0 0H19m.01 0h.01" />
  </svg>
);

export const GpoFolderInput: React.FC<GpoFolderInputProps> = ({ onGenerate, isLoading }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [isFolderMode, setIsFolderMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFilesClick = () => {
    if (isFolderMode) {
      folderInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (event.target.files) {
        const selectedFiles = Array.from(event.target.files);
        const validFiles = selectedFiles.filter((file: File) => 
          file.name.toLowerCase().endsWith('.xml') || 
          file.name.toLowerCase().endsWith('.html')
        );
        
        let currentSize = 0;
        for (const file of validFiles) {
            currentSize += (file as File).size;
        }

        if (validFiles.length < 1) {
            setError(`No valid XML/HTML GPO reports found in your selection.`);
            setFiles([]);
            setTotalSize(0);
        } else if (currentSize > MAX_SIZE_BYTES) {
            setError(`Total volume exceeds ${(MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB. Reduce the number of GPOs.`);
            setFiles([]);
            setTotalSize(0);
        } else {
            if (validFiles.length < selectedFiles.length) {
                 console.warn(`${selectedFiles.length - validFiles.length} non-GPO files ignored.`);
            }
            setFiles(validFiles);
            setTotalSize(currentSize);
        }
    }
     if(event.target) event.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    try {
      const fileContentsPromises = files.map(file => file.text());
      const gpoContents = await Promise.all(fileContentsPromises);
      onGenerate(gpoContents);
    } catch(err) {
        setError("Nexus Link: Failed to read local filesystem stream.");
    }
  };

  const isSizeExceeded = totalSize > MAX_SIZE_BYTES;
  const sizeInMb = (totalSize / (1024 * 1024)).toFixed(2);
  const maxSizeInMb = (MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0);

  return (
    <div className="hologram-card rounded-2xl p-8 h-full flex flex-col border border-cyan-500/20">
       <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="nexus-text text-xl font-bold">Logical Policy Optimizer</h2>
                <p className="text-gray-400 text-sm mt-1">
                    Group policies by settings and enforce User/Computer separation for better login efficiency.
                </p>
              </div>
              <div className="flex bg-slate-950/60 p-1 rounded-lg border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setIsFolderMode(false)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${!isFolderMode ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Files
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsFolderMode(true)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${isFolderMode ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Folder
                  </button>
              </div>
            </div>
      </div>
      
      <div className="flex-grow flex flex-col space-y-4">
        {/* Hidden File Inputs */}
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".xml,.html"
            className="hidden"
        />
        <input
            type="file"
            ref={folderInputRef}
            onChange={handleFileChange}
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
        />

        <button
          type="button"
          onClick={handleSelectFilesClick}
          disabled={isLoading}
          className="w-full py-12 border-2 border-dashed border-cyan-500/20 rounded-2xl bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all flex flex-col items-center justify-center group"
        >
          {isFolderMode ? (
            <FolderIcon className="w-12 h-12 text-cyan-500/60 mb-4 group-hover:scale-110 transition-transform" />
          ) : (
            <BulkIcon className="w-12 h-12 text-cyan-500/60 mb-4 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-cyan-300 font-bold tracking-widest uppercase text-sm">
            {isFolderMode ? 'Optimizer Folder Select' : 'Optimizer File Select'}
          </span>
          <span className="text-gray-500 text-xs mt-2">
            {isFolderMode ? 'Select GPO directory for logical grouping' : 'Select multiple GPOs to optimize'}
          </span>
        </button>

        {error && (
          <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-lg flex items-center text-red-300 text-xs">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {files.length > 0 && (
          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex-grow max-h-60 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Optimization Queue: <span className="text-cyan-400">{files.length} GPOs</span>
                  </h3>
                   <div className={`text-[10px] font-mono ${isSizeExceeded ? 'text-red-400' : 'text-gray-500'}`}>
                      {sizeInMb} MB / {maxSizeInMb} MB
                  </div>
              </div>
              <ul className="text-xs text-gray-400 space-y-1.5 pr-2 overflow-y-auto custom-scrollbar font-mono">
              {files.map((file, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-cyan-500/40 mr-2">├</span>
                    <span className="truncate">{file.name}</span>
                  </li>
              ))}
              </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="pt-4">
            <button
              type="submit"
              disabled={isLoading || files.length === 0 || isSizeExceeded}
              className="w-full relative overflow-hidden group inline-flex justify-center items-center px-6 py-4 border border-cyan-500/50 text-sm font-bold rounded-xl text-white bg-cyan-600/20 hover:bg-cyan-600/40 transition-all duration-500 shadow-[0_0_20px_rgba(6,182,212,0.1)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {isLoading ? (
                <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    INITIALIZING LOGICAL ANALYSIS...
                </span>
              ) : `INITIATE LOGICAL OPTIMIZATION (${files.length} GPOs)`}
            </button>
        </form>
      </div>
    </div>
  );
};
