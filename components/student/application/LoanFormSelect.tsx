"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.loanFormSelectWrap} ref={selectRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-invalid={Boolean(error) || undefined}
        className={[
          styles.loanFormSelectTrigger,
          selectedOption ? styles.loanFormSelectTriggerSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        onBlur={onBlur}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          className={isOpen ? styles.loanFormSelectChevronOpen : undefined}
          size={18}
        />
      </button>

      {isOpen ? (
        <div className={styles.loanFormSelectMenu} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? styles.loanFormSelectOptionSelected : undefined}
              key={option.value}
              onClick={() => handleSelect(option.value)}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
