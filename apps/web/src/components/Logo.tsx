/** Mark: five nodes in an upward wedge, connected like a tactics board --
 * reads as both "team formation" and "forward progress". Uses currentColor
 * for the connecting lines and the accent token for the nodes so it adapts
 * to theme automatically. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-surface" />
      <g stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.25">
        <line x1="16" y1="9" x2="9" y2="16" />
        <line x1="16" y1="9" x2="23" y2="16" />
        <line x1="9" y1="16" x2="6" y2="23" />
        <line x1="9" y1="16" x2="16" y2="23" />
        <line x1="23" y1="16" x2="16" y2="23" />
        <line x1="23" y1="16" x2="26" y2="23" />
      </g>
      <g className="fill-accent">
        <circle cx="16" cy="9" r="2.5" />
        <circle cx="9" cy="16" r="2.5" />
        <circle cx="23" cy="16" r="2.5" />
        <circle cx="6" cy="23" r="2.5" />
        <circle cx="16" cy="23" r="2.5" />
        <circle cx="26" cy="23" r="2.5" />
      </g>
    </svg>
  );
}

export function Logo({
  className = "",
  iconClassName = "h-8 w-8",
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={iconClassName} />
      <span className="text-lg font-semibold tracking-tight">Formation</span>
    </span>
  );
}
