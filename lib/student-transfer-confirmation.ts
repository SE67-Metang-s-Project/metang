const storagePrefix = "student-transfer-confirmed:v2:";
const confirmationEvent = "student-transfer-confirmed";

function storageKey(loanId: string) {
  return `${storagePrefix}${loanId}`;
}

export function hasConfirmedTransfer(loanId?: string) {
  if (!loanId || typeof window === "undefined") return false;

  return window.localStorage.getItem(storageKey(loanId)) === "true";
}

export function saveTransferConfirmation(loanId?: string) {
  if (!loanId || typeof window === "undefined") return;

  window.localStorage.setItem(storageKey(loanId), "true");
  window.dispatchEvent(new CustomEvent(confirmationEvent, { detail: loanId }));
}

export function subscribeToTransferConfirmation(loanId: string | undefined, onChange: () => void) {
  if (!loanId || typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(loanId)) onChange();
  };
  const onConfirmation = (event: Event) => {
    if ((event as CustomEvent<string>).detail === loanId) onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(confirmationEvent, onConfirmation);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(confirmationEvent, onConfirmation);
  };
}
