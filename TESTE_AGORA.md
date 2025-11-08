# 🎯 Teste o Sistema Agora!

## 📊 Status Atual: Sistema 70% Completo

### ✅ O que ESTÁ funcionando:
- Login com autenticação
- Dashboard com estatísticas
- Gestão completa de Usuários (Admin)
- Gestão completa de Eventos (Admin/Gestor)
- Navbar responsiva com níveis de acesso
- Proteção de rotas por permissão

### ⏳ O que FALTA implementar:
- Gestão de Participantes com QR Code
- Scanner de QR Code
- Sistema de Relatórios

---

## 🚀 Como Testar AGORA:

### 1. Configure o ambiente (se ainda não fez)

```bash
# Crie o arquivo .env na raiz
cat > .env << EOF
DATABASE_URL="postgresql://admin:admin123@localhost:5432/checkin_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="minha-chave-secreta-super-secreta-2024"
EOF
```

### 2. Inicie o banco de dados

```bash
# Inicia o PostgreSQL no Docker
npm run docker:up

# Aguarde 5 segundos para o banco inicializar
sleep 5

# Sincroniza o schema
npm run prisma:push
```

### 3. Crie o usuário admin

```bash
node scripts/create-admin.js
```

**Credenciais criadas:**
- 📧 Email: `admin@checkin.com`
- 🔒 Senha: `admin123`

### 4. Inicie o servidor

```bash
npm run dev
```

### 5. Acesse o sistema

Abra seu navegador em: **http://localhost:3000**

---

## 🧪 Roteiro de Testes:

### Teste 1: Login ✅
1. Acesse http://localhost:3000
2. Você será redirecionado para `/login`
3. Use as credenciais:
   - Email: `admin@checkin.com`
   - Senha: `admin123`
4. Clique em "Entrar"
5. Você deve ser redirecionado para o Dashboard

**Resultado esperado:** Login bem-sucedido e acesso ao dashboard

---

### Teste 2: Dashboard ✅
1. Após o login, você verá o dashboard principal
2. Observe:
   - Estatísticas (eventos, participantes, check-ins, usuários)
   - Cards com ações rápidas
   - Informações do seu nível de acesso (ADMIN)

**Resultado esperado:** Dashboard carregando com 0 em todas as estatísticas

---

### Teste 3: Criar Usuários (Admin) ✅

#### 3.1 - Criar um Gestor
1. Clique em "Usuários" na navbar
2. Clique no botão "Novo Usuário"
3. Preencha:
   - Nome: `João Gestor`
   - Email: `gestor@checkin.com`
   - Senha: `gestor123`
   - Nível de Acesso: `GESTOR`
4. Clique em "Criar"

**Resultado esperado:** Usuário criado e aparece na lista

#### 3.2 - Criar um Operador
1. Clique novamente em "Novo Usuário"
2. Preencha:
   - Nome: `Maria Operadora`
   - Email: `operador@checkin.com`
   - Senha: `operador123`
   - Nível de Acesso: `OPERADOR`
3. Clique em "Criar"

**Resultado esperado:** Segundo usuário criado

#### 3.3 - Editar um Usuário
1. Clique no botão de editar (ícone de lápis) do Gestor
2. Altere o nome para `João Silva Gestor`
3. Clique em "Atualizar"

**Resultado esperado:** Nome atualizado na lista

---

### Teste 4: Criar Eventos ✅

#### 4.1 - Criar primeiro evento
1. Clique em "Eventos" na navbar
2. Clique em "Novo Evento"
3. Preencha:
   - Nome: `Conferência Tech 2024`
   - Descrição: `Grande conferência de tecnologia`
   - Local: `Centro de Convenções`
   - Data/Hora Início: Selecione uma data futura
   - Data/Hora Fim: Selecione 3 horas após o início
   - Capacidade: `100`
4. Clique em "Criar"

**Resultado esperado:** Evento aparece como card na grid

#### 4.2 - Criar mais eventos
Crie mais 2 eventos:

**Evento 2:**
- Nome: `Workshop de Next.js`
- Descrição: `Aprenda Next.js na prática`
- Local: `Sala 101 - Coworking`
- Capacidade: `30`

**Evento 3:**
- Nome: `Meetup de Desenvolvedores`
- Descrição: `Networking e troca de experiências`
- Local: `Café Central`
- Capacidade: `50`

**Resultado esperado:** 3 eventos exibidos em cards

#### 4.3 - Editar um evento
1. Clique em "Editar" em um dos eventos
2. Altere a capacidade
3. Clique em "Atualizar"

**Resultado esperado:** Capacidade atualizada no card

---

### Teste 5: Testar Níveis de Acesso ✅

