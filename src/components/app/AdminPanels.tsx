"use client";

import { useCallback, useEffect, useState } from "react";
import { IconCheck, IconInfo, IconRefresh, IconShield, IconTelegram, IconUsers } from "@/components/ui/Icons";
import { stampTime } from "@/lib/glucose";

type Plan = {
  slug: string;
  name: string;
  price: number;
  interval: string;
  recipients: number | null;
  patients: number | null;
  active: boolean;
  badge: string | null;
};
type Sub = { id: number; plan: string | null; status: string; renews: string | null; sms: string; price: string };
type Org = { id: number; name: string; type: string; patients: number };
type Staff = { id: number; name: string; email: string; role: string; title: string | null; lastLogin: string | null };
type Contact = { id: number; name: string; email: string; topic: string; message: string; at: string; status: string };
type Audit = { id: number; action: string; actor: string; entity: string; at: string };
type Integration = { id: number; provider: string; event: string; status: string; message: string | null; at: string };

const TABS = ["Patients", "Plans", "Subscriptions", "Organisations", "Staff", "Enquiries", "Audit", "Integrations"] as const;

export function AdminPanels(props: {
  hasBot: boolean;
  plans: Plan[];
  subscriptions: Sub[];
  orgs: Org[];
  staff: Staff[];
  contacts: Contact[];
  audit: Audit[];
  integrations: Integration[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Patients");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 6000);
  };

  async function runWebhook(action: "register" | "delete" | "info") {
    setBusy(true);
    const res = await fetch(`/api/telegram/setup?action=${action}`, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    notify(json.ok ? json.detail ?? "Done." : json.error ?? "Telegram request failed.");
  }

  return (
    <div className="mt-6">
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1.5 text-[0.78rem] font-bold transition ${
              tab === t ? "border-navy-800 bg-navy-800 text-white" : "border-line bg-white text-navy-800 hover:border-brand-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "Patients" ? (
          <PatientsPanel notify={notify} />
        ) : null}

        {tab === "Plans" ? (
          <>
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-[0.92rem] font-extrabold text-navy-900">Pricing configuration</h2>
                <span className="text-[0.7rem] font-semibold text-muted">Single source of truth · served from the database</span>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Recipients</th>
                      <th>Patients</th>
                      <th>Badge</th>
                      <th>Public</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.plans.map((p) => (
                      <tr key={p.slug}>
                        <td>
                          <p className="text-[0.84rem] font-bold text-navy-900">{p.name}</p>
                          <p className="font-mono text-[0.66rem] text-muted">{p.slug}</p>
                        </td>
                        <td className="tabular font-bold text-navy-900">
                          ${p.price}
                          <span className="text-[0.66rem] font-semibold text-muted">/{p.interval}</span>
                        </td>
                        <td className="text-[0.8rem] text-muted">{p.recipients ?? "custom"}</td>
                        <td className="text-[0.8rem] text-muted">{p.patients ?? "custom"}</td>
                        <td className="text-[0.72rem] font-semibold text-muted">{p.badge ?? "—"}</td>
                        <td>
                          <span className={`pill text-[0.56rem] ${p.active ? "pill-ok" : "pill-muted"}`}>
                            {p.active ? "live" : "hidden"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
              <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
              <p className="text-[0.74rem] leading-relaxed text-muted">
                Prices, feature lists, recipient limits and badges are stored in the <code>plans</code> table and read
                by the marketing pricing grid, the billing page and the subscription engine. Edit them in the
                database (or a future settings screen) and every surface updates — nothing is hard-coded in a
                component.
              </p>
            </div>
          </>
        ) : null}

        {tab === "Subscriptions" ? (
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">Subscriptions</h2>
              <p className="text-[0.7rem] text-muted">
                A subscription only activates after a verified payment confirmation — never on request alone.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[640px]">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Renews</th>
                    <th>SMS used</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {props.subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-[0.74rem] text-muted">{s.id}</td>
                      <td className="text-[0.82rem] font-bold text-navy-900">{s.plan ?? "—"}</td>
                      <td>
                        <span className={`pill text-[0.56rem] ${s.status === "active" ? "pill-ok" : "pill-high"}`}>{s.status}</span>
                      </td>
                      <td className="text-[0.76rem] text-muted">
                        {s.renews ? new Date(s.renews).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="text-[0.76rem] text-muted">{s.sms}</td>
                      <td className="tabular font-bold text-navy-900">{s.price}</td>
                    </tr>
                  ))}
                  {!props.subscriptions.length ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[0.8rem] text-muted">
                        No subscriptions yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "Organisations" ? <OrganisationsPanel notify={notify} /> : null}

        {tab === "Staff" ? (
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">Clinical staff</h2>
              <p className="text-[0.7rem] text-muted">Only authorised healthcare professionals can open patient records.</p>
            </div>
            <ul className="divide-y divide-line">
              {props.staff.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-navy-700 text-[0.68rem] font-extrabold text-white">
                    {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.84rem] font-bold text-navy-900">{s.name}</p>
                    <p className="truncate text-[0.68rem] text-muted">
                      {s.email} · {s.title ?? s.role}
                    </p>
                  </div>
                  <span className="pill pill-muted text-[0.56rem]">{s.role}</span>
                </li>
              ))}
              {!props.staff.length ? <li className="px-4 py-6 text-center text-[0.8rem] text-muted">No staff accounts.</li> : null}
            </ul>
          </section>
        ) : null}

        {tab === "Enquiries" ? (
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">Contact enquiries</h2>
            </div>
            <ul className="divide-y divide-line">
              {props.contacts.map((c) => (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[0.84rem] font-bold text-navy-900">
                      {c.name} <span className="text-[0.7rem] font-semibold text-muted">· {c.email}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="pill pill-muted text-[0.56rem] capitalize">{c.topic}</span>
                      <span className="text-[0.66rem] text-muted">{stampTime(new Date(c.at).getTime())}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">{c.message}</p>
                </li>
              ))}
              {!props.contacts.length ? <li className="px-4 py-6 text-center text-[0.8rem] text-muted">No enquiries yet.</li> : null}
            </ul>
          </section>
        ) : null}

        {tab === "Audit" ? (
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-[0.92rem] font-extrabold text-navy-900">
                <IconShield size={15} className="text-teal-600" /> Audit log
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {props.audit.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div>
                    <p className="text-[0.8rem] font-bold capitalize text-navy-900">{a.action.replace(/\./g, " ")}</p>
                    <p className="text-[0.66rem] text-muted">
                      {a.actor} · {a.entity || "—"}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[0.66rem] font-semibold text-muted">{stampTime(new Date(a.at).getTime())}</span>
                </li>
              ))}
              {!props.audit.length ? <li className="px-4 py-6 text-center text-[0.8rem] text-muted">No audit entries.</li> : null}
            </ul>
          </section>
        ) : null}

        {tab === "Integrations" ? (
          <>
            <section className="card p-5">
              <h2 className="flex items-center gap-1.5 text-[0.92rem] font-extrabold text-navy-900">
                <IconTelegram size={16} className="text-brand-600" /> Telegram webhook
              </h2>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">
                The bot token lives only in server environment variables. Registering the webhook tells Telegram
                where to deliver updates; the endpoint rejects any request without the secret header.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`pill text-[0.58rem] ${props.hasBot ? "pill-ok" : "pill-high"}`}>
                  {props.hasBot ? "bot token configured" : "TELEGRAM_BOT_TOKEN missing"}
                </span>
                <button onClick={() => runWebhook("register")} disabled={busy} className="btn btn-sm btn-primary">
                  <IconRefresh size={14} /> Register webhook
                </button>
                <button onClick={() => runWebhook("info")} disabled={busy} className="btn btn-sm btn-ghost">
                  Check status
                </button>
                <button onClick={() => runWebhook("delete")} disabled={busy} className="btn btn-sm btn-ghost !text-low">
                  Remove
                </button>
              </div>
              <p className="mt-2 text-[0.7rem] text-muted">
                CLI alternative: <code className="rounded bg-mist px-1 py-0.5">npm run telegram:set-webhook</code>
              </p>
            </section>

            <section className="card overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <h2 className="flex items-center gap-1.5 text-[0.92rem] font-extrabold text-navy-900">
                  <IconUsers size={15} className="text-brand-600" /> Integration events
                </h2>
              </div>
              <ul className="divide-y divide-line">
                {props.integrations.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[0.8rem] font-bold capitalize text-navy-900">
                        {i.provider} · {i.event}
                      </p>
                      <p className="truncate text-[0.68rem] text-muted">{i.message ?? "—"}</p>
                    </div>
                    <span className={`pill text-[0.56rem] ${i.status === "ok" ? "pill-ok" : i.status === "error" ? "pill-low" : "pill-muted"}`}>
                      {i.status}
                    </span>
                  </li>
                ))}
                {!props.integrations.length ? (
                  <li className="px-4 py-6 text-center text-[0.8rem] text-muted">No integration events yet.</li>
                ) : null}
              </ul>
            </section>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
        <IconCheck size={15} className="mt-0.5 flex-none text-teal-600" />
        <p className="text-[0.74rem] leading-relaxed text-muted">
          Administrative actions are written to the audit log with the acting account, entity and timestamp.
        </p>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Patient records — the only way data enters the platform.            */
/* ------------------------------------------------------------------ */

type PatientRowDto = {
  id: number;
  displayName: string;
  provider: string;
  connectedAt: string | null;
  createdAt: string;
  readings: number;
};

function PatientsPanel({ notify }: { notify: (m: string) => void }) {
  const [rows, setRows] = useState<PatientRowDto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ name: string; id: number } | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    dateOfBirth: "",
    timezone: "Africa/Mogadishu",
    unit: "mg/dL" as "mg/dL" | "mmol/L",
    targetLow: "70",
    targetHigh: "180",
    patientEmail: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/patients", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setRows(json.patients);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      notify(json.error ?? "Could not create the record.");
      return;
    }
    notify(`Created ${json.patient.displayName}. No readings yet — connect a source to start.`);
    setCreated({ name: json.patient.displayName, id: json.patient.id });
    setForm({ ...form, displayName: "", dateOfBirth: "", patientEmail: "" });
    void load();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-[0.92rem] font-extrabold text-navy-900">Patient records</h2>
          <p className="mt-0.5 text-[0.72rem] font-semibold text-muted">
            A new record holds no data. Readings appear only after a Libre source is connected.
          </p>
        </div>
        {rows === null ? (
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-[0.84rem] font-semibold text-muted">
            No patients yet. Create the first record below.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[640px]">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Source</th>
                  <th>Readings</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-[0.84rem] font-bold text-navy-900">{r.displayName}</td>
                    <td>
                      {r.connectedAt ? (
                        <span className="pill pill-ok text-[0.56rem]">{r.provider} connected</span>
                      ) : (
                        <span className="pill pill-muted text-[0.56rem]">not connected</span>
                      )}
                    </td>
                    <td className="tabular text-[0.8rem] text-muted">{r.readings}</td>
                    <td className="text-[0.76rem] text-muted">{r.createdAt ? stampTime(Date.parse(r.createdAt)) : "—"}</td>
                    <td className="text-right">
                      <a
                        href={`/dashboard/connection?patientId=${r.id}`}
                        className="text-[0.76rem] font-bold text-brand-700 hover:underline"
                      >
                        Connect source
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form onSubmit={submit} className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-[0.92rem] font-extrabold text-navy-900">Create a patient record</h2>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Full name">
            <input required value={form.displayName} onChange={set("displayName")} className="input" placeholder="Patient name" />
          </Field>
          <Field label="Date of birth (optional)">
            <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className="input" />
          </Field>
          <Field label="Time zone">
            <select value={form.timezone} onChange={set("timezone")} className="input">
              {["Africa/Mogadishu", "Africa/Nairobi", "Africa/Addis_Ababa", "Africa/Djibouti", "Europe/London", "Europe/Istanbul", "Asia/Dubai"].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </Field>
          <Field label="Display unit">
            <select value={form.unit} onChange={set("unit")} className="input">
              <option value="mg/dL">mg/dL</option>
              <option value="mmol/L">mmol/L</option>
            </select>
          </Field>
          <Field label="Target low">
            <input type="number" value={form.targetLow} onChange={set("targetLow")} className="input" min={40} max={120} />
          </Field>
          <Field label="Target high">
            <input type="number" value={form.targetHigh} onChange={set("targetHigh")} className="input" min={100} max={300} />
          </Field>
          <Field label="Patient login email (optional)" hint="Leave blank for a clinic-managed record with no app login.">
            <input type="email" value={form.patientEmail} onChange={set("patientEmail")} className="input" placeholder="patient@example.com" />
          </Field>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? "Creating…" : "Create record"}
            </button>
          </div>
        </div>
        {created ? (
          <div className="border-t border-line bg-[#f4faff] px-4 py-3">
            <p className="text-[0.78rem] font-semibold text-navy-800">
              {created.name} created with zero readings.
            </p>
            <a
              href={`/dashboard/connection?patientId=${created.id}`}
              className="mt-2 inline-flex text-[0.78rem] font-bold text-brand-700 hover:underline"
            >
              Connect a glucose source
            </a>
          </div>
        ) : null}
      </form>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.68rem] text-muted">{hint}</span> : null}
    </label>
  );
}


