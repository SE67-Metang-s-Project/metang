ALTER TABLE "system_setting"
  ADD COLUMN "contact_hours_th" TEXT NOT NULL DEFAULT 'วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น.',
  ADD COLUMN "contact_hours_en" TEXT NOT NULL DEFAULT 'Monday - Friday, 08:30 - 16:30',
  ADD COLUMN "contact_closed_th" TEXT NOT NULL DEFAULT 'เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์',
  ADD COLUMN "contact_closed_en" TEXT NOT NULL DEFAULT 'Excluding public and national holidays';
