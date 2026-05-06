"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X } from 'lucide-react';
import { ChatPanel } from '@/components/lari/ChatPanel';

export default function FloatingChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Hide on /chat route
  if (pathname === '/chat') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[360px] h-[550px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border border-white/10 relative"
          >
             <ChatPanel isFloating={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all text-white border border-purple-400/30 z-50 ${isOpen ? 'bg-[#121826] border-white/10 scale-90' : 'bg-purple-600 hover:bg-purple-500 hover:scale-105'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0b0f19] rounded-full"></span>
          </>
        )}
      </button>
    </div>
  );
}

