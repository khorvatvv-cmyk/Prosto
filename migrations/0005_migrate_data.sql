-- 0005: Миграция данных — офис, организации, связи

INSERT INTO offices (name, code, is_active) VALUES ('Кемерово', 'KEM', 1);

INSERT INTO organizations (office_id, inn, name, manager_id, service_status, created_at, updated_at, last_activity_at)
SELECT 1, u.inn, u.organization, NULL, 'unknown', u.created_at, u.created_at, u.created_at
FROM users u
WHERE u.inn IS NOT NULL AND u.inn != '' AND u.inn != '0000000000'
AND u.role = 'user'
AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.inn = u.inn);

INSERT INTO organization_users (organization_id, user_id, membership_status, approved_at, created_at)
SELECT o.id, u.id, 'active', u.created_at, u.created_at
FROM users u
JOIN organizations o ON o.inn = u.inn
WHERE u.inn IS NOT NULL AND u.inn != '' AND u.inn != '0000000000'
AND u.role = 'user'
AND NOT EXISTS (SELECT 1 FROM organization_users ou WHERE ou.user_id = u.id);

UPDATE requests SET organization_id = (
  SELECT o.id FROM organizations o
  JOIN users u ON o.inn = u.inn
  WHERE u.id = requests.user_id
), client_user_id = user_id
WHERE organization_id IS NULL;
