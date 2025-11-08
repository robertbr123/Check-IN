#!/bin/bash
# ==============================================================================
# Script de Deploy - Sistema Check-IN
# ==============================================================================
# Facilita deploy e atualizações em produção
# ==============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

# Funções de log
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
banner() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "   Sistema Check-IN - Deploy Manager"
    echo "=============================================="
    echo -e "${NC}"
}

# Verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado!"
        exit 1
    fi
    
    log "Dependências OK ✓"
}

# Verificar arquivo .env
check_env() {
    log "Verificando arquivo de ambiente..."
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Arquivo $ENV_FILE não encontrado!"
        error "Execute: cp .env.production.example .env.production"
        error "E configure as variáveis necessárias"
        exit 1
    fi
    
    # Carregar variáveis do .env de forma segura
    while IFS='=' read -r key value; do
        # Ignorar linhas vazias e comentários
        if [[ -z "$key" ]] || [[ "$key" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        # Exportar apenas se tiver key=value válido
        if [[ -n "$key" ]] && [[ -n "$value" ]]; then
            export "$key=$value"
        fi
    done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=')
    
    if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" == "TROCAR_POR_SECRET_GERADO_COM_OPENSSL_32_CARACTERES_MINIMO" ]; then
        error "NEXTAUTH_SECRET não está configurado!"
        error "Gere com: openssl rand -base64 32"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" == "TROCAR_SENHA_FORTE_AQUI_min16caracteres!@#" ]; then
        error "DB_PASSWORD não está configurado!"
        exit 1
    fi
    
    log "Variáveis de ambiente OK ✓"
}

# Criar diretórios necessários
setup_directories() {
    log "Criando diretórios..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p ./nginx/logs
    mkdir -p ./ssl
    log "Diretórios criados ✓"
}

# Gerar certificado SSL auto-assinado (desenvolvimento)
generate_ssl() {
    if [ ! -f "./ssl/cert.pem" ]; then
        warning "Certificado SSL não encontrado. Gerando auto-assinado..."
        info "ATENÇÃO: Use Let's Encrypt em produção!"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./ssl/key.pem \
            -out ./ssl/cert.pem \
            -subj "/C=BR/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null
        
        log "Certificado SSL gerado ✓"
    else
        log "Certificado SSL encontrado ✓"
    fi
}

# Build das imagens
build() {
    log "Construindo imagens Docker..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    log "Build concluído ✓"
}

# Iniciar serviços
start() {
    log "Iniciando serviços..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    log "Serviços iniciados ✓"
}

# Parar serviços
stop() {
    log "Parando serviços..."
    docker-compose -f "$COMPOSE_FILE" down
    log "Serviços parados ✓"
}

# Status dos serviços
status() {
    info "Status dos containers:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Logs
logs() {
    info "Exibindo logs (Ctrl+C para sair)..."
    docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# Migração do banco
migrate() {
    log "Executando migrações do Prisma..."
    docker-compose -f "$COMPOSE_FILE" exec app npx prisma migrate deploy
    log "Migrações concluídas ✓"
}

# Backup manual
backup() {
    log "Iniciando backup manual..."
    docker-compose -f "$COMPOSE_FILE" exec backup /usr/local/bin/backup.sh
    log "Backup concluído ✓"
}

# Restaurar backup
restore() {
    if [ -z "$1" ]; then
        error "Especifique o arquivo de backup!"
        info "Uso: $0 restore backup_YYYYMMDD_HHMMSS.sql.gz"
        info "Backups disponíveis:"
        ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Arquivo de backup não encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    warning "ATENÇÃO: Isso irá SOBRESCREVER o banco de dados atual!"
    read -p "Deseja continuar? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restauração cancelada"
        exit 0
    fi
    
    log "Restaurando backup: $1"
    
    # Criar backup de segurança antes de restaurar
    log "Criando backup de segurança..."
    backup
    
    # Restaurar
    gunzip -c "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$DB_USER" -d "$DB_NAME"
    
    log "Backup restaurado com sucesso ✓"
}

# Deploy completo
deploy() {
    banner
    check_dependencies
    check_env
    setup_directories
    generate_ssl
    
    log "Iniciando deploy..."
    
    # Parar serviços antigos
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log "Parando serviços antigos..."
        stop
    fi
    
    # Build
    build
    
    # Iniciar
    start
    
    # Aguardar serviços ficarem prontos
    log "Aguardando serviços iniciarem..."
    sleep 10
    
    # Executar migrações
    migrate
    
    # Status
    status
    
    echo ""
    log "========================================="
    log "Deploy concluído com sucesso! 🚀"
    log "========================================="
    echo ""
    info "Acesse: http://localhost (ou sua URL configurada)"
    info "Para ver logs: $0 logs"
    info "Para status: $0 status"
    echo ""
}

# Update (rebuild sem downtime)
update() {
    log "Atualizando aplicação..."
    
    # Build nova imagem
    build
    
    # Restart apenas o serviço app
    log "Reiniciando aplicação..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps --build app
    
    # Executar migrações
    migrate
    
    log "Atualização concluída ✓"
    status
}

# Health check
health() {
    info "Verificando saúde dos serviços..."
    
    # PostgreSQL
    if docker-compose -f "$COMPOSE_FILE" exec postgres pg_isready -U "$DB_USER" &>/dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL: Healthy"
    else
        echo -e "${RED}✗${NC} PostgreSQL: Unhealthy"
    fi
    
    # App
    if docker-compose -f "$COMPOSE_FILE" exec app wget -q --spider http://localhost:3000/api/health; then
        echo -e "${GREEN}✓${NC} App: Healthy"
    else
        echo -e "${RED}✗${NC} App: Unhealthy"
    fi
    
    # Nginx
    if docker-compose -f "$COMPOSE_FILE" exec nginx wget -q --spider http://localhost/health; then
        echo -e "${GREEN}✓${NC} Nginx: Healthy"
    else
        echo -e "${RED}✗${NC} Nginx: Unhealthy"
    fi
}

# Menu de ajuda
help() {
    echo "Uso: $0 {comando}"
    echo ""
    echo "Comandos disponíveis:"
    echo "  deploy    - Deploy completo (primeira instalação)"
    echo "  update    - Atualizar aplicação (rebuild)"
    echo "  start     - Iniciar serviços"
    echo "  stop      - Parar serviços"
    echo "  restart   - Reiniciar serviços"
    echo "  status    - Status dos containers"
    echo "  logs      - Exibir logs"
    echo "  migrate   - Executar migrações do banco"
    echo "  backup    - Criar backup manual"
    echo "  restore   - Restaurar backup"
    echo "  health    - Verificar saúde dos serviços"
    echo "  help      - Exibir esta ajuda"
    echo ""
}

# Main
case "$1" in
    deploy)
        deploy
        ;;
    update)
        update
        ;;
    start)
        check_env
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        start
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    migrate)
        migrate
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    health)
        health
        ;;
    help|--help|-h)
        help
        ;;
    *)
        error "Comando inválido: $1"
        help
        exit 1
        ;;
esac

exit 0
