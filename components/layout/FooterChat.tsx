import React, { useState } from 'react';
import { Send, Sparkles, Mic } from 'lucide-react';

const FooterChat: React.FC = () => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    // Implementation for sending to AI would go here
    console.log("Sending to Smart Chat:", input);
    setInput('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 ml-0 lg:ml-24 bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
           <Sparkles size={16} />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Here is your Smart Chat (Ctrl+Space)"
            className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
             <Mic size={18} />
          </button>
        </div>
        <div className="flex gap-2 text-gray-400">
            <button 
              onClick={handleSend}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
            >
              <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default FooterChat;