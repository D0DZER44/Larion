import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';
import FloatingChat from '@/components/FloatingChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ApexShield SST Inteligência',
  description: 'Plataforma de gestão de Saúde e Segurança do Trabalho',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#0b0f19] text-gray-300 min-h-screen antialiased selection:bg-purple-500/30`} suppressHydrationWarning>
        <LayoutShell>
          {children}
        </LayoutShell>
        <FloatingChat />
      </body>
    </html>
  );
}
