
import React, { useState, useEffect } from 'react';

interface GpoInput {
  id: number;
  content: string;
}

interface GpoOneToAllInputFormProps {
  onGenerate: (data: { baseGpo: string; comparisonGpos: string[] }) => void;
  isLoading: boolean;
}

const MAX_SIZE_BYTES = 50_000_000; // 50MB limit

export const GpoOneToAllInputForm: React.FC<GpoOneToAllInputFormProps> = ({ onGenerate, isLoading }) => {
  const [baseGpo, setBaseGpo] = useState('');
  const [comparisonInputs, setComparisonInputs] = useState<GpoInput[]>([
    { id: Date.now(), content: '' },
  ]);
  const [baseDragOver, setBaseDragOver] = useState(false);
  const [comparisonDragOverId, setComparisonDragOverId] = useState<number | null>(null);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    const comparisonSize = comparisonInputs.reduce((acc, input) => acc + new Blob([input.content]).size, 0);
    const size = new Blob([baseGpo]).size + comparisonSize;
    setTotalSize(size);
  }, [baseGpo, comparisonInputs]);

  const handleComparisonInputChange = (id: number, value: string) => {
    setComparisonInputs(comparisonInputs.map(input => input.id === id ? { ...input, content: value } : input));
  };

  const addComparisonInput = () => {
    setComparisonInputs([...comparisonInputs, { id: Date.now(), content: '' }]);
  };

  const removeComparisonInput = (id: number) => {
    if (comparisonInputs.length > 1) {
      setComparisonInputs(comparisonInputs.filter(input => input.id !== id));
    }
  };
  
  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>, callback: (content: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
       if (file.name.endsWith('.xml') || file.name.endsWith('.html')) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const content = readerEvent.target?.result as string;
          callback(content);
        };
        reader.readAsText(file);
      } else {
        alert('Please drop a valid .xml or .html file.');
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const comparisonGpos = comparisonInputs.map(input => input.content).filter(content => content.trim() !== '');
    if (!baseGpo.trim()) {
        alert("Please provide the Base GPO report.");
        return;
    }
    onGenerate({ baseGpo, comparisonGpos });
  };
  
  const isSizeExceeded = totalSize > MAX_SIZE_BYTES;
  const sizeInMb = (totalSize / (1024 * 1024)).toFixed(2);
  const maxSizeInMb = (MAX_SIZE_BYTES / (1024 * 1024)).toFixed(1);
  
  const hasComparisons = comparisonInputs.some(input => input.content.trim() !== '');

  return (
    <div className="hologram-card rounded-2xl p-8 h-full flex flex-col border border-cyan-500/20">
      <div className="mb-6">
        <h2 className="nexus-text text-xl font-bold">Forest-Wide Baseline Sync</h2>
        <p className="text-gray-400 text-sm mt-2">
            Upload a <strong className="text-cyan-400">Master Baseline</strong> to generate a multi-domain scanning script. 
            The script will audit <strong className="text-white">every domain in the forest</strong> for deviations against this GPO.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-6">
        <div className="space-y-6 flex-grow">
          {/* Base GPO Input */}
          <div>
            <label className="block text-xs font-bold text-cyan-500/80 uppercase tracking-widest mb-3">
                Master Baseline GPO <span className="text-gray-500 ml-2">(Required for Forest-Wide Script)</span>
            </label>
            <div className={`relative rounded-xl overflow-hidden ${baseDragOver ? 'ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : ''}`}>
                <textarea
                  value={baseGpo}
                  onChange={(e) => setBaseGpo(e.target.value)}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setBaseDragOver(true)}
                  onDragLeave={() => setBaseDragOver(false)}
                  onDrop={(e) => {
                      handleDrop(e, setBaseGpo);
                      setBaseDragOver(false);
                  }}
                  placeholder={baseDragOver ? "Drop Master GPO now..." : "Paste Master GPO XML/HTML or drag file here..."}
                  className={`w-full p-4 bg-slate-950/80 border-2 rounded-xl text-gray-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-300 text-sm font-mono placeholder:text-gray-600 ${
                      baseDragOver ? 'border-cyan-500 bg-slate-900' : 'border-cyan-900/40'
                  }`}
                  rows={8}
                  disabled={isLoading}
                  required
                />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent flex-grow"></div>
             <span className="text-[10px] font-mono text-cyan-500/40 uppercase tracking-widest">Optional Live Test Samples</span>
             <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent flex-grow"></div>
          </div>

          {/* Comparison GPO Inputs */}
          {comparisonInputs.map((input, index) => (
            <div key={input.id} className="relative group">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Comparison Sample #{index + 1}</label>
              <textarea
                value={input.content}
                onChange={(e) => handleComparisonInputChange(input.id, e.target.value)}
                onDragOver={handleDragOver}
                onDragEnter={() => setComparisonDragOverId(input.id)}
                onDragLeave={() => setComparisonDragOverId(null)}
                onDrop={(e) => {
                    handleDrop(e, (content) => handleComparisonInputChange(input.id, content));
                    setComparisonDragOverId(null);
                }}
                placeholder={`Drop a GPO from a specific domain here to test analysis...`}
                className={`w-full p-4 bg-slate-950/50 border rounded-xl text-gray-300 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 text-xs font-mono placeholder:text-gray-700 ${
                    comparisonDragOverId === input.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/5'
                }`}
                rows={4}
                disabled={isLoading}
              />
              {comparisonInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComparisonInput(input.id)}
                  className="absolute top-8 right-2 text-gray-600 hover:text-red-400 p-1 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-4 pt-2">
            <button
              type="button"
              onClick={addComparisonInput}
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-white/5 text-xs font-medium rounded-lg text-gray-400 bg-slate-900/50 hover:bg-slate-800 transition-all"
            >
              + Add Comparison Sample
            </button>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-4">
            <span className={isSizeExceeded ? 'text-red-400' : 'text-cyan-500/40'}>
                Payload: {sizeInMb} MB / {maxSizeInMb} MB
            </span>
            <span className="text-gray-600 uppercase tracking-tighter">SECURED ENCRYPTED CHANNEL</span>
        </div>

        <button
          type="submit"
          disabled={isLoading || isSizeExceeded}
          className="relative mt-2 w-full overflow-hidden group inline-flex justify-center items-center px-6 py-4 border border-cyan-500/50 text-sm font-bold rounded-xl text-white bg-cyan-600/20 hover:bg-cyan-600/40 transition-all duration-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          {isLoading ? (
            <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                CALCULATING FOREST VECTORS...
            </span>
          ) : hasComparisons ? 'EXECUTE MULTI-DOMAIN ANALYSIS' : 'GENERATE FOREST SCAN SCRIPT'}
        </button>
      </form>
    </div>
  );
};