#### 5.1 - Testar como Gestor
1. Saia do sistema (botão "Sair")
2. Faça login como Gestor:
   - Email: `gestor@checkin.com`
   - Senha: `gestor123`
3. Observe a navbar:
   - ✅ Tem acesso: Scanner, Eventos, Participantes, Relatórios
   - ❌ NÃO tem acesso: Usuários

**Resultado esperado:** Menu adaptado ao nível de acesso

#### 5.2 - Testar como Operador
1. Saia e faça login como Operador:
   - Email: `operador@checkin.com`
   - Senha: `operador123`
2. Observe a navbar:
   - ✅ Tem acesso: Apenas Scanner
   - ❌ NÃO tem acesso: Usuários, Eventos, Participantes, Relatórios

**Resultado esperado:** Apenas scanner disponível

---

### Teste 6: Responsividade ✅

#### 6.1 - Teste Mobile
1. Faça login como Admin
2. Redimensione a janela do navegador para tamanho mobile (< 768px)
3. Observe:
   - Menu hamburguer aparece
   - Navbar colapsa
   - Cards empilham verticalmente

**Resultado esperado:** Layout adaptado para mobile

#### 6.2 - Menu Mobile
1. Clique no menu hamburguer
2. Menu deve expandir mostrando todas as opções
3. Clique em uma opção
4. Menu deve fechar e navegar

**Resultado esperado:** Menu mobile funcional

---

## 📸 Screenshots que você deve ver:

### 1. Login
- Fundo com gradiente azul
- Logo com ícone de QR Code
- Card branco centralizado
- Campos de email e senha

### 2. Dashboard
- Navbar azul no topo com logo
- 4 cards de estatísticas (eventos, participantes, check-ins, usuários)
- Cards de ações rápidas
- Card "Sobre o Sistema"

### 3. Usuários (Admin)
- Lista de usuários com badges coloridas:
  - ADMIN: vermelho
  - GESTOR: azul
  - OPERADOR: verde
- Botões de editar e excluir
- Modal de criação/edição

### 4. Eventos
- Grid de 3 colunas (desktop)
- Cards com:
  - Nome do evento
  - Badge de status (Ativo/Inativo)
  - Descrição
  - Local com ícone
  - Data com ícone
  - Capacidade e contadores
  - Botões de editar e excluir

---

## 🐛 Resolução de Problemas:

### Erro: "Cannot connect to database"
```bash
# Verifica se o Docker está rodando
docker ps

# Se não estiver, inicie:
npm run docker:up
```

### Erro: "Prisma Client not generated"
```bash
npm run prisma:generate
npm run prisma:push
```

### Erro: "Admin already exists"
- Normal! O admin já foi criado
- Use as credenciais: admin@checkin.com / admin123

### Erro: "Port 3000 already in use"
```bash
# Use outra porta:
npm run dev -- -p 3001
# Acesse: http://localhost:3001
```

### Erro no Login: "Email ou senha inválidos"
- Verifique se criou o admin: `node scripts/create-admin.js`
- Confirme as credenciais: admin@checkin.com / admin123

---

## ✅ Checklist de Validação:

Marque conforme testa:

- [ ] ✅ Login funciona
- [ ] ✅ Dashboard carrega
- [ ] ✅ Criar usuário Admin funciona
- [ ] ✅ Criar usuário Gestor funciona
- [ ] ✅ Criar usuário Operador funciona
- [ ] ✅ Editar usuário funciona
- [ ] ✅ Excluir usuário funciona
- [ ] ✅ Criar evento funciona
- [ ] ✅ Editar evento funciona
- [ ] ✅ Excluir evento funciona
- [ ] ✅ Níveis de acesso funcionam (Admin vê tudo)
- [ ] ✅ Gestor não vê "Usuários"
- [ ] ✅ Operador só vê "Scanner"
- [ ] ✅ Layout mobile responsivo
- [ ] ✅ Menu mobile funciona
- [ ] ✅ Logout funciona

---

## 🎉 Próximas Features:

Aguarde a implementação de:
1. **Participantes** - Cadastro com QR Code
2. **Scanner** - Leitura de QR Code via câmera
3. **Relatórios** - Exportação para PDF/Excel

---

## 💡 Dicas:

1. **Use Chrome/Edge** para melhor compatibilidade
2. **Abra o DevTools** (F12) para ver logs
3. **Teste em janela anônima** para simular novo usuário
4. **Teste com múltiplos usuários** em abas diferentes

---

**Status**: Sistema pronto para testes! 🚀

**Tempo de configuração**: ~5 minutos
**Funcionalidades testáveis**: 70%
**Próxima entrega**: Scanner + Participantes + Relatórios
