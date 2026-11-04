/**
 * Accepted payment marks.
 *
 * Drawn as inline SVG so they render without a network request and stay crisp
 * at any size. These are the two methods the platform accepts.
 */

export function MastercardMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" role="img" aria-label="Mastercard" className={className}>
      <rect width="48" height="32" rx="6" fill="#fff" />
      <rect x="0.5" y="0.5" width="47" height="31" rx="5.5" fill="none" stroke="#e6ecf3" />
      <circle cx="19" cy="16" r="10.5" fill="#EB001B" />
      <circle cx="29" cy="16" r="10.5" fill="#F79E1B" />
      <path
        d="M24 8.14a10.5 10.5 0 0 0 0 15.72 10.5 10.5 0 0 0 0-15.72Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function PaypalMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" role="img" aria-label="PayPal" className={className}>
      <rect width="48" height="32" rx="6" fill="#fff" />
      <rect x="0.5" y="0.5" width="47" height="31" rx="5.5" fill="none" stroke="#e6ecf3" />
      {/* Two overlapping "P" strokes, PayPal's mark */}
      <path
        d="M14.4 8.6h6.1c3.2 0 5 1.7 4.5 4.6-.5 3.1-2.9 4.8-6.2 4.8h-2.3l-.9 4.9h-3.1l1.9-14.3Z"
        fill="#253B80"
      />
      <path
        d="M25.2 10.9h5.9c3.1 0 4.9 1.6 4.4 4.5-.5 3-2.8 4.7-6 4.7h-2.2l-.9 4.8h-3l1.8-14Z"
        fill="#179BD7"
        opacity="0.92"
      />
    </svg>
  );
}

/** Compact row of accepted payment methods. */
export function AcceptedPayments({
  className = "",
  size = 26,
  label = "We accept",
}: {
  className?: string;
  size?: number;
  label?: string | null;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label ? (
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      ) : null}
      <span className="flex items-center gap-2">
        {[
          { mark: <MastercardMark />, label: "Mastercard" },
          { mark: <PaypalMark />, label: "PayPal" },
        ].map((m) => (
          <span
            key={m.label}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white py-1 pl-1.5 pr-2.5"
          >
            <span style={{ width: size * 1.45, height: size * 0.96 }} className="inline-block flex-none">
              {m.mark}
            </span>
            <span className="text-[0.72rem] font-bold text-navy-800">{m.label}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
