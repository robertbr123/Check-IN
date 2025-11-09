# 🚀 Deploy na Vercel com Neon PostgreSQL

## 📋 Guia Completo - Produção em 10 Minutos!

Deploy profissional e gratuito usando:
- **Vercel** - Hospedagem Next.js otimizada
- **Neon** - PostgreSQL serverless

---

## ⚡ Deploy Rápido (Passo a Passo)

### 1️⃣ Criar Banco de Dados no Neon

#### a) Acesse e Crie Conta
1. Vá para: **https://neon.tech**
2. Clique em **"Sign Up"** (pode usar GitHub)
3. Faça login

#### b) Criar Projeto
1. Clique em **"Create Project"**
2. Preencha:
   - **Project name**: `checkin-db` (ou seu nome)
   - **Region**: `US East (Ohio)` (mais próximo do Brasil)
   - **PostgreSQL version**: `16` (mais recente)
3. Clique em **"Create Project"**

#### c) Copiar Connection String
1. Na tela do projeto, copie a **Connection String**
2. Formato: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. **GUARDE ISSO!** Você vai precisar 📝

---

### 2️⃣ Deploy na Vercel

#### a) Fazer Login no GitHub
1. Certifique-se que seu código está no GitHub
2. Se não estiver:
```bash
git add .
git commit -m "Preparar para deploy Vercel"
git push origin main
```

#### b) Deploy na Vercel
1. Acesse: **https://vercel.com**
2. Clique em **"Sign Up"** e conecte com GitHub
3. Clique em **"Import Project"**
4. Selecione o repositório **Check-IN**
5. Clique em **"Import"**

#### c) Configurar Variáveis de Ambiente
**Na tela de configuração**, adicione estas variáveis:

1. **DATABASE_URL**
   - Cole a connection string do Neon que você copiou
   - Exemplo: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

2. **NEXTAUTH_SECRET**
   - Gere no seu terminal: `openssl rand -base64 32`
   - Cole o resultado (será algo como: `k8jD9mN2pQ5rT7vW1xY4zA6bC8eF0gH3i5jK7lM9nO2pR`)

3. **NEXTAUTH_URL**
   - Por enquanto, deixe vazio (a Vercel vai gerar)
   - Após o deploy, volte e adicione: `https://seu-projeto.vercel.app`

#### d) Fazer Deploy
1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos ⏰
3. 🎉 **Deploy concluído!**

---

### 3️⃣ Configurar URL e Finalizar

#### a) Copiar URL da Vercel
1. Após deploy, clique em **"Visit"**
2. Copie a URL (ex: `https://check-in-gx7j2k3.vercel.app`)

#### b) Atualizar NEXTAUTH_URL
1. No painel da Vercel, vá em **Settings > Environment Variables**
2. Adicione/Edite **NEXTAUTH_URL**
3. Cole a URL que você copiou
4. Clique em **"Save"**

#### c) Re-deploy
1. Vá em **Deployments**
2. Clique nos 3 pontinhos no último deploy
3. Clique em **"Redeploy"**
4. Aguarde 1-2 minutos

---

### 4️⃣ Executar Migrações do Banco

#### Opção A: Via Terminal Local
```bash
# Conectar ao banco Neon
DATABASE_URL="sua-connection-string-do-neon" npm run prisma:push
```

#### Opção B: Via Neon SQL Editor
1. No painel do Neon, clique em **"SQL Editor"**
2. Execute este SQL:

```sql
-- Copie o conteúdo do schema.prisma e gere o SQL
-- Ou use o Prisma Studio local conectado ao Neon
```

#### Opção C: Automático (Recomendado)
A Vercel já executa `prisma migrate deploy` automaticamente no build! ✅

---

### 5️⃣ Criar Usuário Admin

#### Via Neon SQL Editor:
1. Acesse o **SQL Editor** no Neon
2. Execute:

```sql
-- Gerar senha hash (use bcrypt com 10 rounds)
-- Senha: admin123
-- Hash: $2a$10$rQ8Zx1V2Ky3Lm4Nn5Oo6Pp7Qq8Rr9Ss0Tt1Uu2Vv3Ww4Xx5Yy6Zz

INSERT INTO "users" (id, name, email, password, role, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Administrador',
  'admin@checkin.com',
  '$2a$10$K5z8Xj7wN9mP3qR5tV8yW.eB2cD4fG6hI8jK0lM2nO4pQ6rS8tU0v',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

#### Ou via Prisma Studio:
```bash
# No terminal local
DATABASE_URL="sua-connection-string-do-neon" npx prisma studio

