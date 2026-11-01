import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const IconDrop = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.2s6 6.1 6 10.3a6 6 0 1 1-12 0C6 9.3 12 3.2 12 3.2Z" />
    <path d="M9.6 14.4a2.6 2.6 0 0 0 2.6 2.4" opacity=".55" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </svg>
);

export const IconFamily = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="3" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M2.8 20a5.2 5.2 0 0 1 10.4 0" />
    <path d="M14.4 19.6a4.6 4.6 0 0 1 6.9-3.5" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconMessage = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.7A8.5 8.5 0 1 1 21 12Z" />
    <path d="M8.6 11.5h6.8M8.6 14.7h4.2" opacity=".6" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M10.8 18.6h2.4" />
  </svg>
);

export const IconVolume = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3L12.5 5v14L7 14.5H4Z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" opacity=".6" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const IconMonitor = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="13" rx="2.5" />
    <path d="M8 21h8M12 17v4" />
    <path d="M6.5 11.5h2.2l1.3-2.7 2 5 1.4-2.3h2.1" />
  </svg>
);

export const IconHospital = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 21V8.5L12 4l8 4.5V21" />
    <path d="M2.5 21h19" />
    <path d="M12 8.5v5M9.5 11h5" />
    <path d="M9 21v-4h6v4" />
  </svg>
);

export const IconChart = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 3.5v17h17" />
    <path d="M7 15.5l3.5-4 3 2.4L20 7" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 20 6v6.2c0 4.6-3.3 8.2-8 9-4.7-.8-8-4.4-8-9V6Z" />
    <path d="m8.8 11.8 2.3 2.3 4.1-4.4" />
  </svg>
);

export const IconTelegram = (p: P) => (
  <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M21.6 4.3 18.9 19c-.2 1-.8 1.2-1.6.8l-4.4-3.2-2.1 2c-.2.2-.4.4-.9.4l.3-4.4 8-7.2c.4-.3-.1-.5-.6-.2L7.7 11.9 3.4 10.6c-1-.3-1-1 .2-1.4l16.5-6.4c.8-.3 1.7.2 1.5 1.5Z" />
  </svg>
);

export const IconSms = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5Z" />
    <path d="M7.5 10.5h9M7.5 13.2h5" opacity=".55" />
  </svg>
);

export const IconSensor = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7.4" />
    <circle cx="12" cy="12" r="3.1" />
    <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22" opacity=".65" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 13.7 9l6.1 1.7-6.1 1.7L12 18.6 10.3 12.4 4.2 10.7 10.3 9Z" />
    <path d="M18.6 16.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" opacity=".7" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.6 5 5L19.8 7" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 5.5 6.5 6.5L9 18.5" />
  </svg>
);

export const IconArrow = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.2 9.5h17.6M3.2 14.5h17.6" opacity=".6" />
    <path d="M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9Z" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.2V12l3.2 2" />
  </svg>
);

export const IconBattery = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="8" width="16" height="8" rx="2.2" />
    <path d="M21 11v2" />
    <rect x="4.8" y="10.2" width="8" height="3.6" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
    <path d="M8.2 10V7.5a3.8 3.8 0 0 1 7.6 0V10" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16.4 6.4a3.2 3.2 0 0 1 0 6.2M17.6 14.4A5.6 5.6 0 0 1 21.5 20" opacity=".7" />
  </svg>
);

export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.2 14.4a7.6 7.6 0 0 0 0-4.8l2-1.4-2-3.4-2.3 1a7.6 7.6 0 0 0-4.2-2.4L12.2 1h-4l-.5 2.4a7.6 7.6 0 0 0-4.2 2.4l-2.3-1-2 3.4 2 1.4a7.6 7.6 0 0 0 0 4.8l-2 1.4 2 3.4 2.3-1a7.6 7.6 0 0 0 4.2 2.4l.5 2.4h4l.5-2.4a7.6 7.6 0 0 0 4.2-2.4l2.3 1 2-3.4Z" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 4.5h3.5A2 2 0 0 1 20.5 6.5v11a2 2 0 0 1-2 2H15" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </svg>
);

export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.8h19" />
    <path d="M6 14.6h4" opacity=".7" />
  </svg>
);

export const IconStethoscope = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3v5a4 4 0 0 0 8 0V3" />
    <path d="M9 12v3.2a5.2 5.2 0 0 0 10.4 0V13" />
    <circle cx="19.4" cy="11" r="2.1" />
    <path d="M3 3h4M11 3h2" opacity=".6" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 17.5v2a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-2" />
  </svg>
);

export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 11a8 8 0 1 0-2.4 6.1" />
    <path d="M20 4.5V11h-6.4" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8h.01" />
  </svg>
);

export const IconSend = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 3 10.5 13.5M21 3l-6.6 18-3.9-7.5L3 9.6Z" />
  </svg>
);

export const IconGrid = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </svg>
);

export const IconLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M11 6.6l1.4-1.4a3.9 3.9 0 0 1 5.5 5.5L16.5 12" />
    <path d="M13 17.4l-1.4 1.4a3.9 3.9 0 0 1-5.5-5.5L7.5 12" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconWarning = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.6v5.2" />
    <path d="M12 16.1h.01" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2.4" />
    <path d="M15 6.2V5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15h.7" />
  </svg>
);

export const IconSos = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.4v5.2" />
    <path d="M12 15.9h.01" />
  </svg>
);
