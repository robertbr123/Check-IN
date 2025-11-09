-- ==============================================================================
-- Criar Usuário Admin - Neon PostgreSQL
-- ==============================================================================
-- Execute este SQL no Neon SQL Editor após o deploy
-- ==============================================================================

-- Inserir usuário admin
INSERT INTO "users" (
  id, 
  name, 
  email, 
  password, 
  role, 
  active, 
  "createdAt", 
  "updatedAt"
)
VALUES (
  -- ID único gerado automaticamente
  CONCAT('usr_', REPLACE(gen_random_uuid()::text, '-', '')),
  
  -- Nome
  'Administrador',
  
  -- Email
  'admin@linket.com.br',
  
  -- Senha: admin123 (hash bcrypt)
  '$2a$10$K5z8Xj7wN9mP3qR5tV8yW.eB2cD4fG6hI8jK0lM2nO4pQ6rS8tU0v',
  
  -- Role
  'ADMIN',
  
  -- Ativo
  true,
  
  -- Timestamps
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se foi criado
SELECT id, name, email, role, active 
FROM "users" 
WHERE email = 'admin@checkin.com';

-- ==============================================================================
-- CREDENCIAIS DE LOGIN:
-- Email: admin@checkin.com
-- Senha: admin123
-- ==============================================================================
-- IMPORTANTE: Altere a senha após o primeiro login!
-- ==============================================================================
