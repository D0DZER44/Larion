"use client";

import React from 'react';
import { Sidebar } from './Sidebar';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* We can put a global header here if needed, but often each page has its own distinctive top bar in these designs */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
