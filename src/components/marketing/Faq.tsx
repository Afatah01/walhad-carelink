"use client";

import { useState } from "react";
import { IconChevron } from "@/components/ui/Icons";

export interface FaqItem {
  q: string;
  a: React.ReactNode;
}

export function FaqAccordion({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#fbfdff]"
              aria-expanded={isOpen}
            >
              <span className={`text-[0.92rem] font-bold ${isOpen ? "text-brand-700" : "text-navy-900"}`}>
                {item.q}
              </span>
              <span
                className={`grid h-7 w-7 flex-none place-items-center rounded-full transition-transform ${
                  isOpen ? "rotate-90 bg-brand-50 text-brand-600" : "bg-mist text-muted"
                }`}
              >
                <IconChevron size={14} />
              </span>
            </button>
            <div
              className="grid transition-all duration-300"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-[0.86rem] leading-relaxed text-muted">{item.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
