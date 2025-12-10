import React, { useState } from 'react';
import { Search, Bell, Settings, Plus, Menu, X } from 'lucide-react';
import { User } from '../../shared/types';

interface TopbarProps {
  user: User;
  onMenuClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ user, onMenuClick }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-[#1e293b] px-4 sm:px-6 shadow-sm text-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="mr-2 text-slate-300 hover:text-white lg:hidden focus:outline-none"
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {['My Space', 'Team', 'Organization'].map((item, idx) => (
              <button 
                key={item}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${idx === 0 ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <span className="md:hidden text-sm font-semibold text-white">My Space</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Search Toggle */}
          <button 
            className="sm:hidden text-slate-300 hover:text-white"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors" aria-label="Add New">
            <Plus size={18} />
          </button>
          
          {/* Desktop Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="h-9 w-48 lg:w-64 rounded-md border border-slate-600 bg-slate-800 pl-9 pr-4 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button className="relative text-slate-300 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <button className="hidden sm:block text-slate-300 hover:text-white transition-colors">
            <Settings size={20} />
          </button>

          <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-600">
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-xs font-bold text-white cursor-pointer ring-2 ring-transparent hover:ring-white transition-all">
               {user.firstName.charAt(0)}{user.lastName.charAt(0)}
             </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      <div 
        className={`absolute inset-x-0 top-0 z-40 flex h-16 items-center bg-[#1e293b] px-4 transition-transform duration-300 ease-in-out lg:hidden ${
          isSearchOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            autoFocus={isSearchOpen}
            placeholder="Search HR Nexus..." 
            className="h-10 w-full rounded-md border-none bg-slate-800 pl-10 pr-10 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={() => setIsSearchOpen(false)}
          className="ml-3 p-1 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
    </>
  );
};

export default Topbar;