import styles from "@/app/student/student.module.css";

export function MoneyIllustration() {
  return (
    <svg aria-hidden="true" className={styles.moneyIllustration} viewBox="0 0 136 80">
      <g transform="rotate(-10 58 48)">
        <rect fill="var(--illustration-money-base)" height="25" rx="4" width="86" x="24" y="42" />
        <rect fill="var(--illustration-money-light)" height="25" rx="4" width="86" x="18" y="35" />
        <path d="M36 40h53v15H36z" fill="var(--illustration-money-shadow)" />
        <circle cx="62" cy="47.5" fill="var(--illustration-money-circle)" r="11" />
        <path d="M60 41h4v13h-4zM56 45h12v4H56z" fill="var(--illustration-money-mark)" />
      </g>
      <g transform="rotate(9 92 37)">
        <rect fill="var(--illustration-money-base)" height="24" rx="4" width="78" x="43" y="24" />
        <rect fill="var(--illustration-money-light)" height="24" rx="4" width="78" x="48" y="18" />
        <path d="M59 24h54v15H59z" fill="var(--illustration-money-shadow)" />
        <circle cx="86" cy="31.5" fill="var(--illustration-money-circle)" r="10" />
        <path d="M84 26h4v12h-4zM80 29h12v4H80z" fill="var(--illustration-money-mark)" />
      </g>
    </svg>
  );
}

export function MedicalBagIcon() {
  return (
    <svg aria-hidden="true" className={styles.medicalBag} viewBox="0 0 100 70">
      <path d="M30 18c1-11 10-16 20-16s19 5 20 16" fill="var(--illustration-bag-top)" />
      <rect fill="var(--illustration-bag-base)" height="47" rx="8" width="78" x="11" y="15" />
      <path d="M11 25h78v29H11z" fill="var(--illustration-bag-light)" />
      <path d="M42 28h16v8h8v9h-8v8H42v-8h-8v-9h8z" fill="var(--illustration-bag-cross)" />
      <path d="M12 31h76" stroke="var(--illustration-bag-line)" strokeWidth="3" />
      <path d="M20 58h60" stroke="var(--illustration-bag-shadow)" strokeWidth="3" />
    </svg>
  );
}
