import React, { useState, useEffect } from 'react';

interface GpoInput {
  id: number;
  content: string;
}

interface GpoOneToAllInputFormProps {
  onGenerate: (data: { baseGpo: string; comparisonGpos: string[] }) => void;
  isLoading: boolean;
}

const MAX_SIZE_BYTES = 5_000_000; // 5MB limit

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
    // We allow 0 comparison GPOs if the user just wants to generate the 1-to-All scanning script.
    onGenerate({ baseGpo, comparisonGpos });
  };
  
  const isSizeExceeded = totalSize > MAX_SIZE_BYTES;
  const sizeInMb = (totalSize / (1024 * 1024)).toFixed(2);
  const maxSizeInMb = (MAX_SIZE_BYTES / (1024 * 1024)).toFixed(1);
  
  const hasComparisons = comparisonInputs.some(input => input.content.trim() !== '');

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-cyan-300">1-to-All Analysis & Script Generator</h2>
        <p className="text-gray-400 text-sm">
            Provide a "Base" GPO to generate a <strong>forest-wide scanning script</strong>. 
            Optionally add "Comparison" reports to immediately test analysis logic against the Base GPO.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-4">
        <div className="space-y-6 flex-grow">
          {/* Base GPO Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Base GPO Report <span className="text-cyan-400 text-xs">(Required for Script Generation)</span>
            </label>
            <div className={`relative rounded-md ${baseDragOver ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : ''}`}>
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
                  placeholder={baseDragOver ? "Drop file here!" : "Paste BASE GPO content, or drag & drop a file here..."}
                  className={`w-full p-3 bg-gray-900 border-2 rounded-md text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm font-mono ${
                      baseDragOver ? 'border-cyan-500 bg-gray-800' : 'border-cyan-600/50'
                  }`}
                  rows={8}
                  disabled={isLoading}
                  aria-label="Base GPO Report Content"
                  required
                />
                {baseDragOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cyan-900/20 pointer-events-none rounded-md">
                        <span className="text-cyan-300 font-bold">Drop Base GPO Here</span>
                    </div>
                )}
            </div>
          </div>
          
          <hr className="border-gray-600"/>

          {/* Comparison GPO Inputs */}
          {comparisonInputs.map((input, index) => (
            <div key={input.id} className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Comparison GPO Report #{index + 1} (Optional)</label>
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
                placeholder={`Paste comparison report #${index + 1}, or drag & drop a file...`}
                className={`w-full p-3 bg-gray-900 border rounded-md text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm font-mono ${
                    comparisonDragOverId === input.id ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-gray-600'
                }`}
                rows={6}
                disabled={isLoading}
                aria-label={`Comparison GPO Report Content ${index + 1}`}
              />
              {comparisonInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComparisonInput(input.id)}
                  className="absolute top-0 right-0 mt-1 mr-1 text-gray-500 hover:text-red-400 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label={`Remove comparison report ${index + 1}`}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50"
            >
              + Add Another Comparison Report
            </button>
        </div>
        
        <div className="mt-4 text-center">
            <div className={`text-sm font-mono ${isSizeExceeded ? 'text-red-400' : 'text-gray-400'}`}>
                Total Size: {sizeInMb} MB / {maxSizeInMb} MB
            </div>
            {isSizeExceeded && (
                <p className="text-red-400 text-xs mt-1">
                    Total size of reports exceeds the limit. Please remove or shorten some reports.
                </p>
            )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isSizeExceeded}
          className="mt-2 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Processing...' : hasComparisons ? 'Analyze & Generate Script' : 'Generate Scanning Script Only'}
        </button>
      </form>
    </div>
  );
};