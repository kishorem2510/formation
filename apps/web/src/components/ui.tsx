import { InputHTMLAttributes, ButtonHTMLAttributes } from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-6 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
      {error && <span className="block text-sm text-danger">{error}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground outline-none transition-colors focus:border-accent ${props.className ?? ""}`}
    />
  );
}

export function Select({
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground outline-none transition-colors focus:border-accent ${className}`}
    >
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const base = "rounded-lg px-4 py-2.5 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-foreground hover:bg-accent-hover"
      : "border border-border text-foreground hover:bg-surface-hover";
  return <button {...props} className={`${base} ${styles} ${className}`} />;
}
