-- The loan request suffix was NO CYCLE, so the 10,000th request ever would fail and no loan could
-- be created again. Let the sequence wrap from 9999 back to 0000 instead. IDs carry the Bangkok
-- date (REQyyyymmddxxxx), so a wrapped suffix only collides with an existing ID when more than
-- 10,000 requests are created on one Bangkok day. With CYCLE, nextval never exceeds MAXVALUE, so
-- the range check in next_loan_request_id() is dead and is dropped. Both steps run in one
-- transaction so the function never outlives the sequence change it relies on.

BEGIN;

ALTER SEQUENCE "public"."loan_request_number_seq" CYCLE;

CREATE OR REPLACE FUNCTION "public"."next_loan_request_id"()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  RETURN 'REQ' || to_char(current_timestamp AT TIME ZONE 'Asia/Bangkok', 'YYYYMMDD') ||
    lpad(nextval('public.loan_request_number_seq')::text, 4, '0');
END;
$$;

COMMIT;
