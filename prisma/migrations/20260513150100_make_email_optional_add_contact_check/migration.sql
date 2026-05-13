ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_email_or_phoneNumber_check" CHECK ("email" IS NOT NULL OR "phoneNumber" IS NOT NULL);
