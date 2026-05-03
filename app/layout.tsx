import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';
import FloatingChat from '@/components/FloatingChat';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import '@/lib/engines'; // Initializes window.Engines on client side

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Apex Ops SST Inteligência',
  description: 'Plataforma de gestão de Saúde e Segurança do Trabalho',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased selection:bg-purple-500/30 print:bg-white print:text-[var(--text-primary)]`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
            <FloatingChat />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
