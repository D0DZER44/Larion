"use client";

import React from 'react';
import { motion } from 'motion/react';
import { FileText, Download } from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col h-full">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Relatórios</h1>
          <p className="text-sm text-gray-400 mt-1">Visualize e exporte relatórios consolidados em SST.</p>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center max-w-md w-full"
        >
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Relatórios em Breve</h2>
          <p className="text-sm text-gray-400 mb-6">Estamos finalizando a integração dos relatórios personalizados do PGR e PCMSO.</p>
          <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar Dados Base (CSV)
          </button>
        </motion.div>
      </div>
    </div>
  );
}
