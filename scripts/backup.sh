#!/bin/bash
# ==============================================================================
# Script de Backup Automático - PostgreSQL
# ==============================================================================
# Realiza backup do banco de dados e mantém apenas os últimos N dias
# ==============================================================================

set -e

# Configurações
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar variáveis de ambiente
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGDATABASE" ]; then
    error "Variáveis de ambiente não configuradas!"
    error "Necessário: PGHOST, PGUSER, PGDATABASE"
    exit 1
fi

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

log "Iniciando backup do banco de dados..."
log "Database: $PGDATABASE"
log "Host: $PGHOST"
log "Arquivo: $BACKUP_COMPRESSED"

# Realizar backup
if pg_dump --verbose \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "$BACKUP_FILE" 2>&1; then
    
    log "Backup SQL criado com sucesso"
    
    # Comprimir backup
    log "Comprimindo backup..."
    if gzip -9 "$BACKUP_FILE"; then
        SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
        log "Backup comprimido: $SIZE"
    else
        error "Erro ao comprimir backup"
        exit 1
    fi
    
else
    error "Erro ao criar backup"
    exit 1
fi

# Limpeza de backups antigos
log "Removendo backups com mais de $RETENTION_DAYS dias..."
DELETED=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED" -gt 0 ]; then
    warning "Removidos $DELETED backup(s) antigo(s)"
else
    log "Nenhum backup antigo para remover"
fi

# Listar backups existentes
log "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || log "Nenhum backup encontrado"

# Resumo
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

log "========================================="
log "Backup concluído com sucesso!"
log "Total de backups: $TOTAL_BACKUPS"
log "Espaço utilizado: $TOTAL_SIZE"
log "========================================="

exit 0
