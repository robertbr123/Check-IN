# 🚀 Configuração SEM Docker (PostgreSQL Local)

## ✅ Passo a Passo:

### 1. Instalar PostgreSQL (aguarde a instalação terminar)

```bash
brew install postgresql@15
```

### 2. Iniciar o serviço do PostgreSQL

```bash
brew services start postgresql@15
```

### 3. Criar o banco de dados e usuário

```bash
# Criar o banco
createdb checkin_db

# Criar usuário admin
psql postgres -c "CREATE USER admin WITH PASSWORD 'admin123' SUPERUSER;"

# Dar permissões
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE checkin_db TO admin;"
```

### 4. Criar o arquivo .env

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://admin:admin123@localhost:5432/checkin_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="minha-chave-secreta-super-secreta-2024"
EOF
```

### 5. Configurar o Prisma

```bash
npm run prisma:push
```

### 6. Criar o usuário admin do sistema

```bash
node scripts/create-admin.js
```

### 7. Iniciar o servidor

```bash
npm run dev
```

### 8. Acessar o sistema

Abra: http://localhost:3000

**Login:**
- Email: `admin@checkin.com`
- Senha: `admin123`

---

## 🛑 Comandos Úteis:

### Parar o PostgreSQL
```bash
brew services stop postgresql@15
```

### Reiniciar o PostgreSQL
```bash
brew services restart postgresql@15
```

### Ver status do PostgreSQL
```bash
brew services list | grep postgres
```

### Conectar ao banco diretamente
```bash
psql -U admin -d checkin_db
```

### Resetar o banco (se precisar)
```bash
dropdb checkin_db
createdb checkin_db
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE checkin_db TO admin;"
npm run prisma:push
node scripts/create-admin.js
```

---

## 🎉 Pronto!

Agora você pode usar o sistema sem Docker!

**Próximos passos**: Siga o guia em `TESTE_AGORA.md`
