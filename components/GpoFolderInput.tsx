
import React, { useState, useRef } from 'react';

interface GpoFolderInputProps {
  onGenerate: (gpoData: string[]) => void;
  isLoading: boolean;
}

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // Exactly 25MB limit

const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 013.75 3h5.25a2.25 2.25 0 012.25 2.25v2.25m-7.5 0h7.5m-7.5 0a2.25 2.25 0 00-2.25 2.25v7.5A2.25 2.25 0 003.75 21h16.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-16.5" />
    </svg>
);


export const GpoFolderInput: React.FC<GpoFolderInputProps> = ({ onGenerate, isLoading }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFiles([]);
    setTotalSize(0);

    if (event.target.files) {
        const selectedFiles = Array.from(event.target.files);
        const validFiles = selectedFiles.filter((file: File) => file.name.endsWith('.xml') || file.name.endsWith('.html'));
        
        let currentSize = 0;
        for (const file of validFiles) {
            currentSize += (file as File).size;
        }

        if (validFiles.length < 2) {
            setError(`Please select at least two XML or HTML report files. You selected ${validFiles.length} valid file(s).`);
            setFiles([]);
            setTotalSize(0);
        } else if (currentSize > MAX_SIZE_BYTES) {
            setError(`Total file size (${(currentSize / (1024 * 1024)).toFixed(2)} MB) exceeds the 25 MB limit. Please select a smaller set of files.`);
            setFiles([]);
            setTotalSize(0);
        } else {
            if (validFiles.length < selectedFiles.length) {
                 setError('Some selected files were not XML or HTML and have been ignored.');
            }
            setFiles(validFiles);
            setTotalSize(currentSize);
        }
    }
     if(event.target) {
        event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length < 2) {
      alert("Please select at least two GPO reports.");
      return;
    }

    try {
      const fileContentsPromises = files.map(file => file.text());
      const gpoContents = await Promise.all(fileContentsPromises);
      onGenerate(gpoContents);
    } catch(err) {
        setError("Failed to read file contents. Please try selecting the files again.");
        console.error(err);
    }
  };

  const isSizeExceeded = totalSize > MAX_SIZE_BYTES;
  const sizeInMb = (totalSize / (1024 * 1024)).toFixed(2);
  const maxSizeInMb = (MAX_SIZE_BYTES / (1024 * 1024)).toFixed(1);

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6 h-full flex flex-col">
       <div className="mb-4">
            <h2 className="text-xl font-bold text-cyan-300">Select GPO Export Files</h2>
            <p className="text-gray-400 text-sm">
                Select multiple exported GPO reports (.xml or .html). The tool will scan and analyze all valid reports you choose.
            </p>
      </div>
      
      <div className="flex-grow flex flex-col space-y-4">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".xml,.html"
            className="hidden"
            aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleSelectFilesClick}
          disabled={isLoading}
          className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
        >
          <FolderIcon className="w-5 h-5 mr-2" />
          Select GPO Report Files
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="bg-gray-900/50 p-3 rounded-md border border-gray-600 flex-grow min-h-[150px] flex flex-col">
            {files.length > 0 ? (
                <>
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-gray-300 font-medium mb-2">Selected {files.length} reports:</h3>
                         <div className={`text-xs font-mono ${isSizeExceeded ? 'text-red-400' : 'text-gray-400'}`}>
                            {sizeInMb} MB / {maxSizeInMb} MB
                        </div>
                    </div>
                    <ul className="text-sm text-gray-400 space-y-1 pr-2 overflow-y-auto">
                    {files.map(file => (
                        <li key={file.name} className="truncate font-mono">{file.name}</li>
                    ))}
                    </ul>
                </>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                    <p>Awaiting file selection...</p>
                </div>
            )}
        </div>
        
        <form onSubmit={handleSubmit} className="mt-auto">
            <button
              type="submit"
              disabled={isLoading || files.length < 2 || isSizeExceeded}
              className="mt-4 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Analyzing...' : 'Generate Analysis & Script'}
            </button>
        </form>
      </div>
    </div>
  );
};
