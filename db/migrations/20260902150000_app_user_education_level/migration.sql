-- Add the education level code supplied by the frontend.
ALTER TABLE "public"."app_user"
ADD COLUMN "education_level" TEXT;
