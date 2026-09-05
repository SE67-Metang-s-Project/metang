type StatusPillTone = "info" | "success" | "warning" | "danger" | "neutral";

type StatusPillProps = {
  className?: string;
  label: string;
  tone?: StatusPillTone;
};

const toneClassNames: Record<StatusPillTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-orange-200 bg-orange-50 text-orange-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
};

export default function StatusPill({ className = "", label, tone = "info" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-sm font-medium leading-5 ${toneClassNames[tone]} ${className}`}
    >
      ● {label}
    </span>
  );
}
