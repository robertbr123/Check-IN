# 🔧 Configuração de Variáveis de Ambiente - Vercel

## ⚠️ PROBLEMA: Não Consigo Fazer Login

Se você não consegue fazer login, é porque as **variáveis de ambiente não estão configuradas no Vercel**.

---

## 📋 Passo a Passo para Configurar

### 1️⃣ Acesse o Dashboard da Vercel

1. Vá para: https://vercel.com/dashboard
2. Clique no seu projeto **Check-IN**
3. Clique em **Settings** (Configurações)
4. No menu lateral, clique em **Environment Variables**

---

### 2️⃣ Configure as Variáveis de Ambiente

Adicione as seguintes variáveis **UMA POR UMA**:

#### 🗄️ DATABASE_URL (Conexão com Neon)

```
DATABASE_URL
```
**Valor:**
```
postgresql://checkin:npg_GZ4rlxkgK5ay@ep-shy-rain-acoey5o0.sa-east-1.aws.neon.tech/checkdb?sslmode=require
```
- **Environment:** Production, Preview, Development (marque todas)

---

#### 🔐 NEXTAUTH_SECRET (Segredo do NextAuth)

```
NEXTAUTH_SECRET
```
**Valor:** Gere um segredo executando no terminal:
```bash
openssl rand -base64 32
```

Copie o resultado e cole como valor.

- **Environment:** Production, Preview, Development (marque todas)

---

#### 🌐 NEXTAUTH_URL (URL da Aplicação)

```
NEXTAUTH_URL
```
**Valor:** A URL do seu deploy na Vercel (exemplo):
```
https://check-in-robertbr123.vercel.app
```

⚠️ **IMPORTANTE:** Você precisa copiar a URL **EXATA** do seu deploy. Para descobrir:
1. Vá em **Deployments** no menu
2. Clique no deployment mais recente
3. Copie a URL que aparece no topo (exemplo: `https://check-in-xxx.vercel.app`)
4. Cole como valor de `NEXTAUTH_URL`

- **Environment:** Production, Preview, Development (marque todas)

---

#### 🎨 NEXT_PUBLIC_APP_URL (URL Pública)

```
NEXT_PUBLIC_APP_URL
```
**Valor:** A mesma URL do NEXTAUTH_URL
```
https://check-in-robertbr123.vercel.app
```

- **Environment:** Production, Preview, Development (marque todas)

---

#### 🏭 NODE_ENV

```
NODE_ENV
```
**Valor:**
```
production
```

- **Environment:** Production, Preview, Development (marque todas)

---

### 3️⃣ Redeploy da Aplicação

Após configurar **TODAS** as variáveis:

1. Vá em **Deployments**
2. Clique no deploy mais recente
3. Clique nos **3 pontinhos** (⋮)
4. Clique em **Redeploy**
5. Confirme clicando em **Redeploy** novamente

⏱️ Aguarde o deploy completar (1-2 minutos)

---

### 4️⃣ Verificar se Está Funcionando

Acesse no navegador:
```
https://sua-url-vercel.vercel.app/api/debug
```

Você deve ver algo como:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "userCount": 1
  },
  "environment": {
    "DATABASE_URL": true,
    "NEXTAUTH_URL": true,
    "NEXTAUTH_SECRET": true,
    "NODE_ENV": "production"
  }
}
```

✅ Se todos os valores são `true`, está configurado corretamente!

---

### 5️⃣ Testar o Login

1. Acesse: `https://sua-url-vercel.vercel.app/login`
2. Use as credenciais:
   - **Email:** `admin@checkin.com`
   - **Senha:** `admin123`

---

## 🐛 Se Ainda Não Funcionar

### Verificar os Logs

1. No Vercel, vá em **Deployments**
2. Clique no deploy ativo
3. Clique em **Functions**
4. Procure por erros relacionados a `DATABASE_URL` ou `NEXTAUTH`

### Problemas Comuns

#### ❌ Erro: "Invalid `prisma.user.findUnique()`"
**Solução:** DATABASE_URL não está configurada ou está incorreta

#### ❌ Erro: "[next-auth][error][NO_SECRET]"
**Solução:** NEXTAUTH_SECRET não está configurada

#### ❌ Erro: "CSRF token mismatch"
**Solução:** NEXTAUTH_URL não está configurada ou está com URL errada

---

## 📝 Resumo das Variáveis

| Variável | Onde conseguir o valor |
|----------|------------------------|
| `DATABASE_URL` | Connection string do Neon (já fornecida acima) |
| `NEXTAUTH_SECRET` | Gerar com: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL do deploy na Vercel |
| `NEXT_PUBLIC_APP_URL` | Mesma URL do NEXTAUTH_URL |
| `NODE_ENV` | `production` |

---

## 🆘 Precisa de Ajuda?

Se ainda estiver com problemas:

1. Acesse `/api/debug` e me mostre o resultado
2. Verifique os logs no Vercel (Functions)
3. Confirme que todas as 5 variáveis estão configuradas
4. Confirme que fez o redeploy após adicionar as variáveis

---

**Última atualização:** 8 de novembro de 2025
