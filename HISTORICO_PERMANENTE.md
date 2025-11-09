# 📚 Sistema de Histórico Permanente

## 🎯 Objetivo

O sistema Check-IN agora mantém **histórico completo e permanente** de todos os dados:
- ✅ Participantes nunca são excluídos
- ✅ Inscrições em eventos são preservadas
- ✅ Check-ins ficam registrados para sempre
- ✅ Eventos excluídos mantêm todo o histórico

## 🗄️ Modelo de Dados

### 1. **Participant** (Pessoa Física)
```prisma
model Participant {
  id        String   @id
  name      String
  email     String   @unique
  phone     String?
  document  String?
  company   String?
  position  String?
  active    Boolean  @default(true)
  
  eventParticipants EventParticipant[] // Todas as inscrições
}
```

**Características:**
- ✅ **Nunca é excluído** do banco de dados
- ✅ Identificado unicamente por email
- ✅ Pode se inscrever em múltiplos eventos
- ✅ Mantém histórico completo de participação

### 2. **EventParticipant** (Inscrição em Evento)
```prisma
model EventParticipant {
  id            String
  participantId String
  eventId       String
  qrCode        String   @unique
  status        String   // CONFIRMED, CANCELLED, ATTENDED
  registeredAt  DateTime
  
  participant Participant
  event       Event
  checkIns    CheckIn[]
}
```

**Características:**
- ✅ **Nunca é excluído**, apenas marcado como CANCELLED
- ✅ Cada inscrição tem seu próprio QR Code único
- ✅ Mesmo participante pode ter múltiplas inscrições (eventos diferentes)
- ✅ Preservado mesmo quando evento é excluído

**Status possíveis:**
- `CONFIRMED` - Inscrição confirmada e ativa
- `CANCELLED` - Inscrição cancelada (soft delete)
- `ATTENDED` - Participante compareceu ao evento

### 3. **Event** (Evento)
```prisma
model Event {
  id          String
  name        String
  location    String
  startDate   DateTime
  endDate     DateTime
  active      Boolean
  deletedAt   DateTime?  // Soft delete
  
  eventParticipants EventParticipant[]
  checkIns          CheckIn[]
}
```

**Características:**
- ✅ **Soft Delete** - quando "excluído", apenas marca `deletedAt`
- ✅ Não aparece em listagens após exclusão
- ✅ Todo o histórico é preservado (inscrições e check-ins)
- ✅ Pode ser restaurado se necessário

### 4. **CheckIn** (Registro de Presença)
```prisma
model CheckIn {
  id                 String
  eventParticipantId String
  eventId            String
  checkInTime        DateTime
  checkOutTime       DateTime?
  status             CheckInStatus
  
  eventParticipant EventParticipant
  event            Event
}
```

**Características:**
- ✅ **Nunca é excluído**
- ✅ Registra entrada e saída
- ✅ Mantém histórico completo mesmo após exclusão do evento

## 🔄 Fluxo de Dados

### Cadastro de Participante em Evento

```typescript
// 1. Busca ou cria o participante (upsert)
const participant = await prisma.participant.upsert({
  where: { email: "joao@example.com" },
  update: { name, phone, ... },
  create: { name, email, phone, ... }
})

// 2. Cria inscrição no evento com QR Code único
const eventParticipant = await prisma.eventParticipant.create({
  data: {
    participantId: participant.id,
    eventId: "evento-123",
    qrCode: generateQRCode(),
    status: "CONFIRMED"
  }
})
```

### "Exclusão" de Participante

```typescript
// Não exclui! Apenas marca como CANCELLED
await prisma.eventParticipant.update({
  where: { id: eventParticipantId },
  data: { status: "CANCELLED" }
})

// Participante e CheckIns são preservados!
```

### "Exclusão" de Evento

```typescript
// Soft delete - apenas marca quando foi excluído
await prisma.event.update({
  where: { id: eventId },
  data: {
    deletedAt: new Date(),
    active: false
  }
})

// Todas as inscrições e check-ins são preservados!
```

