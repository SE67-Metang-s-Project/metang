"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type AdaptiveKeyValueRowProps = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  labelAs?: "dt" | "small";
  valueAs?: "dd" | "strong";
  valueAlignment?: "left" | "right";
  alwaysInline?: boolean;
  alwaysStacked?: boolean;
};

const inlineGap = 16;

export default function AdaptiveKeyValueRow({
  label,
  value,
  className = "",
  labelClassName = "",
  valueClassName = "",
  labelAs: Label = "dt",
  valueAs: Value = "dd",
  valueAlignment,
  alwaysInline = false,
  alwaysStacked = false,
}: AdaptiveKeyValueRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isInline, setIsInline] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    if (alwaysInline || alwaysStacked) {
      return;
    }

    const updateLayout = () => {
      const measureWidth = (element: HTMLElement | null) => {
        if (!element) return 0;

        const clone = element.cloneNode(true) as HTMLElement;
        clone.setAttribute("aria-hidden", "true");
        clone.style.cssText =
          "position:absolute; visibility:hidden; width:max-content; max-width:none; white-space:nowrap;";
        row.appendChild(clone);
        const width = clone.getBoundingClientRect().width;
        clone.remove();
        return width;
      };

      const labelWidth = measureWidth(row.querySelector("[data-adaptive-label]"));
      const valueWidth = measureWidth(row.querySelector("[data-adaptive-value]"));
      setIsInline(row.clientWidth >= labelWidth + valueWidth + inlineGap);
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(row);
    void document.fonts?.ready.then(updateLayout);

    return () => observer.disconnect();
  }, [alwaysInline, alwaysStacked, label, value]);

  const layoutIsInline = alwaysInline || (!alwaysStacked && isInline);

  return (
    <div
      ref={rowRef}
      data-layout={layoutIsInline ? "inline" : "stacked"}
      className={`relative !grid min-w-0 ${
        layoutIsInline
          ? "!grid-cols-[max-content_minmax(0,1fr)] !items-start !gap-x-4 !gap-y-0"
          : "!grid-cols-1 !gap-y-1"
      } ${className}`}
    >
      <Label data-adaptive-label className={labelClassName}>{label}</Label>
      <Value
        data-adaptive-value
        className={`${valueAlignment ? `!text-${valueAlignment}` : layoutIsInline ? "!text-right" : "!text-left"} ${valueClassName}`}
      >
        {value}
      </Value>
    </div>
  );
}
