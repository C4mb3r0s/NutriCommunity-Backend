-- Replace the placeholder password before executing this script in DBeaver.
-- bcrypt uses 14 rounds through pgcrypto's blowfish salt.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO roles (code, name)
VALUES ('admin', 'Administrador / Nutriólogo')
ON CONFLICT (code) DO NOTHING;

WITH admin_user AS (
  INSERT INTO users (
    first_name,
    second_name,
    last_name,
    second_last_name,
    email,
    password_hash,
    status
  )
  VALUES (
    'Administrador',
    NULL,
    'NutriCommunity',
    NULL,
    'admin@nutricommunity.com',
    crypt('REPLACE_WITH_A_STRONG_PASSWORD', gen_salt('bf', 14)),
    'active'
  )
  ON CONFLICT (email)
  DO UPDATE SET
    status = 'active',
    updated_at = now()
  RETURNING id
)
INSERT INTO user_roles (user_id, role_id)
SELECT admin_user.id, roles.id
FROM admin_user
JOIN roles ON roles.code = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
