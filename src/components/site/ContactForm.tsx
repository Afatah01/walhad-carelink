"use client";

import { useState } from "react";
import { IconArrow, IconCheck } from "@/components/ui/Icons";

const CATEGORIES = [
  { value: "general", label: "General Enquiry" },
  { value: "technical", label: "Technical Support" },
  { value: "hospital", label: "Hospital Partnership" },
  { value: "privacy", label: "Privacy Request" },
];

export function ContactForm({ initialTopic = "general" }: { initialTopic?: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    topic: CATEGORIES.some((c) => c.value === initialTopic) ? initialTopic : "general",
    message: "",
    consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Could not send your message.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network problem — please try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600">
          <IconCheck size={22} />
        </span>
        <h2 className="mt-4 text-[1.15rem] font-extrabold text-navy-900">Message sent</h2>
        <p className="mt-1.5 text-[0.9rem] text-muted">We will reply to {form.email}.</p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setForm({ ...form, message: "" });
          }}
          className="btn btn-ghost btn-sm mt-5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" required>
          <input id="contact-name" name="name" required value={form.name} onChange={set("name")} className="input" autoComplete="name" />
        </Field>
        <Field label="Email Address" required>
          <input id="contact-email" name="email" required type="email" value={form.email} onChange={set("email")} className="input" autoComplete="email" />
        </Field>
        <Field label="Organisation" hint="Optional">
          <input id="contact-company" name="company" value={form.company} onChange={set("company")} className="input" autoComplete="organization" />
        </Field>
        <Field label="Enquiry Category" required>
          <select id="contact-topic" name="topic" value={form.topic} onChange={set("topic")} className="input">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Message" required>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            minLength={12}
            value={form.message}
            onChange={set("message")}
            className="input resize-y"
          />
        </Field>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5">
        <input
          id="contact-consent"
          name="consent"
          type="checkbox"
          checked={form.consent}
          onChange={set("consent")}
          className="mt-0.5 h-4 w-4 flex-none rounded border-line text-teal-600 focus:ring-teal-300"
        />
        <span className="text-[0.8rem] leading-relaxed text-navy-800/85">
          I agree that Walhad CareLink may contact me about this enquiry.
        </span>
      </label>

      {error ? (
        <p className="mt-4 rounded-xl border border-[#f3cdcd] bg-[#fdf3f3] px-3.5 py-2.5 text-[0.8rem] font-semibold text-[#a12b2b]">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy || !form.consent} className="btn btn-primary mt-5 w-full sm:w-auto">
        {busy ? "Sending…" : "Send Message"} <IconArrow size={15} />
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-muted">
        {label} {required ? <span className="text-teal-600">*</span> : null}
        {hint ? <span className="ml-1 font-medium normal-case tracking-normal text-muted/70">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
