import styles from "@/app/student/student.module.css";

type LoanFormSelectOption = {
  label: string;
  value: string;
};

type LoanFormSelectProps = {
  disabled?: boolean;
  error?: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  options: LoanFormSelectOption[];
  placeholder: string;
  value: string;
};

export default function LoanFormSelect({
  disabled = false,
  error,
  onBlur,
  onChange,
  options,
  placeholder,
  value,
}: LoanFormSelectProps) {
  return (
    <div className={styles.loanFormSelectWrap}>
      <select
        aria-invalid={Boolean(error)}
        className={value ? "" : styles.loanFormSelectPlaceholder}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
