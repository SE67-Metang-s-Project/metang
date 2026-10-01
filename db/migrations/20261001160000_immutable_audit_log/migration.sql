-- Removing a staff member can now delete their app_user row, and the audit log must outlive it.
-- 1. audit_log.actor_id keeps the uuid but no longer references app_user: a deleted actor's rows
--    stay as written. The user.deleted row records who that uuid was (email, name, roles).
-- 2. audit_log is append-only, like fund_transaction: no UPDATE, DELETE or TRUNCATE. Seeding and
--    db:reset get the same session-scoped escape hatch (db/seed.ts, db/clear.ts:
--    SET LOCAL methang.allow_audit_mutation).
-- 3. user_role.granted_by is set to NULL when the granter is deleted; the grant itself is in
--    the audit log.
BEGIN;

ALTER TABLE "public"."audit_log" DROP CONSTRAINT "audit_log_actor_id_fkey";

CREATE FUNCTION "public"."audit_log_block_mutation"() RETURNS trigger AS $$
BEGIN
  IF current_setting('methang.allow_audit_mutation', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'audit_log is append-only; % is not allowed', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_log_append_only"
  BEFORE UPDATE OR DELETE ON "public"."audit_log"
  FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_block_mutation"();

-- Row triggers never fire on TRUNCATE, so it needs its own statement trigger. NEW and OLD are
-- NULL there; a BEFORE statement trigger's return value is ignored.
CREATE TRIGGER "audit_log_no_truncate"
  BEFORE TRUNCATE ON "public"."audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "public"."audit_log_block_mutation"();

ALTER TABLE "public"."user_role" DROP CONSTRAINT "user_role_granted_by_fkey";
ALTER TABLE "public"."user_role" ADD CONSTRAINT "user_role_granted_by_fkey"
  FOREIGN KEY ("granted_by") REFERENCES "public"."app_user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT;
