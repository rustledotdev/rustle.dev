import { createContext, useContext } from 'react';

export type Dictionary = Record<string, string>;

export type RustleConfiguration = {
  sourceLanguage: string;
  targetLanguages: string[];
  localeBasePath: string;
};

export type RustleContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (id: string, values?: Record<string, any>) => string;
  ready: boolean;
  configuration: RustleConfiguration;
};

export const RustleContext = createContext<RustleContextValue | null>(null);

export function useRustle(): RustleContextValue {
  const ctx = useContext(RustleContext);
  if (!ctx) throw new Error('useRustle must be used within <RustleBox>');
  return ctx;
}

export function useT() {
  return useRustle().t;
}

