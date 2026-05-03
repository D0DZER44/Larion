import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-2xl font-bold mb-4">Página não encontrada</h2>
      <p className="text-[var(--text-muted)] mb-6">Não conseguimos encontrar a página que você está procurando.</p>
      <Link href="/" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-[var(--text-primary)] rounded-md transition-colors">
        Voltar para o Início
      </Link>
    </div>
  );
}
