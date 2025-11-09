# 📧 Configuração de Email (SMTP) - Envio de QR Codes

## ⚠️ PROBLEMA: Email com QR Code Não Está Sendo Enviado

Para enviar emails com QR Codes aos participantes, você precisa configurar um servidor SMTP.

---

## 🎯 Opção 1: Gmail (Recomendado)

### Passo 1: Criar uma Senha de App no Gmail

1. **Acesse sua conta Google:**
   - https://myaccount.google.com

2. **Ative a verificação em 2 etapas:**
   - Vá em **Segurança**
   - Procure por **Verificação em duas etapas**
   - Ative se ainda não estiver ativada

3. **Gere uma Senha de App:**
   - Vá em **Segurança** → **Verificação em duas etapas**
   - Role até o final e clique em **Senhas de app**
   - Selecione:
     - App: **Email**
     - Dispositivo: **Outro (nome personalizado)**
   - Digite: **Check-IN System**
   - Clique em **Gerar**
   - **COPIE A SENHA** (são 16 caracteres sem espaços)

### Passo 2: Configurar no Vercel

Adicione estas variáveis de ambiente no Vercel:

1. **Acesse:** https://vercel.com/dashboard
2. **Projeto Check-IN** → **Settings** → **Environment Variables**
3. **Adicione cada variável:**

#### SMTP_HOST
```
SMTP_HOST
```
**Valor:**
```
smtp.gmail.com
```

#### SMTP_PORT
```
SMTP_PORT
```
**Valor:**
```
587
```

#### SMTP_SECURE
```
SMTP_SECURE
```
**Valor:**
```
false
```

#### SMTP_USER
```
SMTP_USER
```
**Valor:** Seu email completo do Gmail
```
seu-email@gmail.com
```

#### SMTP_PASS
```
SMTP_PASS
```
**Valor:** A senha de app que você copiou (16 caracteres)
```
abcd efgh ijkl mnop
```
⚠️ **Cole SEM espaços:** `abcdefghijklmnop`

#### SMTP_FROM
```
SMTP_FROM
```
**Valor:** Email que aparecerá como remetente
```
noreply@checkin.com
```
Ou use o mesmo email do SMTP_USER:
```
seu-email@gmail.com
```

---

## 🎯 Opção 2: Outros Provedores

### Outlook/Hotmail

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM=seu-email@outlook.com
```

### SendGrid

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-aqui
SMTP_FROM=noreply@seu-dominio.com
```

### Mailgun

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha-mailgun
SMTP_FROM=noreply@seu-dominio.com
```

---

## 🧪 Testar Configuração

Após configurar as variáveis no Vercel:

### 1. Redeploy
1. **Deployments** → Último deploy → **⋮** → **Redeploy**

### 2. Verificar Configuração
Acesse:
```
https://sua-url.vercel.app/api/test-email
```

Deve retornar:
```json
{
  "success": true,
  "message": "Configuração de email válida",
  "environment": {
    "SMTP_HOST": true,
    "SMTP_PORT": true,
    "SMTP_USER": true,
    "SMTP_PASS": true,
    "SMTP_FROM": true
  }
}
```

### 3. Enviar Email de Teste
1. **Cadastre um participante** com seu próprio email
2. **Clique no botão de enviar QR Code**
3. **Verifique sua caixa de entrada** (e spam)

---

## 🐛 Problemas Comuns

### ❌ "Invalid login: 535-5.7.8 Username and Password not accepted"
**Solução:** 
- Certifique-se de usar uma **Senha de App**, não sua senha normal do Gmail
- Verifique se a verificação em 2 etapas está ativada

### ❌ "self signed certificate in certificate chain"
**Solução:**
- Verifique se `SMTP_SECURE=false` para porta 587
- Use `SMTP_SECURE=true` apenas para porta 465

### ❌ Email não chega
**Solução:**
- Verifique a pasta de **Spam**
- Confirme que o email do participante está correto
- Verifique os logs no Vercel → Functions

### ❌ "Greeting never received"
**Solução:**
- Verifique se o `SMTP_HOST` está correto
- Tente usar porta 465 com `SMTP_SECURE=true`

---

## 📋 Resumo das Variáveis

| Variável | Gmail | Obrigatória |
|----------|-------|-------------|
| `SMTP_HOST` | smtp.gmail.com | ✅ Sim |
| `SMTP_PORT` | 587 | ✅ Sim |
| `SMTP_SECURE` | false | ✅ Sim |
| `SMTP_USER` | seu-email@gmail.com | ✅ Sim |
| `SMTP_PASS` | senha de app (16 chars) | ✅ Sim |
| `SMTP_FROM` | noreply@checkin.com | ✅ Sim |

---

## ✅ Depois de Configurado

Com o email configurado, você poderá:

1. ✅ **Enviar QR Codes** automaticamente ao cadastrar participantes
2. ✅ **Reenviar QR Codes** para participantes que perderam
3. ✅ **Emails personalizados** com informações do evento
4. ✅ **Design profissional** nos emails

---

## 🆘 Precisa de Ajuda?

1. Acesse `/api/test-email` e me mostre o resultado
2. Verifique os logs no Vercel (Functions) após tentar enviar
3. Confirme que todas as 6 variáveis SMTP estão configuradas
4. Confirme que fez o redeploy após adicionar as variáveis

---

**Última atualização:** 9 de novembro de 2025
