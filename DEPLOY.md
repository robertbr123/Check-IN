# 🐳 Deploy em Produção com Docker

## 📋 Guia Completo de Implantação

Este guia detalha como fazer deploy do sistema Check-IN em produção usando Docker.

---

## 🎯 Arquitetura de Produção

```
┌─────────────────────────────────────────────┐
│              Internet / Users               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Nginx (Port 80/443) │  ← Reverse Proxy + SSL
         └─────────┬───────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Next.js App     │  ← Aplicação (Port 3000)
         └─────────┬───────┘
                   │
                   ▼
         ┌─────────────────┐
         │  PostgreSQL      │  ← Banco de Dados
         └─────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Backup Service  │  ← Backups automáticos
         └─────────────────┘
```

---

## 🚀 Deploy Rápido (5 minutos)

### 1️⃣ Pré-requisitos

```bash
# Verificar Docker
docker --version
# Docker version 24.0+ requerido

# Verificar Docker Compose
docker-compose --version
# Docker Compose version 2.0+ requerido
```

### 2️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env.production

# Gerar secret seguro
openssl rand -base64 32

# Editar .env.production com seus valores
nano .env.production
```

**Variáveis OBRIGATÓRIAS:**
```bash
DB_PASSWORD=SuaSenhaForteAqui123!@#
NEXTAUTH_SECRET=cole_o_secret_gerado_acima
NEXTAUTH_URL=https://seudominio.com
```

### 3️⃣ Deploy

```bash
# Executar script de deploy
./scripts/deploy.sh deploy
```

Pronto! 🎉 Seu sistema está rodando em `http://localhost`

---

## 📖 Guia Detalhado

### Estrutura de Arquivos Criados

```
Check-IN/
├── Dockerfile                      # Build multi-stage otimizado
├── docker-compose.prod.yml         # Orquestração de serviços
├── .env.production.example         # Template de variáveis
├── .env.production                 # Suas configurações (não commitado)
├── .dockerignore                   # Arquivos ignorados no build
├── nginx/
│   ├── nginx.conf                  # Configuração principal
│   └── conf.d/
│       └── default.conf            # Virtual host
├── scripts/
│   ├── deploy.sh                   # Script de deploy
│   ├── backup.sh                   # Backup automático
│   └── init-db.sql                 # Inicialização do DB
├── ssl/
│   ├── cert.pem                    # Certificado SSL
│   └── key.pem                     # Chave privada
└── backups/                        # Backups do banco
```

---

## 🔧 Comandos Disponíveis

### Script de Deploy

```bash
# Deploy inicial completo
./scripts/deploy.sh deploy

# Atualizar aplicação (rebuild)
./scripts/deploy.sh update

# Iniciar serviços
./scripts/deploy.sh start

# Parar serviços
./scripts/deploy.sh stop

# Reiniciar serviços
./scripts/deploy.sh restart

# Ver status
./scripts/deploy.sh status

# Ver logs
./scripts/deploy.sh logs

# Executar migrações
./scripts/deploy.sh migrate

# Backup manual
./scripts/deploy.sh backup

# Restaurar backup
./scripts/deploy.sh restore backup_20240108_150000.sql.gz

# Health check
./scripts/deploy.sh health

# Ajuda
./scripts/deploy.sh help
```

### Docker Compose Direto

```bash
# Iniciar
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Parar
docker-compose -f docker-compose.prod.yml down

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# Executar comando no container
docker-compose -f docker-compose.prod.yml exec app sh
```

---

## 🔐 Configuração de SSL/HTTPS

### Opção 1: Certificado Auto-Assinado (Desenvolvimento)

O script de deploy gera automaticamente. **Não use em produção!**

### Opção 2: Let's Encrypt (RECOMENDADO)

```bash
# 1. Instalar Certbot
sudo apt update
sudo apt install certbot

# 2. Gerar certificado
sudo certbot certonly --standalone -d seudominio.com

# 3. Copiar certificados
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem ./ssl/key.pem

# 4. Ajustar permissões
sudo chown $USER:$USER ./ssl/*.pem

# 5. Configurar renovação automática
sudo certbot renew --dry-run
```

### Opção 3: Certificado Próprio

Coloque seus arquivos em:
- `./ssl/cert.pem` - Certificado
- `./ssl/key.pem` - Chave privada

---

## 💾 Backups

### Backup Automático

Backups são executados **diariamente às 3h da manhã** automaticamente.

Configurar no `.env.production`:
```bash
BACKUP_SCHEDULE="0 3 * * *"    # Cron format
BACKUP_RETENTION_DAYS=7        # Manter últimos 7 dias
```

### Backup Manual

```bash
./scripts/deploy.sh backup
```

