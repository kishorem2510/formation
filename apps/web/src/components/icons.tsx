type IconProps = { className?: string };

const base = "h-6 w-6";

export function IconRoster({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="8" r="2.2" />
      <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />
    </svg>
  );
}

export function IconSchedule({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" strokeLinecap="round" />
      <path d="M7.5 13.5h3M13.5 13.5h3M7.5 16.5h3" strokeLinecap="round" />
    </svg>
  );
}

export function IconAttendance({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M8.5 12.5l2.3 2.3L15.8 9.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconDocs({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M6.5 3.5h7l4 4v13a1 1 0 01-1 1h-10a1 1 0 01-1-1v-16a1 1 0 011-1z" />
      <path d="M13.5 3.5v4h4" />
      <path d="M9 13h6M9 16.5h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCross({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconEye({ className = "h-4.5 w-4.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function IconEyeOff({ className = "h-4.5 w-4.5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 5.64A10.8 10.8 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 01-3.2 4.02M6.5 7.24C4.3 8.9 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9.9 9.9 0 004.02-.86" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 10.1a2.75 2.75 0 003.9 3.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCircle({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );
}
