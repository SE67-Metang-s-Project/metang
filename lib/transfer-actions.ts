export type TransferActionsInput = {
  /** The proof button is wired up (the admin has transferred, so there is a slip to view). */
  hasProofButton: boolean;
  /** The student already confirmed receipt of the transfer. */
  isTransferAccepted: boolean;
  /** Status is pending_disbursement. */
  isPendingDisbursement: boolean;
  /** A confirm-receipt handler/label exists. */
  canConfirmReceipt: boolean;
  /** A download handler exists. */
  canDownloadRequest: boolean;
};

export type TransferActions = {
  showConfirmReceipt: boolean;
  showDownloadRequest: boolean;
};

/**
 * Which transfer-step buttons besides "View proof" the student sees:
 * - before the admin transfers (no proof button): download request form only;
 * - after the transfer, before confirming: confirm receipt (next to View proof);
 * - after confirming: download request form (next to View proof).
 */
export function getTransferActions({
  hasProofButton,
  isTransferAccepted,
  isPendingDisbursement,
  canConfirmReceipt,
  canDownloadRequest,
}: TransferActionsInput): TransferActions {
  return {
    showConfirmReceipt: !isTransferAccepted && isPendingDisbursement && canConfirmReceipt,
    showDownloadRequest: canDownloadRequest && (isTransferAccepted || !hasProofButton),
  };
}
