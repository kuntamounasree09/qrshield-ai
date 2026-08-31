import { useEffect, useState } from 'react';
import { BrainCircuit, Check, Globe2, Radar, Save, Shield, WifiOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSettingsQueryKey, Language, useGetSettings, useUpdateSettings } from '@workspace/api-client-react';
import { ErrorState, SectionEyebrow, SkeletonBlock } from '@/components/qr-ui';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';

type SettingsState = { language: Language; aiEnabled: boolean; redirectAnalysisEnabled: boolean; threatIntelEnabled: boolean };

const options: Array<{ key: keyof Omit<SettingsState, 'language'>; icon: typeof Shield; titleKey: 'aiPerspective' | 'redirectPath' | 'threatIntelligence'; detailKey: 'aiOptionDetail' | 'redirectOptionDetail' | 'threatOptionDetail' }> = [
  { key: 'aiEnabled', icon: BrainCircuit, titleKey: 'aiPerspective', detailKey: 'aiOptionDetail' },
  { key: 'redirectAnalysisEnabled', icon: Radar, titleKey: 'redirectPath', detailKey: 'redirectOptionDetail' },
  { key: 'threatIntelEnabled', icon: Shield, titleKey: 'threatIntelligence', detailKey: 'threatOptionDetail' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, setLanguage } = useLanguage();
  const query = useGetSettings();
  const update = useUpdateSettings();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  useEffect(() => { if (query.data) setSettings(query.data); }, [query.data]);
  function save(patch: Partial<SettingsState>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    update.mutate({ data: patch }, { onSuccess: (saved) => { setSettings(saved); setLanguage(saved.language); queryClient.setQueryData(getGetSettingsQueryKey(), saved); toast({ title: t('preferenceSaved'), description: t('futureScans') }); }, onError: () => { setSettings(settings); toast({ title: t('preferenceNotSaved'), description: t('settingsServiceHelp') }); } });
  }
  return <div className="page-enter mx-auto max-w-4xl space-y-9"><header><SectionEyebrow>{t('controlRoom')} / 04</SectionEyebrow><h1 className="mt-3 font-display text-[clamp(2.8rem,6vw,5rem)] leading-[.9] tracking-[-.05em]">{t('depthOfCheck')}<br /><i>{t('check')}</i></h1><p className="mt-5 max-w-xl text-[14px] leading-7 text-muted-foreground">{t('settingsIntro')}</p></header>{query.isLoading || !settings ? query.isError ? <ErrorState onRetry={() => query.refetch()} detail={t('preferencesUnavailable')} /> : <div className="space-y-3"><SkeletonBlock className="h-20" /><SkeletonBlock className="h-20" /><SkeletonBlock className="h-20" /></div> : <><section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)] sm:p-7"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><Globe2 size={17} /></span><div><SectionEyebrow>{t('interfaceLanguage')}</SectionEyebrow><h2 className="mt-1 font-display text-2xl">{t('howQrShieldSpeaks')}</h2><p className="mt-1 text-[12px] text-muted-foreground">{t('labelsFollow')}</p></div></div><div className="mt-6 grid gap-2 sm:grid-cols-3">{([{ value: Language.en, label: 'English', note: 'English' }, { value: Language.hi, label: 'हिन्दी', note: 'Hindi' }, { value: Language.te, label: 'తెలుగు', note: 'Telugu' }] as const).map((item) => <button type="button" key={item.value} onClick={() => save({ language: item.value })} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${settings.language === item.value ? 'border-primary bg-[hsl(var(--primary)/.08)]' : 'border-border hover:bg-muted'}`} data-testid={`button-language-${item.value}`}><span><span className="block text-[13px] font-semibold">{item.label}</span><span className="mt-1 block text-[10px] text-muted-foreground">{item.note}</span></span>{settings.language === item.value && <Check size={16} className="text-[hsl(var(--primary))]" />}</button>)}</div></section><section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-xs)] sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--accent)/.18)] text-[hsl(35_62%_32%)]"><Save size={17} /></span><div><SectionEyebrow>{t('analysisProfile')}</SectionEyebrow><h2 className="mt-1 font-display text-2xl">{t('optionalSignalLayers')}</h2><p className="mt-1 text-[12px] text-muted-foreground">{t('unavailableProviders')}</p></div></div><div className="divide-y divide-border">{options.map(({ key, icon: Icon, titleKey, detailKey }) => <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0" key={key}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--muted))] text-muted-foreground"><Icon size={18} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{t(titleKey)}</p><p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted-foreground">{t(detailKey)}</p></div><button type="button" role="switch" aria-checked={settings[key]} onClick={() => save({ [key]: !settings[key] })} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${settings[key] ? 'bg-primary' : 'bg-[hsl(var(--muted-foreground)/.28)]'}`} data-testid={`switch-${key}`}><span className={`block size-5 rounded-full bg-card shadow-sm transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>)}</div></section><div className="flex items-center gap-3 rounded-2xl border border-border bg-[hsl(var(--primary)/.06)] p-5 text-[12px] text-muted-foreground"><WifiOff size={17} className="shrink-0 text-[hsl(var(--primary))]" /><p><strong className="text-foreground">{t('boundaryNote')}</strong> {t('optionalUnavailable')}</p></div></>}</div>;
}