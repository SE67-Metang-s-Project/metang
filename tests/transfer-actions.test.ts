import assert from "node:assert/strict";
import { test } from "node:test";
import { getTransferActions, type TransferActionsInput } from "@/lib/transfer-actions";

const input = (overrides: Partial<TransferActionsInput> = {}): TransferActionsInput => ({
  hasProofButton: false,
  isTransferAccepted: false,
  isPendingDisbursement: true,
  canConfirmReceipt: true,
  canDownloadRequest: true,
  ...overrides,
});

test("before the admin transfers (no proof button) the request download is offered", () => {
  // Parents pass a confirm handler only once the admin has transferred, so none exists here.
  assert.deepEqual(getTransferActions(input({ canConfirmReceipt: false })), {
    showConfirmReceipt: false,
    showDownloadRequest: true,
  });
});

test("after the transfer, confirm receipt sits next to the proof and download waits", () => {
  assert.deepEqual(getTransferActions(input({ hasProofButton: true })), {
    showConfirmReceipt: true,
    showDownloadRequest: false,
  });
});

test("after confirming, the download returns beside the proof and confirm goes away", () => {
  assert.deepEqual(getTransferActions(input({ hasProofButton: true, isTransferAccepted: true })), {
    showConfirmReceipt: false,
    showDownloadRequest: true,
  });
});

test("no download handler means no download button in any state", () => {
  for (const hasProofButton of [true, false]) {
    for (const isTransferAccepted of [true, false]) {
      assert.equal(
        getTransferActions(input({ hasProofButton, isTransferAccepted, canDownloadRequest: false }))
          .showDownloadRequest,
        false,
      );
    }
  }
});

test("confirm receipt only appears while the request is pending disbursement", () => {
  assert.equal(getTransferActions(input({ isPendingDisbursement: false })).showConfirmReceipt, false);
});
