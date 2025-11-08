# ==============================================================================
# Dockerfile Multi-Stage para Produção - Sistema Check-IN
# ==============================================================================
# Otimizado para Next.js 14+ com build rápido e imagem pequena
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependências
# ------------------------------------------------------------------------------
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar TODAS as dependências (incluindo dev para o build)
RUN npm ci && \
    npm cache clean --force

# ------------------------------------------------------------------------------
# Stage 2: Builder
# ------------------------------------------------------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Desabilitar telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build da aplicação (com verbose para debug)
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Dependencies
# ------------------------------------------------------------------------------
FROM node:18-alpine AS prod-deps
WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar apenas dependências de produção
RUN npm ci --only=production && \
    npm cache clean --force && \
    npx prisma generate

# ------------------------------------------------------------------------------
# Stage 4: Runner (Imagem Final)
# ------------------------------------------------------------------------------
FROM node:18-alpine AS runner
WORKDIR /app

# Configurar ambiente de produção
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar dependências de produção
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/node_modules/.prisma ./node_modules/.prisma

# Copiar arquivos públicos e gerados
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Ajustar permissões
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Variável de porta
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["node", "server.js"]