### Check-in no Evento

```typescript
// Scanner lê QR Code e registra presença
const checkIn = await prisma.checkIn.create({
  data: {
    eventParticipantId: "ep-123",
    eventId: "evento-123",
    checkInTime: new Date(),
    status: "CHECKED_IN"
  }
})

// Check-in fica registrado para sempre
```

## 📊 Histórico Completo do Participante

### Endpoint: `/api/participants/history/[participantId]`

Retorna histórico completo de um participante:

```json
{
  "participant": {
    "id": "p-123",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 98765-4321",
    "company": "Empresa XYZ"
  },
  "stats": {
    "totalEvents": 5,
    "confirmedEvents": 3,
    "cancelledEvents": 1,
    "attendedEvents": 4,
    "totalCheckIns": 8
  },
  "history": [
    {
      "id": "ep-1",
      "qrCode": "QR-ABC123",
      "status": "CONFIRMED",
      "registeredAt": "2025-01-15T10:00:00Z",
      "event": {
        "name": "Conferência Tech 2025",
        "location": "São Paulo",
        "deletedAt": null  // Evento ainda ativo
      },
      "checkIns": [
        {
          "checkInTime": "2025-01-15T08:30:00Z",
          "checkOutTime": "2025-01-15T18:00:00Z",
          "status": "CHECKED_OUT"
        }
      ]
    },
    {
      "id": "ep-2",
      "qrCode": "QR-XYZ789",
      "status": "CANCELLED",
      "registeredAt": "2024-12-10T14:00:00Z",
      "event": {
        "name": "Workshop DevOps",
        "location": "Rio de Janeiro",
        "deletedAt": "2024-12-20T10:00:00Z"  // Evento foi excluído
      },
      "checkIns": []  // Não compareceu
    }
  ]
}
```

## 🎨 Visualização no Frontend

### Lista de Participantes
- ✅ Mostra todas as inscrições ativas (status ≠ CANCELLED)
- ✅ Exibe badge com nome do evento
- ✅ Filtra por nome, email, empresa
- ✅ Filtra por evento específico

### Detalhes do Participante (Futuro)
- 📋 Histórico completo de eventos
- 📊 Estatísticas de participação
- ✅ Todos os check-ins realizados
- 📅 Linha do tempo de atividades

## 🔍 Consultas Úteis

### Ver histórico completo mesmo de eventos excluídos:
```typescript
const allRegistrations = await prisma.eventParticipant.findMany({
  where: { participantId: "p-123" },
  include: {
    event: true,      // Inclui eventos excluídos
    checkIns: true    // Inclui todos os check-ins
  }
})
```

### Ver apenas inscrições ativas:
```typescript
const activeRegistrations = await prisma.eventParticipant.findMany({
  where: {
    participantId: "p-123",
    status: "CONFIRMED",
    event: { deletedAt: null }
  }
})
```

### Ver participantes que compareceram:
```typescript
const attended = await prisma.eventParticipant.findMany({
  where: {
    eventId: "evento-123",
    checkIns: { some: {} }  // Tem pelo menos 1 check-in
  }
})
```

## ✅ Benefícios do Sistema

1. **Auditoria Completa**
   - Rastreamento de todas as ações
   - Histórico nunca é perdido
   - Possibilidade de restauração

2. **Análise de Dados**
   - Relatórios históricos precisos
   - Análise de comportamento de participantes
   - Taxa de comparecimento por evento

3. **Conformidade Legal**
   - Mantém registros para fins legais
   - LGPD: dados podem ser anonimizados mas não perdidos
   - Histórico de transações preservado

4. **Experiência do Usuário**
   - Participante recadastrado = dados preservados
   - Mesmo email = mesmo perfil
   - Histórico visível em um só lugar

## 🚀 Próximos Passos

- [ ] Interface de visualização de histórico do participante
- [ ] Dashboard com estatísticas históricas
- [ ] Relatórios de participação ao longo do tempo
- [ ] Exportação de histórico completo
- [ ] Restauração de eventos excluídos (se necessário)
