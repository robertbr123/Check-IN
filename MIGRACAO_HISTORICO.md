# 🔄 Migração do Modelo de Dados - Histórico de Participantes

## 📊 Mudanças no Modelo

### ❌ Modelo Antigo (Problema)
- Participante vinculado a **UM único evento**
- Ao excluir evento → participante é excluído (**SEM histórico**)
- Mesmo participante em eventos diferentes = **cadastros duplicados**

### ✅ Novo Modelo (Solução)
- **Participante** = cadastro único da pessoa (por email)
- **EventParticipant** = inscrição do participante em um evento
- Um participante pode estar em **múltiplos eventos**
- Ao excluir evento → participante **mantém histórico**
- QR Code gerado por inscrição (não por pessoa)

---

## 🏗️ Nova Estrutura

### Participant (Pessoa)
```
- id, name, email (único), phone, document
- company, position, photoUrl
- active, createdAt, updatedAt
```
**Uma pessoa = um registro**

### EventParticipant (Inscrição)
```
- id, participantId, eventId
- qrCode (único por inscrição)
- status (CONFIRMED, CANCELLED, ATTENDED)
- registeredAt, updatedAt
```
**Uma pessoa pode ter várias inscrições**

### CheckIn
```
- Agora vinculado ao EventParticipant (não ao Participant)
- Mantém histórico de check-ins por inscrição
```

---

## 🚀 Como Migrar (IMPORTANTE)

### ⚠️ ATENÇÃO: Isso vai modificar o banco de dados!

Esta migração vai:
1. ✅ Consolidar participantes duplicados (por email)
2. ✅ Manter todos os QR Codes existentes
3. ✅ Preservar todo histórico de check-ins
4. ✅ Manter vínculo com eventos

### Opção 1: Reset Completo (Desenvolvimento/Teste)

Se você está em **desenvolvimento** e **NÃO tem dados importantes**:

```bash
# 1. Reset do banco (APAGA TUDO!)
npx prisma migrate reset --force

# 2. Criar novo schema
npx prisma db push

# 3. Recriar admin
node scripts/create-admin.js
```

### Opção 2: Migração com Preservação de Dados (Produção)

Se você já tem **dados importantes no Neon**:

#### Passo 1: Backup
```bash
# Via Neon Console
# 1. Acesse: https://console.neon.tech
# 2. Seu projeto → Databases → checkdb
# 3. Clique em "..." → Export database
```

#### Passo 2: Executar Migração Manual

**No SQL Editor do Neon:**
1. Acesse: https://console.neon.tech
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo: `prisma/migrations/manual_migration_history.sql`
4. Execute

#### Passo 3: Sincronizar Prisma
```bash
# Gera o Prisma Client com novo schema
npx prisma generate
```

#### Passo 4: Deploy
```bash
# Commit e push
git add .
git commit -m "feat: migração para modelo com histórico de participantes"
git push

# Vercel vai fazer redeploy automaticamente
```

---

## 🔧 Ajustes no Código

Após a migração, será necessário atualizar:

### 1. API de Participantes
- Criar participante único (se não existir)
- Criar EventParticipant (inscrição)
- Gerar QR Code por inscrição

### 2. API de Check-in
- Buscar por EventParticipant (não Participant)
- Validar QR Code de EventParticipant

### 3. Dashboard
- Listar inscrições (EventParticipant)
- Mostrar histórico de eventos por participante

---

## 📝 Exemplos de Uso

### Cadastrar Participante em Evento
```typescript
// 1. Buscar ou criar participante
const participant = await prisma.participant.upsert({
  where: { email: "joao@email.com" },
  update: { name, phone, company, position },
  create: { name, email, phone, company, position }
})

// 2. Criar inscrição no evento
const eventParticipant = await prisma.eventParticipant.create({
  data: {
    participantId: participant.id,
    eventId: eventId,
    qrCode: generateQRCode(),
    status: "CONFIRMED"
  }
})
```

### Listar Participantes de um Evento
```typescript
const eventParticipants = await prisma.eventParticipant.findMany({
  where: { eventId },
  include: {
    participant: true,
    checkIns: true
  }
})
```

### Listar Eventos de um Participante
```typescript
const participantEvents = await prisma.eventParticipant.findMany({
  where: { 
    participant: { email: "joao@email.com" }
  },
  include: {
    event: true,
    checkIns: true
  }
})
```

---

## ✅ Benefícios do Novo Modelo

1. **📊 Histórico Completo**
   - Participante nunca é perdido
   - Histórico de todos os eventos
   - Histórico de todos os check-ins

2. **🎯 Cadastro Único**
   - Email único por pessoa
   - Dados sempre atualizados
   - Sem duplicação

3. **🔒 Integridade**
   - Eventos não deletam participantes
   - Check-ins vinculados à inscrição
   - Dados consistentes

4. **📈 Relatórios Melhores**
   - Participantes recorrentes
   - Taxa de comparecimento por pessoa
   - Análise de engajamento

---

## 🆘 Se Algo Der Errado

### Restaurar Backup (Neon)
1. Acesse: https://console.neon.tech
2. Vá em Databases → Restore
3. Selecione o backup anterior

### Reverter Migration (Local)
```bash
# Se usou migrate reset
git checkout HEAD~1 prisma/schema.prisma
npx prisma db push --force-reset
```

---

## 📞 Próximos Passos

Após executar a migração:
1. ✅ Verificar se dados foram migrados corretamente
2. ✅ Testar cadastro de novo participante
3. ✅ Testar check-in com QR Code existente
4. ✅ Verificar relatórios

---

**Última atualização:** 9 de novembro de 2025

**Status:** ⚠️ AGUARDANDO CONFIRMAÇÃO PARA EXECUTAR MIGRAÇÃO
