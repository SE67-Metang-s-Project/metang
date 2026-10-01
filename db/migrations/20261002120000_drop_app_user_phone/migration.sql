-- app_user.phone was never written by the app (no route, not the CMU sign-in sync) and never shown.
-- A student's phone lives on loan_request.student_phone; the office phone on system_setting.
ALTER TABLE "public"."app_user" DROP COLUMN "phone";
