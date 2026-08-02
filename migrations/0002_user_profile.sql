-- 0002: Профиль пользователя — данные для контекста ИИ

ALTER TABLE users ADD COLUMN activity_type TEXT;
ALTER TABLE users ADD COLUMN software_product TEXT;
ALTER TABLE users ADD COLUMN product_version TEXT;
ALTER TABLE users ADD COLUMN config_type TEXT;
ALTER TABLE users ADD COLUMN customizations TEXT;