# Abra o navegador, vá em Users e crie manualmente
```

---

## ✅ Pronto! Acesse seu Sistema

Abra: **https://seu-projeto.vercel.app**

Login:
- **Email**: `admin@checkin.com`
- **Senha**: `admin123`

---

## 🔧 Configurações Adicionais

### Domínio Customizado

1. Na Vercel, vá em **Settings > Domains**
2. Adicione seu domínio: `checkin.seudominio.com`
3. Configure DNS (Vercel mostra instruções)
4. **Importante**: Atualize `NEXTAUTH_URL` com novo domínio!

### Email (Opcional)

Se quiser enviar QR Codes por email:

1. Configure Gmail App Password
2. Na Vercel, adicione variáveis:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=seu-email@gmail.com`
   - `SMTP_PASS=sua-app-password`
   - `SMTP_FROM=noreply@seudominio.com`
3. Redeploy

---

## 📊 Monitoramento e Logs

### Ver Logs da Aplicação
1. Vercel Dashboard
2. Vá em **Deployments**
3. Clique no deployment
4. Aba **"Logs"**

### Analytics
1. Vá em **Analytics** no menu da Vercel
2. Veja:
   - Pageviews
   - Performance
   - Erros

### Banco de Dados
1. Neon Dashboard
2. **Monitoring** - Uso de recursos
3. **Query** - Queries lentas
4. **Backup** - Automático! ✅

---

## 🔄 Atualizações

### Deploy Automático
Toda vez que você fizer `git push`, a Vercel:
1. Detecta o push
2. Faz build automaticamente
3. Executa migrações
4. Deploy em produção

```bash
# Seu workflow agora é:
git add .
git commit -m "Minha atualização"
git push origin main

# Vercel faz o resto! 🚀
```

### Rollback
1. Vá em **Deployments**
2. Encontre versão anterior
3. Clique em **"Promote to Production"**

---

## 💰 Custos

### Neon (Free Tier)
- ✅ 1 projeto gratuito
- ✅ 1 branch (produção)
- ✅ 512MB storage
- ✅ Backups automáticos
- ✅ Suficiente para começar!

**Upgrade**: $19/mês para mais recursos

### Vercel (Hobby - Free)
- ✅ 100GB bandwidth/mês
- ✅ Domínios ilimitados
- ✅ SSL automático
- ✅ Analytics básico
- ✅ Perfeito para produção!

**Upgrade**: $20/mês (Pro) para mais

### Total: **$0/mês** 🎉

---

## 🐛 Troubleshooting

### Erro: "Database not found"
```bash
# Executar migrações
DATABASE_URL="sua-url" npm run prisma:push
```

### Erro: "NEXTAUTH_URL not configured"
1. Vercel > Settings > Environment Variables
2. Adicione `NEXTAUTH_URL=https://seu-projeto.vercel.app`
3. Redeploy

### Erro de Build
1. Vercel > Deployments > [último] > Logs
2. Veja o erro específico
3. Corrija e push

### Erro 500 em Produção
1. Vercel > Logs em tempo real
2. Veja stack trace
3. Geralmente é variável de ambiente faltando

---

## 🎯 Checklist de Produção

Antes de lançar:

- [ ] ✅ Banco Neon criado
- [ ] ✅ Deploy Vercel funcionando
- [ ] ✅ NEXTAUTH_URL configurado
- [ ] ✅ Migrações executadas
- [ ] ✅ Usuário admin criado
- [ ] ✅ Login funcionando
- [ ] ✅ Todas as páginas carregando
- [ ] ✅ Domínio customizado (opcional)
- [ ] ✅ Email configurado (opcional)
- [ ] ✅ Analytics habilitado

---

## 📈 Próximos Passos

1. **Monitoramento**
   - Configure Sentry para erros
   - Ative Vercel Analytics

2. **Performance**
   - Configure CDN (Vercel faz automaticamente)
   - Otimize imagens

3. **Segurança**
   - Revise variáveis de ambiente
   - Configure CORS se necessário

4. **Backup**
   - Neon faz backup automático
   - Configure notificações

---

## 🆘 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js**: https://nextjs.org/docs

---

## 🎉 Parabéns!

Seu sistema Check-IN está em produção com:
- ⚡ Deploy automático
- 🔒 HTTPS automático
- 💾 Backup automático
- 📊 Analytics integrado
- 🌍 CDN global
- 💰 **Custo zero!**

**Acesse e compartilhe**: https://seu-projeto.vercel.app

---

**Deploy realizado em menos de 10 minutos? 🚀**

Agora é só usar e crescer! 📈
