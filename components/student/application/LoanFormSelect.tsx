"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";

type LoanFormSelectOption = {
  label: string;
  labelEn?: string;
  logoSrc?: string;
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
  const { language } = useStudentLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const getOptionLabel = (option: LoanFormSelectOption) =>
    language === "en" ? option.labelEn ?? option.label : option.label;

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
        <span className={styles.loanFormSelectValue}>
          {selectedOption?.logoSrc ? (
            <Image
              alt=""
              className={styles.loanFormSelectLogo}
              height={24}
              src={selectedOption.logoSrc}
              width={24}
            />
          ) : null}
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={isOpen ? styles.loanFormSelectChevronOpen : undefined}
          size={18}
        />
      </button>

      {isOpen ? (
        <div
          className={styles.loanFormSelectMenu}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={option.value === value ? styles.loanFormSelectOptionSelected : undefined}
              key={option.value}
              onClick={() => handleSelect(option.value)}
              role="option"
              type="button"
            >
              <span className={styles.loanFormSelectValue}>
                {option.logoSrc ? (
                  <Image
                    alt=""
                    className={styles.loanFormSelectLogo}
                    height={24}
                    src={option.logoSrc}
                    width={24}
                  />
                ) : null}
                {getOptionLabel(option)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
