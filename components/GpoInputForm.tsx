
import React, { useState, useEffect } from 'react';

interface GpoInput {
  id: number;
  content: string;
}

interface GpoInputFormProps {
  onGenerate: (gpoData: string[]) => void;
  isLoading: boolean;
}

const MAX_SIZE_BYTES = 50_000_000;

export const GpoInputForm: React.FC<GpoInputFormProps> = ({ onGenerate, isLoading }) => {
  const [inputs, setInputs] = useState<GpoInput[]>([{ id: Date.now(), content: '' }, { id: Date.now() + 1, content: '' }]);
  const [totalSize, setTotalSize] = useState(0);
  const [hasMatch, setHasMatch] = useState(false);

  useEffect(() => {
    const size = inputs.reduce((acc, input) => acc + new Blob([input.content]).size, 0);
    setTotalSize(size);

    // Live match check for "Easy Peasy" feature
    const checkHistory = async () => {
      const contents = inputs.map(i => i.content.trim()).filter(c => !!c);
      if (contents.length < 2) return;
      const combined = contents.join('|||');
      const hash = Math.abs(combined.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(16);
      const history = localStorage.getItem('gpoAnalyzerHistory') || localStorage.getItem('gpoOrganizationHistory');
      if (history) {
          setHasMatch(history.includes(hash));
      }
    };
    checkHistory();
  }, [inputs]);

  const handleInputChange = (id: number, value: string) => {
    setInputs(inputs.map(input => input.id === id ? { ...input, content: value } : input));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gpoContents = inputs.map(input => input.content).filter(content => content.trim() !== '');
    if (gpoContents.length < 2) return alert("Provide at least two reports.");
    onGenerate(gpoContents);
  };

  return (
    <div className="bg-black/20 backdrop-filter backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-6 flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-cyan-300">Audit & Analysis Hub</h2>
        <p className="text-gray-400 text-sm">Paste content or drag & drop files for comparison.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {inputs.map((input, index) => (
          <textarea
            key={input.id}
            value={input.content}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
            placeholder={`GPO Report #${index + 1}...`}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-gray-200 text-sm font-mono"
            rows={6}
          />
        ))}
        <button type="button" onClick={() => setInputs([...inputs, { id: Date.now(), content: '' }])} className="w-full py-2 bg-gray-800 rounded">+ Add Report</button>
        <button
          type="submit"
          disabled={isLoading || totalSize > MAX_SIZE_BYTES}
          className={`w-full py-4 rounded-md text-lg font-bold transition-all ${
            hasMatch ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-cyan-600 hover:bg-cyan-500'
          }`}
        >
          {isLoading ? 'Processing...' : hasMatch ? '✨ Easy Peasy: Instant Load Match' : 'Run Audit Sequence'}
        </button>
      </form>
    </div>
  );
};
