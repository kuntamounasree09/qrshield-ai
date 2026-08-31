import { ArrowLeft, ScanLine } from 'lucide-react';
import { Link } from '@/lib/link';
import { SectionEyebrow } from '@/components/qr-ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-7 grid size-14 place-items-center rounded-2xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><ScanLine size={25} /></div>
        <SectionEyebrow>Unmapped destination</SectionEyebrow>
        <h1 className="mt-3 font-display text-5xl tracking-[-.04em]">This path was not observed.</h1>
        <p className="mx-auto mt-4 max-w-sm text-[13px] leading-relaxed text-muted-foreground">The page you requested is outside the current checkpoint. Nothing was opened.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground" data-testid="link-return-overview"><ArrowLeft size={15} />Return to overview</Link>
      </div>
    </div>
  );
}
