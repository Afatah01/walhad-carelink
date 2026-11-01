"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface PatientOption {
  id: number;
  name: string;
  relationship: string | null;
  role: string;
  unit: "mg/dL" | "mmol/L";
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  title: string | null;
  unit: string;
  orgName: string | null;
  orgType: string | null;
}

interface Ctx {
  user: AppUser;
  patients: PatientOption[];
  activeId: number | null;
  setActiveId: (id: number) => void;
  active: PatientOption | null;
  /** Patient ids the signed-in user may view. */
  allowedIds: number[];
  globalUnit: "mg/dL" | "mmol/L";
  setGlobalUnit: (u: "mg/dL" | "mmol/L") => void;
  /** Today's audible-alert preference (session only). */
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
}

const DashboardCtx = createContext<Ctx | null>(null);

const STORAGE_PATIENT = "walhad.activePatient";
const STORAGE_SOUND = "walhad.sound";

export function DashboardProvider({
  user,
  patients,
  children,
}: {
  user: AppUser;
  patients: PatientOption[];
  children: React.ReactNode;
}) {
  const initial = patients[0]?.id ?? null;
  const [activeId, setActiveIdState] = useState<number | null>(initial);
  const [globalUnit, setGlobalUnit] = useState<"mg/dL" | "mmol/L">(
    user.unit === "mmol/L" ? "mmol/L" : "mg/dL",
  );
  const [soundOn, setSoundOnState] = useState(true);

  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(STORAGE_PATIENT));
      if (stored && patients.some((p) => p.id === stored)) setActiveIdState(stored);
      const storedSound = window.localStorage.getItem(STORAGE_SOUND);
      if (storedSound !== null) setSoundOnState(storedSound === "1");
    } catch {
      /* ignore */
    }
  }, [patients]);

  const setActiveId = useCallback((id: number) => {
    setActiveIdState(id);
    try {
      window.localStorage.setItem(STORAGE_PATIENT, String(id));
    } catch {
      /* ignore */
    }
  }, []);

  const setSoundOn = useCallback((v: boolean) => {
    setSoundOnState(v);
    try {
      window.localStorage.setItem(STORAGE_SOUND, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user,
      patients,
      activeId,
      setActiveId,
      active: patients.find((p) => p.id === activeId) ?? patients[0] ?? null,
      allowedIds: patients.map((p) => p.id),
      globalUnit,
      setGlobalUnit,
      soundOn,
      setSoundOn,
    }),
    [user, patients, activeId, setActiveId, globalUnit, soundOn, setSoundOn],
  );

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useDashboardCtx() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboardCtx must be used inside DashboardProvider");
  return ctx;
}
