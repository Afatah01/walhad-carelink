"use client";

import Link from "next/link";
import Image from "next/image";
import { IconArrow, IconBell, IconCheck, IconDrop, IconShield } from "@/components/ui/Icons";
import { useI18n } from "@/components/i18n/I18nProvider";
import { brand } from "@/lib/brand";

/**
 * Marketing hero.
 *
 * Deliberately contains no glucose chart and no example readings: this site
 * never shows invented medical values, even as decoration. The real dashboard
 * is behind sign-in and only ever shows readings that actually arrived.
 */
export function Hero() {
  const { t } = useI18n();

  return (
    <section className="mesh-hero relative">
      <div className="shell relative pb-16 pt-12 md:pb-20 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="reveal">
            <span className="pill pill-teal">{t("hero.eyebrow")}</span>

            <h1 className="display-1 mt-5 text-navy-900">
              {t("hero.title1")}
              <br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>

            <p className="lead mt-4 max-w-lg">{t("hero.body")}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary btn-lg">
                {t("hero.cta")}
                <IconArrow size={17} />
              </Link>
              <Link href="/pricing" className="btn btn-ghost btn-lg">
                {t("hero.secondary")}
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-navy-800">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-teal-50 text-teal-600">
                    <IconCheck size={11} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: what the product does, with no invented readings. */}
          <div className="reveal [animation-delay:120ms]">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <Image
                  src={brand.logo.emblem}
                  alt="Walhad CareLink"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
                <div>
                  <p className="text-[0.86rem] font-extrabold text-navy-900">Walhad CareLink</p>
                  <p className="text-[0.7rem] font-semibold text-muted">FreeStyle Libre monitoring</p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {[
                  { icon: IconDrop, title: "Live glucose", body: "Readings arrive from your sensor" },
                  { icon: IconBell, title: "Real alerts", body: "Low, high and rapid-change warnings" },
                  { icon: IconShield, title: "Your consent", body: "You choose who can see your data" },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.title} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.8rem] font-bold text-navy-900">{row.title}</p>
                        <p className="text-[0.7rem] text-muted">{row.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-[0.68rem] font-semibold text-muted">
                No sample data on this page — readings appear only after you connect a sensor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
