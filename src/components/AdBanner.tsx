import { ExternalLink } from 'lucide-react';

export function AdBanner() {
  return (
    <a
      href="https://www.effectivegatecpm.com/de5ntjx08i?key=3c83c876c2406bfe7ee9fa767a6b112e"
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-gradient-to-r from-primary/5 to-accent/10 rounded-lg border border-primary/20 text-center hover:opacity-80 transition-opacity mt-4"
    >
      <span className="text-xs text-muted-foreground">Gostou do resultado?</span>
      <p className="text-sm font-medium text-primary flex items-center justify-center gap-1">
        Clique aqui para apoiar o ZPL Easy
        <ExternalLink className="h-3 w-3" />
      </p>
    </a>
  );
}
