-- Set default languageCode to 'en' for all existing users
UPDATE "User" SET "languageCode" = 'en' WHERE "languageCode" IS NULL OR "languageCode" = '';
