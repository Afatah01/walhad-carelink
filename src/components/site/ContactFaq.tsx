"use client";

import { useState } from "react";
import { IconChevron } from "@/components/ui/Icons";

const FAQS = [
  {
    q: "Do I need new hardware?",
    a: "No. Walhad CareLink reads from the FreeStyle Libre source you already use, through an authorised connection.",
  },
  {
    q: "Who can see my readings?",
    a: "Only the people you invite. Access is recorded and can be withdrawn at any time.",
  },
  {
    q: "Is SMS included?",
    a: "SMS is built but needs an SMS gateway configured on the deployment. Telegram and push work today.",
  },
  {
    q: "How is a subscription activated?",
    a: "A plan becomes active once payment is verified. Until then it stays pending.",
  },
];

export function ContactFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-white">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#fbfdfd] md:px-6"
              >
                <span className="text-[0.9rem] font-semibold text-ink">{f.q}</span>
                <span
                  className={`grid h-7 w-7 flex-none place-items-center rounded-full border border-line text-muted transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-aqua text-teal-500" : ""
                  }`}
                >
                  <IconChevron size={12} />
                </span>
              </button>
              <div
                className={`grid transition-all duration-250 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-[0.85rem] leading-relaxed text-muted md:px-6">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
