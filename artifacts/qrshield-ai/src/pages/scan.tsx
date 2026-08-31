import { useEffect, useRef, useState } from 'react';
import { Check, FileImage, ImagePlus, LockKeyhole, ScanLine, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getGetScanSummaryQueryKey, getListScansQueryKey, useCreateScan } from '@workspace/api-client-react';
import { ErrorState, SectionEyebrow } from '@/components/qr-ui';
import { useToast } from '@/hooks/use-toast';

const stages = ['Reading image', 'Decoding payload', 'Checking observable signals', 'Preparing report'];

export default function ScanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createScan = useCreateScan();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createScan.isPending) return;
    const timer = window.setInterval(() => setElapsed((time) => time + 1), 1000);
    return () => window.clearInterval(timer);
  }, [createScan.isPending]);
  useEffect(() => {
    if (createScan.isPending) setStage(Math.min(3, Math.floor(elapsed / 2)));
    else if (!file) { setElapsed(0); setStage(0); }
  }, [elapsed, createScan.isPending, file]);

  function selectFile(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith('image/')) { toast({ title: 'That file is not an image', description: 'Choose a PNG, JPEG, or WebP QR capture.' }); return; }
    if (next.size > 10 * 1024 * 1024) { toast({ title: 'Image is too large', description: 'Please choose an image under 10 MB.' }); return; }
    setFile(next); createScan.reset();
  }
  function submit() {
    if (!file || createScan.isPending) return;
    createScan.mutate({ data: { file } }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetScanSummaryQueryKey() });
        navigate(`/result/${result.id}`);
      },
      onError: () => toast({ title: 'Analysis could not start', description: 'The image stayed local to your session. Try another capture.' }),
    });
  }

  return (
    <div className="page-enter mx-auto max-w-4xl">
      <header className="mb-10"><SectionEyebrow>New observation / 02</SectionEyebrow><h1 className="mt-3 font-display text-[clamp(2.7rem,7vw,5.5rem)] leading-[.9] tracking-[-.05em]">Inspect the<br /><i>unknown.</i></h1><p className="mt-5 max-w-xl text-[14px] leading-7 text-muted-foreground">Use a clear image with the full code visible. QRShield will decode it without opening the destination.</p></header>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-[1.65rem] border border-border bg-card p-5 shadow-[var(--shadow-xs)] sm:p-8">
          {!createScan.isPending ? <><button type="button" className={`group flex min-h-[340px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-colors ${dragging ? 'border-primary bg-[hsl(var(--primary)/.08)]' : 'border-[hsl(var(--primary)/.3)] bg-[hsl(var(--muted)/.42)] hover:bg-[hsl(var(--primary)/.05)]'}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }} data-testid="dropzone-upload"><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} data-testid="input-upload-image" /><span className="mb-5 grid size-16 place-items-center rounded-[1.25rem] bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))] transition-transform group-hover:scale-105">{file ? <FileImage size={28} /> : <ImagePlus size={28} />}</span>{file ? <><h2 className="max-w-full truncate font-display text-2xl">{file.name}</h2><p className="mt-2 text-[12px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · ready for analysis</p></> : <><h2 className="font-display text-3xl">Drop a QR image here</h2><p className="mt-2 text-[12px] text-muted-foreground">or choose a file from this device</p><span className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[12px] font-semibold"><UploadCloud size={15} /> Choose image</span></>}</button>{file && <div className="mt-4 flex items-center justify-between rounded-xl bg-[hsl(var(--muted)/.7)] px-4 py-3"><div className="flex min-w-0 items-center gap-2"><Check className="shrink-0 text-[hsl(var(--primary))]" size={15} /><span className="truncate text-[12px]">{file.name}</span></div><button type="button" onClick={() => setFile(null)} className="rounded-md p-1.5 text-muted-foreground hover:bg-card" aria-label="Remove selected image" data-testid="button-remove-image"><X size={15} /></button></div>}<button type="button" disabled={!file} onClick={submit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-analyze-image"><ScanLine size={17} />Analyze this image</button></> : <div className="flex min-h-[420px] flex-col justify-center px-5 py-8"><div className="mb-8 flex items-center gap-4"><div className="grid size-12 place-items-center rounded-2xl bg-[hsl(var(--primary)/.11)] text-[hsl(var(--primary))]"><ScanLine size={22} className="animate-pulse" /></div><div><p className="font-display text-3xl">Reading with care.</p><p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">{elapsed}s elapsed · destination unopened</p></div></div><div className="space-y-5">{stages.map((label, index) => <div className="flex items-center gap-3" key={label}><span className={`grid size-7 place-items-center rounded-full border ${index < stage ? 'border-primary bg-primary text-primary-foreground' : index === stage ? 'border-[hsl(var(--primary)/.45)] text-[hsl(var(--primary))]' : 'border-border text-muted-foreground'}`}>{index < stage ? <Check size={14} /> : <span className="font-mono-ui text-[10px]">{String(index + 1).padStart(2, '0')}</span>}</span><div className="flex-1"><p className={`text-[13px] ${index <= stage ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</p>{index === stage && <div className="scan-pulse mt-2 h-1 w-32 rounded-full bg-primary" />}</div></div>)}</div></div>}{createScan.isError && !createScan.isPending && <div className="mt-5"><ErrorState detail="The analysis service returned an error before a report was created." onRetry={() => createScan.reset()} /></div>}</section>
        <aside className="space-y-4"><div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2 text-[hsl(var(--primary))]"><LockKeyhole size={17} /><SectionEyebrow>Privacy boundary</SectionEyebrow></div><p className="text-[13px] leading-relaxed text-muted-foreground">QRShield never follows the decoded destination in your browser. The report describes what was observable from the code and enabled checks.</p></div><div className="rounded-2xl border border-border bg-[hsl(var(--accent)/.08)] p-5"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-[hsl(35_62%_32%)]">Good capture</p><ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-foreground/75"><li>• Full code in frame</li><li>• Even lighting, little glare</li><li>• PNG, JPEG, or WebP</li></ul></div></aside>
      </div>
    </div>
  );
}