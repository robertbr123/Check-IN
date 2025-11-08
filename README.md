# 🎫 Check-IN System

Sistema completo de gerenciamento de check-in para eventos com autenticação, níveis de acesso, geração de QR codes e relatórios.

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL (Docker)
- **ORM**: Prisma
- **Autenticação**: NextAuth.js
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **QR Code**: qrcode, html5-qrcode

## 📋 Funcionalidades

### ✅ Autenticação
- Sistema de login seguro
- Níveis de acesso (Admin, Gestor, Operador)
- Admin pode cadastrar novos usuários

### 👥 Gestão de Usuários
- CRUD completo de usuários
- Controle de status (ativo/inativo)
- Histórico de criação

### 📅 Gestão de Eventos
- CRUD completo de eventos
- Informações: nome, descrição, local, data/hora, capacidade
- Controle de status

### 👤 Gestão de Participantes
- Cadastro completo com foto
- Geração automática de QR code único
- Campos: nome, email, telefone, documento, empresa, cargo
- Vínculo com eventos

### 📱 Scanner de QR Code
- Leitura via câmera
- Check-in e check-out automático
- Validação em tempo real
- Registro de horários

### 📊 Relatórios
- Participantes por evento
- Taxa de presença
- Histórico de check-ins
- Exportação PDF/Excel

## 🛠️ Instalação

### 1. Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

### 2. Clone o repositório

\`\`\`bash
git clone <seu-repositorio>
cd Check-IN
\`\`\`

### 3. Instale as dependências

\`\`\`bash
npm install
\`\`\`

### 4. Configure as variáveis de ambiente

\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo `.env` e configure:
- `DATABASE_URL`: URL do banco de dados
- `NEXTAUTH_SECRET`: Gere uma chave secreta (pode usar: `openssl rand -base64 32`)

### 5. Inicie o banco de dados

\`\`\`bash
npm run docker:up
\`\`\`

### 6. Configure o Prisma

\`\`\`bash
# Gerar o client do Prisma
npm run prisma:generate

# Criar as tabelas no banco
npm run prisma:push
\`\`\`

### 7. Crie o usuário admin

Execute o script para criar o primeiro usuário administrador:

\`\`\`bash
node scripts/create-admin.js
\`\`\`

**Credenciais padrão:**
- Email: `admin@checkin.com`
- Senha: `admin123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

### 8. Inicie o servidor

\`\`\`bash
npm run dev
\`\`\`

Acesse: [http://localhost:3000](http://localhost:3000)

## 📱 Uso do Sistema

### Login
1. Acesse a página de login
2. Use as credenciais do admin ou de um usuário cadastrado
3. Será redirecionado para o dashboard

### Níveis de Acesso

#### 👑 ADMIN
- Acesso total ao sistema
- Gerenciar usuários
- Gerenciar eventos
- Gerenciar participantes
- Visualizar relatórios
- Usar scanner

#### 📊 GESTOR
- Gerenciar eventos
- Gerenciar participantes
- Visualizar relatórios
- Usar scanner

#### 📷 OPERADOR
- Apenas usar o scanner
- Realizar check-in/out

### Cadastrar Usuários (Admin)
1. Dashboard → Usuários
2. Clique em "Novo Usuário"
3. Preencha os dados
4. Selecione o nível de acesso
5. Salvar

### Criar Evento
1. Dashboard → Eventos
2. Clique em "Novo Evento"
3. Preencha as informações
4. Salvar

### Cadastrar Participantes
1. Dashboard → Participantes
2. Clique em "Novo Participante"
3. Preencha os dados
4. Selecione o evento
5. O QR code será gerado automaticamente
6. Salvar

### Realizar Check-in
1. Dashboard → Scanner
2. Permita acesso à câmera
3. Aponte para o QR code do participante
4. Sistema registra automaticamente

## 🗄️ Banco de Dados

### Visualizar os dados

\`\`\`bash
npm run prisma:studio
\`\`\`

Acesse: [http://localhost:5555](http://localhost:5555)

### Parar o banco de dados

\`\`\`bash
npm run docker:down
\`\`\`

## 🎨 Customização

O sistema usa tema azul configurado no `tailwind.config.ts`. Para alterar as cores:

1. Abra `tailwind.config.ts`
2. Modifique os valores em `theme.extend.colors.primary`
3. Reinicie o servidor

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Inicia servidor de produção
- `npm run prisma:generate` - Gera o client do Prisma
- `npm run prisma:push` - Sincroniza schema com banco
- `npm run prisma:studio` - Abre interface visual do banco
- `npm run docker:up` - Inicia containers Docker
- `npm run docker:down` - Para containers Docker

## 🔐 Segurança

- Senhas são criptografadas com bcryptjs
- Autenticação JWT via NextAuth.js
- Proteção de rotas por nível de acesso
- Validação de dados com Zod

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se o Docker está rodando
- Confirme que a porta 5432 está disponível
- Verifique a `DATABASE_URL` no `.env`

### Erro no Prisma
- Execute `npm run prisma:generate`
- Execute `npm run prisma:push`

### Problemas com QR Code
- Certifique-se que o navegador tem permissão para câmera
- Use HTTPS em produção (necessário para câmera)

## 📄 Licença

MIT

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ usando Next.js, Prisma e PostgreSQL
