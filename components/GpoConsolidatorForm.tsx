
import React, { useState, useEffect } from 'react';

interface GpoInput {
  id: number;
  content: string;
}

interface GpoConsolidatorFormProps {
  onGenerate: (gpoData: string[], newGpoName: string) => void;
  isLoading: boolean;
}

const MAX_SIZE_BYTES = 50_000_000; // 50MB limit

export const GpoConsolidatorForm: React.FC<GpoConsolidatorFormProps> = ({ onGenerate, isLoading }) => {
  const [inputs, setInputs] = useState<GpoInput[]>([
    { id: Date.now(), content: '' },
    { id: Date.now() + 1, content: '' },
  ]);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [newGpoName, setNewGpoName] = useState('Consolidated GPO Policy');

  useEffect(() => {
    const size = inputs.reduce((acc, input) => acc + new Blob([input.content]).size, 0);
    setTotalSize(size);
  }, [inputs]);

  const handleInputChange = (id: number, value: string) => {
    setInputs(inputs.map(input => input.id === id ? { ...input, content: value } : input));
  };

  const addInput = () => {
    setInputs([...inputs, { id: Date.now(), content: '' }]);
  };

  const removeInput = (id: number) => {
    if (inputs.length > 2) {
      setInputs(inputs.filter(input => input.id !== id));
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTextAreaElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(id);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xml') || file.name.endsWith('.html')) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const content = readerEvent.target?.result as string;
          handleInputChange(id, content);
        };
        reader.readAsText(file);
      } else {
        alert('Please drop a valid .xml or .html file.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gpoContents = inputs.map(input => input.content).filter(content => content.trim() !== '');
    if (gpoContents.length < 2) {
        alert("Please provide at least two GPO reports to consolidate.");
        return;
    }
    if (!newGpoName.trim()) {
        alert("Please provide a name for the new consolidated GPO.");
        return;
    }
    onGenerate(gpoContents, newGpoName);
  };

  const isSizeExceeded = totalSize > MAX_SIZE_BYTES;
  const sizeInMb = (totalSize / (1024 * 1024)).toFixed(2);
  const maxSizeInMb = (MAX_SIZE_BYTES / (1024 * 1024)).toFixed(1);

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-cyan-300">GPO Consolidation Builder</h2>
        <p className="text-gray-400 text-sm">
          Provide two or more GPO reports below. The tool will merge them into a single new GPO, with settings from later reports overwriting earlier ones.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col space-y-4">
        <div className="space-y-6 flex-grow">
          {inputs.map((input, index) => (
            <div key={input.id} className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">GPO Report #{index + 1} (Order matters)</label>
              <textarea
                value={input.content}
                onChange={(e) => handleInputChange(input.id, e.target.value)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, input.id)}
                // Fix: Pass both the event and the input ID to the handler to satisfy the (e, id) signature
                onDragLeave={(e) => handleDragLeave(e, input.id)}
                onDrop={(e) => handleDrop(e, input.id)}
                placeholder={`Paste GPO report #${index + 1} content here, or drag & drop a file...`}
                className={`w-full p-3 bg-gray-900 border rounded-md text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm font-mono ${
                    dragOverId === input.id ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-gray-600'
                }`}
                rows={8}
                disabled={isLoading}
                aria-label={`GPO Report Content ${index + 1}`}
              />
              {inputs.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeInput(input.id)}
                  className="absolute top-0 right-0 mt-1 mr-1 text-gray-500 hover:text-red-400 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label={`Remove report ${index + 1}`}
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
              onClick={addInput}
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
            >
              + Add Another GPO Report
            </button>
        </div>
        
        <div className="mt-6">
            <label htmlFor="gpoName" className="block text-sm font-medium text-gray-300 mb-2">New Consolidated GPO Name</label>
            <input
                type="text"
                id="gpoName"
                value={newGpoName}
                onChange={(e) => setNewGpoName(e.target.value)}
                className="w-full p-3 bg-gray-900 border rounded-md text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                disabled={isLoading}
                required
            />
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
          {isLoading ? 'Consolidating...' : 'Generate Consolidated GPO & Script'}
        </button>
      </form>
    </div>
  );
};
