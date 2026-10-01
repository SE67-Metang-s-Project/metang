-- The executive also advises students: students pick them as advisor on the application form and
-- the executive advisor queue lists loans with advisor_id = the executive. Every advisor lookup
-- goes by the advisor role, so the executive must hold it. Handing the executive role to a new
-- email before 2026-10-01 granted only "executive"; give the current executive "advisor" too.
INSERT INTO "public"."user_role" ("user_id", "role", "granted_by")
SELECT "user_id", 'advisor', "granted_by"
FROM "public"."user_role"
WHERE "role" = 'executive'
ON CONFLICT ("user_id", "role") DO NOTHING;
