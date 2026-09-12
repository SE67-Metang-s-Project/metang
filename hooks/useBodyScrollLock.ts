"use client";

import { useEffect, useRef } from "react";

let activeLockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyPaddingRight = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;

  if (activeLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
  }

  activeLockCount++;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;

  activeLockCount = Math.max(0, activeLockCount - 1);

  if (activeLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
  }
}

/**
 * Hook to lock background/body scrolling while a modal/popup is open.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}

/**
 * Hook for modal dismissal: locks body scroll, supports click-outside on backdrop, and Escape key.
 */
export function useModalDismiss({
  onClose,
  isOpen = true,
  closeOnEscape = true,
}: {
  onClose?: () => void;
  isOpen?: boolean;
  closeOnEscape?: boolean;
}) {
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    mouseDownTargetRef.current = event.target;
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLElement>) => {
    if (
      event.target === event.currentTarget &&
      (mouseDownTargetRef.current === event.currentTarget || mouseDownTargetRef.current === null)
    ) {
      onClose?.();
    }
    mouseDownTargetRef.current = null;
  };

  return {
    onMouseDown: handleBackdropMouseDown,
    onClick: handleBackdropClick,
  };
}
