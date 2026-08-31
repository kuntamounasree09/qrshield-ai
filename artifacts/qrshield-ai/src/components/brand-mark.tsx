import { ShieldCheck } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5" data-testid="brand-mark">
      <span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-sm">
        <ShieldCheck size={20} strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-semibold tracking-[-.02em]">QRShield</span>
          <span className="mt-1 block font-mono-ui text-[9px] uppercase tracking-[.2em] text-[hsl(var(--sidebar-foreground)/.58)]">AI / checkpoint</span>
        </span>
      )}
    </span>
  );
}