/* ------------------------------------------------------------------ */
/* Organisations — hospitals and clinics with real staff and patients. */
/* ------------------------------------------------------------------ */

type OrgDto = {
  id: number;
  name: string;
  type: string;
  country: string | null;
  patients: number;
  staff: number;
  connected: number;
  createdAt: string;
};

function OrganisationsPanel({ notify }: { notify: (m: string) => void }) {
  const [orgs, setOrgs] = useState<OrgDto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<{ name: string; email: string; password: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "hospital" as "hospital" | "family",
    country: "Somalia",
    contactEmail: "",
    contactPhone: "",
    address: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/orgs", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setOrgs(json.orgs);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      notify(json.error ?? "Could not create the organisation.");
      return;
    }
    notify(`${json.org.name} created.`);
    if (json.staff) setMade({ name: json.org.name, email: json.staff.email, password: json.staff.password });
    setForm({ ...form, name: "", contactEmail: "", adminEmail: "", adminName: "", adminPassword: "" });
    void load();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-[0.92rem] font-extrabold text-navy-900">Organisations</h2>
          <p className="mt-0.5 text-[0.72rem] font-semibold text-muted">
            Counts come from live patient and staff records.
          </p>
        </div>
        {orgs === null ? (
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        ) : orgs.length === 0 ? (
          <p className="px-4 py-6 text-center text-[0.84rem] font-semibold text-muted">
            No organisations yet. Create the first hospital below.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[680px]">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Type</th>
                  <th>Patients</th>
                  <th>Monitoring</th>
                  <th>Staff</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id}>
                    <td className="text-[0.84rem] font-bold text-navy-900">{o.name}</td>
                    <td className="text-[0.78rem] capitalize text-muted">{o.type}</td>
                    <td className="tabular text-[0.8rem] text-muted">{o.patients}</td>
                    <td className="tabular text-[0.8rem] text-muted">{o.connected}</td>
                    <td className="tabular text-[0.8rem] text-muted">{o.staff}</td>
                    <td className="text-[0.78rem] text-muted">{o.country ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form onSubmit={submit} className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-[0.92rem] font-extrabold text-navy-900">Register a hospital</h2>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Hospital name">
            <input required value={form.name} onChange={set("name")} className="input" placeholder="e.g. Hargeisa General Hospital" />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={set("type")} className="input">
              <option value="hospital">Hospital / clinic</option>
              <option value="family">Family workspace</option>
            </select>
          </Field>
          <Field label="Country">
            <input value={form.country} onChange={set("country")} className="input" />
          </Field>
          <Field label="Contact email">
            <input type="email" value={form.contactEmail} onChange={set("contactEmail")} className="input" />
          </Field>
          <Field label="Phone">
            <input value={form.contactPhone} onChange={set("contactPhone")} className="input" placeholder="+252 …" />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={set("address")} className="input" />
          </Field>
          <Field label="Clinical lead email" hint="Gets a doctor account scoped to this hospital.">
            <input type="email" value={form.adminEmail} onChange={set("adminEmail")} className="input" placeholder="doctor@hospital.so" />
          </Field>
          <Field label="Clinical lead name">
            <input value={form.adminName} onChange={set("adminName")} className="input" />
          </Field>
          <Field label="Temporary password" hint="Leave blank to generate a strong one.">
            <input value={form.adminPassword} onChange={set("adminPassword")} className="input" />
          </Field>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? "Registering…" : "Register hospital"}
            </button>
          </div>
        </div>
        {made ? (
          <div className="border-t border-line bg-[#f4faff] px-4 py-3">
            <p className="text-[0.78rem] font-bold text-navy-800">{made.name} staff login created</p>
            <p className="mt-1 font-mono text-[0.76rem] text-navy-900">{made.email}</p>
            <p className="font-mono text-[0.76rem] text-navy-900">{made.password}</p>
            <p className="mt-1 text-[0.7rem] text-muted">Share once — the password is not shown again.</p>
          </div>
        ) : null}
      </form>
    </>
  );
}
