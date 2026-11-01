"use client";

import { useState } from "react";
import { IconArrow, IconCheck, IconSend } from "@/components/ui/Icons";

const TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "subscription", label: "Subscription & billing" },
  { value: "hospital", label: "Hospital partnership" },
  { value: "technical", label: "Technical support" },
  { value: "privacy", label: "Privacy request" },
];

export function ContactForm({ initialTopic = "general" }: { initialTopic?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    topic: initialTopic,
    message: "",
    consent: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent) {
      setError("Please confirm you agree to be contacted about this enquiry.");
      return;
    }
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not send your message.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setError("Network problem — please try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-teal-600 shadow-sm">
          <IconCheck size={22} />
        </span>
        <h3 className="mt-3 text-lg font-extrabold text-navy-900">Message received</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[0.86rem] leading-relaxed text-muted">
          Thank you — your enquiry has been recorded. Our team will respond using the email address you provided.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm mt-4"
          onClick={() => {
            setForm({ name: "", email: "", company: "", topic: "general", message: "", consent: false });
            setState("idle");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Full name *
          </label>
          <input
            id="name"
            required
            className="field"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email address *
          </label>
          <input
            id="email"
            type="email"
            required
            className="field"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company">
            Organisation (optional)
          </label>
          <input
            id="company"
            className="field"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Hospital or clinic name"
            autoComplete="organization"
          />
        </div>
        <div>
          <label className="label" htmlFor="topic">
            Topic
          </label>
          <select
            id="topic"
            className="field"
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="message">
          How can we help? *
        </label>
        <textarea
          id="message"
          required
          rows={5}
          className="field resize-y"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell us about your family, ward or integration requirements."
        />
        <p className="help mt-1">
          Please do not include medical records, account passwords or identifying health information in this form.
        </p>
      </div>

      <label className="flex items-start gap-2.5 rounded-xl bg-mist/60 p-3">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 accent-brand-600"
        />
        <span className="text-[0.78rem] leading-relaxed text-muted">
          I agree to be contacted about this enquiry and have read the privacy approach. *
        </span>
      </label>

      {error ? (
        <div className="rounded-xl border border-[#f6d2d2] bg-low-soft px-3.5 py-2.5 text-[0.82rem] font-semibold text-low">
          {error}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? (
          "Sending…"
        ) : (
          <>
            Send message <IconSend size={15} />
          </>
        )}
      </button>
      <p className="text-center text-[0.72rem] text-muted">
        Your message is stored securely and used only to respond to this enquiry.
      </p>
    </form>
  );
}
