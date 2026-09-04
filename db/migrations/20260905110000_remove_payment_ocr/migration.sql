-- OCR has been removed from payment processing. These columns may contain historical OCR output only.
ALTER TABLE "public"."payment"
  DROP COLUMN IF EXISTS "slip_ocr_status",
  DROP COLUMN IF EXISTS "ocr_amount",
  DROP COLUMN IF EXISTS "ocr_paid_at",
  DROP COLUMN IF EXISTS "slip_ocr_raw";
