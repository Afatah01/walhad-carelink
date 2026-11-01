"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dirFor, LOCALES, translate, type Locale } from "@/lib/i18n";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  list: typeof LOCALES;
}

const I18nContext = createContext<Ctx>({
  locale: "en",
  setLocale: () => {},
  t: (k) => translate("en", k),
  dir: "ltr",
  list: LOCALES,
});

const STORAGE_KEY = "walhad.locale";
const COOKIE = "walhad_locale";

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (initialLocale !== "en") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && LOCALES.some((l) => l.code === stored)) {
        setLocaleState(stored);
      }
    } catch {
      /* storage unavailable */
    }
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(locale, key),
      dir: dirFor(locale),
      list: LOCALES,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
