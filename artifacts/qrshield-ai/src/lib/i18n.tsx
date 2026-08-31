import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Language, useGetSettings } from '@workspace/api-client-react';

const copy = {
  en: {
    overview: 'Overview',
    newScan: 'New scan',
    history: 'History',
    settings: 'Settings',
    workspace: 'Workspace',
    localSession: 'Local session',
    sessionHistory: 'Your history stays in this browser session. Nothing is shared by default.',
    observationDesk: 'Observation desk',
    newObservation: 'New observation',
    archive: 'Archive',
    controlRoom: 'Control room',
    interfaceLanguage: 'Interface language',
    howQrShieldSpeaks: 'How QRShield speaks',
    analysisProfile: 'Analysis profile',
    optionalSignalLayers: 'Optional signal layers',
    preferenceSaved: 'Preference saved',
    futureScans: 'Future scans will use this analysis profile.',
  },
  hi: {
    overview: 'अवलोकन',
    newScan: 'नया स्कैन',
    history: 'इतिहास',
    settings: 'सेटिंग्स',
    workspace: 'कार्यस्थल',
    localSession: 'स्थानीय सत्र',
    sessionHistory: 'आपका इतिहास इसी ब्राउज़र सत्र में रहता है। डिफ़ॉल्ट रूप से कुछ साझा नहीं होता।',
    observationDesk: 'अवलोकन डेस्क',
    newObservation: 'नया अवलोकन',
    archive: 'अभिलेख',
    controlRoom: 'नियंत्रण कक्ष',
    interfaceLanguage: 'इंटरफ़ेस भाषा',
    howQrShieldSpeaks: 'QRShield कैसे बोलता है',
    analysisProfile: 'विश्लेषण प्रोफ़ाइल',
    optionalSignalLayers: 'वैकल्पिक संकेत परतें',
    preferenceSaved: 'पसंद सहेजी गई',
    futureScans: 'आने वाले स्कैन इस विश्लेषण प्रोफ़ाइल का उपयोग करेंगे।',
  },
  te: {
    overview: 'అవలోకనం',
    newScan: 'కొత్త స్కాన్',
    history: 'చరిత్ర',
    settings: 'సెట్టింగ్స్',
    workspace: 'వర్క్‌స్పేస్',
    localSession: 'స్థానిక సెషన్',
    sessionHistory: 'మీ చరిత్ర ఈ బ్రౌజర్ సెషన్‌లోనే ఉంటుంది. డిఫాల్ట్‌గా ఏదీ భాగస్వామ్యం కాదు.',
    observationDesk: 'పరిశీలన డెస్క్',
    newObservation: 'కొత్త పరిశీలన',
    archive: 'ఆర్కైవ్',
    controlRoom: 'కంట్రోల్ రూమ్',
    interfaceLanguage: 'ఇంటర్‌ఫేస్ భాష',
    howQrShieldSpeaks: 'QRShield ఎలా మాట్లాడుతుంది',
    analysisProfile: 'విశ్లేషణ ప్రొఫైల్',
    optionalSignalLayers: 'ఐచ్ఛిక సిగ్నల్ లేయర్లు',
    preferenceSaved: 'ప్రాధాన్యత భద్రపరచబడింది',
    futureScans: 'తదుపరి స్కాన్‌లు ఈ విశ్లేషణ ప్రొఫైల్‌ను ఉపయోగిస్తాయి.',
  },
} as const;

type TranslationKey = keyof typeof copy.en;
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const query = useGetSettings();
  const [language, setLanguage] = useState<Language>(Language.en);

  useEffect(() => {
    if (query.data?.language) setLanguage(query.data.language);
  }, [query.data?.language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => copy[language][key] ?? copy.en[key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}