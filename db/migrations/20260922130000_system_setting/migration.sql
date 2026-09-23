-- CreateTable
CREATE TABLE "system_setting" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "bank_name" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "contact_location_th" TEXT NOT NULL,
    "contact_location_en" TEXT,
    "contact_phone" TEXT NOT NULL,
    "contact_ext" TEXT,
    "contact_email" TEXT NOT NULL,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "system_setting" ADD CONSTRAINT "system_setting_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- One row, forever: the settings screen edits a singleton, so the table is a singleton.
ALTER TABLE "system_setting" ADD CONSTRAINT "system_setting_singleton" CHECK ("id" = 1);

-- Seed from the fixture values the screens show today (components/shared/mock-data/
-- mockSystemSettings.ts), so no screen regresses.
INSERT INTO "system_setting" (
  "id", "bank_name", "account_name", "account_number",
  "contact_location_th", "contact_phone", "contact_ext", "contact_email"
) VALUES (
  1,
  'ธนาคารกรุงไทย',
  'คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ (เงินกู้ยืมฉุกเฉิน)',
  '521-0-12345-6',
  'จุดรับเอกสารคำร้องเงินกู้ยืม ชั้น 1 อาคารเทพรัตน์ คณะพยาบาลศาสตร์ มช.',
  '053-935025',
  '5025, 5026',
  'loan@nurse.cmu.ac.th'
) ON CONFLICT ("id") DO NOTHING;