Backups são salvos em `./backups/backup_YYYYMMDD_HHMMSS.sql.gz`

### Restaurar Backup

```bash
# Listar backups disponíveis
ls -lh backups/

# Restaurar
./scripts/deploy.sh restore backup_20240108_150000.sql.gz
```

**⚠️ ATENÇÃO:** Restaurar sobrescreve o banco atual!

---

## 📊 Monitoramento

### Health Check

```bash
# Via script
./scripts/deploy.sh health

# Via curl
curl http://localhost/api/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2024-01-08T15:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "rss": "150MB",
    "heapUsed": "80MB",
    "heapTotal": "120MB"
  }
}
```

### Logs

```bash
# Todos os serviços
./scripts/deploy.sh logs

# Apenas app
docker-compose -f docker-compose.prod.yml logs -f app

# Apenas postgres
docker-compose -f docker-compose.prod.yml logs -f postgres

# Apenas nginx
docker-compose -f docker-compose.prod.yml logs -f nginx

# Últimas 100 linhas
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Métricas

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Logs do sistema
docker-compose -f docker-compose.prod.yml logs --since 1h
```

---

## 🔄 Atualizações

### Atualizar Código

```bash
# 1. Pull das mudanças
git pull origin main

# 2. Update automático
./scripts/deploy.sh update
```

### Atualizar Dependências

```bash
# 1. Atualizar package.json
npm update

# 2. Rebuild completo
./scripts/deploy.sh stop
./scripts/deploy.sh deploy
```

---

## 🌐 Configuração de Domínio

### DNS

Aponte seu domínio para o IP do servidor:

```
A     @              123.456.789.101
A     www            123.456.789.101
```

### Nginx

Edite `nginx/conf.d/default.conf`:

```nginx
server_name seudominio.com www.seudominio.com;
```

### Variável de Ambiente

```bash
NEXTAUTH_URL=https://seudominio.com
```

---

## 🚨 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs

# Verificar configuração
docker-compose -f docker-compose.prod.yml config

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down -v
./scripts/deploy.sh deploy
```

### Erro de conexão com banco

```bash
# Verificar se está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Ver logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Nginx 502 Bad Gateway

```bash
# Verificar se app está rodando
docker-compose -f docker-compose.prod.yml ps app

# Testar app diretamente
curl http://localhost:3000/api/health

# Ver logs do nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

### Erro de permissão SSL

```bash
# Ajustar permissões
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
chown $USER:$USER ssl/*.pem
```

### Espaço em disco cheio

```bash
# Limpar containers parados
docker container prune -f

# Limpar imagens não usadas
docker image prune -a -f

# Limpar volumes órfãos
docker volume prune -f

# Limpar tudo (CUIDADO!)
docker system prune -a --volumes -f
```

---

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] Trocar TODAS as senhas padrão
- [ ] Gerar NEXTAUTH_SECRET forte (min 32 chars)
- [ ] Usar HTTPS (Let's Encrypt)
- [ ] Firewall configurado (portas 80, 443)
- [ ] Backups automáticos habilitados
- [ ] Logs sendo monitorados
- [ ] Rate limiting ativo
- [ ] Headers de segurança configurados
- [ ] Container rodando como non-root
- [ ] Volumes com permissões restritas

### Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ver status
sudo ufw status
```

### Atualizações de Segurança

```bash
# Sistema operacional
sudo apt update && sudo apt upgrade -y

# Docker
sudo apt update && sudo apt install docker-ce docker-ce-cli

# Imagens Docker
docker-compose -f docker-compose.prod.yml pull
./scripts/deploy.sh update
```

---

## 📈 Performance

### Cache

O Nginx já está configurado com:
- Cache de assets estáticos (1 ano)
- Cache de imagens (7 dias)
- Compressão Gzip

### Escalabilidade

Para escalar horizontalmente:

```yaml
# docker-compose.prod.yml
app:
  deploy:
    replicas: 3  # 3 instâncias
```

---

## 🎯 Próximos Passos

Após o deploy:

1. ✅ Acessar aplicação e fazer login
2. ✅ Criar usuário admin: `docker-compose -f docker-compose.prod.yml exec app node scripts/create-admin.js`
3. ✅ Testar todas as funcionalidades
4. ✅ Configurar monitoramento (Sentry, New Relic)
5. ✅ Configurar alertas (email, Slack)
6. ✅ Documentar procedimentos da equipe

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `./scripts/deploy.sh logs`
2. Health check: `./scripts/deploy.sh health`
3. Verificar documentação acima
4. Abrir issue no GitHub

---

**Deploy realizado com sucesso? 🎉**

Acesse: `https://seudominio.com` e comece a usar!
