"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0b0f19] overflow-hidden">
      {/* Mobile Top Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-[#0b0f19] border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-[#121826] to-[#1e1a30] border border-blue-500/30 overflow-hidden relative shrink-0">
            <Image 
              src="/logo.jpg" 
              alt="ApexShield Logo" 
              width={32} 
              height={32} 
              className="object-cover w-full h-full relative z-10" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
            <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-[#121826] z-0">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-blue-400">
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
               </svg>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">ApexShield</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -mr-2 text-gray-400 hover:text-white focus:outline-none"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-16 lg:pt-0">
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar pt-6 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
