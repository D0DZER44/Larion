"use client";

import React, { useState, useEffect } from 'react';
import { ProfileTab } from '@/components/ProfileTab';

export default function PerfilPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0A0D14] text-white font-sans">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-full overflow-hidden relative z-10">
          <header className="mb-8 shrink-0">
            <h1 className="text-2xl font-bold text-white tracking-tight">Perfil do Usuário</h1>
            <p className="text-sm text-gray-400 mt-1">Gerencie suas informações pessoais, segurança e preferências.</p>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
            <ProfileTab />
          </div>
        </div>
      </main>
    </div>
  );
}
