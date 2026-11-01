"use client";

import Link from "next/link";
import Image from "next/image";
import { IconArrow, IconBell, IconCheck, IconShield, IconSpark, IconTelegram } from "@/components/ui/Icons";
import { useI18n } from "@/components/i18n/I18nProvider";
import { brand } from "@/lib/brand";
import { GlucosePreview } from "./GlucosePreview";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="mesh-hero relative">
      <div className="shell relative pb-16 pt-12 md:pb-24 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* copy */}
          <div className="reveal">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill pill-teal">
                <IconSpark size={13} /> {t("hero.eyebrow")}
              </span>
              <span className="pill pill-brand">
                <IconShield size={13} /> Consent-based sharing
              </span>
            </div>

            <h1 className="display-1 mt-5 text-navy-900">
              {t("hero.title1")}
              <br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>

            <p className="lead mt-5 max-w-xl">{t("hero.body")}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/pricing" className="btn btn-primary btn-lg">
                {t("hero.cta")}
                <IconArrow size={17} />
              </Link>
              <Link href="/pricing" className="btn btn-ghost btn-lg">
                {t("hero.secondary")}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[0.82rem] font-semibold text-navy-800">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-50 text-teal-600">
                    <IconCheck size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex items-center gap-4 rounded-2xl border border-line bg-white/70 p-3 backdrop-blur-sm">
              <Image
                src={brand.logo.emblem}
                alt="Walhad CareLink"
                width={52}
                height={52}
                className="h-[52px] w-[52px] object-contain"
              />
              <div className="min-w-0">
                <p className="text-[0.8rem] font-extrabold text-navy-900">One family. One clear view of glucose.</p>
                <p className="text-[0.74rem] leading-snug text-muted">
                  Patients, parents, caregivers and clinicians see the same readings — with permissions set by the
                  patient.
                </p>
              </div>
              <span className="ml-auto hidden items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[0.62rem] font-bold text-teal-700 sm:inline-flex">
                <IconTelegram size={12} /> Bot ready
              </span>
            </div>
          </div>

          {/* visual */}
          <div className="reveal relative [animation-delay:120ms]">
            <div className="pointer-events-none absolute -right-10 top-6 hidden xl:block">
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <IconBell size={13} />
                </span>
                <div>
                  <p className="text-[0.62rem] font-bold text-navy-900">Push · SMS · Telegram</p>
                  <p className="text-[0.56rem] font-semibold text-muted">Delivered in seconds</p>
                </div>
              </div>
            </div>
            <GlucosePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
