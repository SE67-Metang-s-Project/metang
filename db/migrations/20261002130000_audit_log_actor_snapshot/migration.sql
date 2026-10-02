-- audit_log.actor_id has no FK (20261001160000), so a deleted staff member's uuid names nobody,
-- and the actor's roles may change after the fact. Each row now snapshots who acted and the roles
-- they held at write time: actor_name (full_name_th, or the borrower's name for a student) and
-- actor_role (the held roles, comma-joined in enum order, e.g. "advisor,executive"; the action
-- says which one was used). A BEFORE INSERT trigger fills both, so no call site passes them.
-- Backfills existing rows; a row whose staff actor is already deleted keeps NULLs.
BEGIN;

ALTER TABLE "public"."audit_log"
  ADD COLUMN "actor_name" TEXT,
  ADD COLUMN "actor_role" TEXT;

CREATE FUNCTION "public"."audit_log_snapshot_actor"() RETURNS trigger AS $$
BEGIN
  IF NEW."actor_id" IS NOT NULL THEN
    SELECT u."full_name_th",
      (SELECT string_agg(r."role"::text, ',' ORDER BY r."role")
       FROM "public"."user_role" r WHERE r."user_id" = u."id")
    INTO NEW."actor_name", NEW."actor_role"
    FROM "public"."app_user" u
    WHERE u."id" = NEW."actor_id";
  ELSE
    -- A student is not an app_user; their name lives on their loans.
    NEW."actor_role" := 'student';
    SELECT l."student_name_th" INTO NEW."actor_name"
    FROM "public"."loan_request" l
    WHERE l."student_code" = NEW."actor_student_code"
    ORDER BY l."created_at" DESC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_log_snapshot_actor"
  BEFORE INSERT ON "public"."audit_log"
  FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_snapshot_actor"();

-- Backfill through the append-only trigger's escape hatch (scoped to this transaction).
SET LOCAL methang.allow_audit_mutation = 'on';

UPDATE "public"."audit_log" a
SET "actor_name" = u."full_name_th",
    "actor_role" = (SELECT string_agg(r."role"::text, ',' ORDER BY r."role")
                    FROM "public"."user_role" r WHERE r."user_id" = u."id")
FROM "public"."app_user" u
WHERE a."actor_id" = u."id";

UPDATE "public"."audit_log" a
SET "actor_role" = 'student',
    "actor_name" = (SELECT l."student_name_th" FROM "public"."loan_request" l
                    WHERE l."student_code" = a."actor_student_code"
                    ORDER BY l."created_at" DESC LIMIT 1)
WHERE a."actor_student_code" IS NOT NULL;

COMMIT;
