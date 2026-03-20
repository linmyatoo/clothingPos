#!/bin/bash
# ============================================
# Clothing POS — Database Setup (MariaDB Docker)
# ============================================
# Runs schema.sql and migration_add_branches.sql
# against the MariaDB container (pos-db).
#
# Usage:
#   ./scripts/setup_database.sh              # interactive menu
#   ./scripts/setup_database.sh --fresh      # fresh setup (schema.sql)
#   ./scripts/setup_database.sh --migrate    # migration only
#   ./scripts/setup_database.sh --all        # fresh + migration
# ============================================

set -e

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Config ──
CONTAINER_NAME="${CONTAINER_NAME:-pos-db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-rootpassword}"
DB_NAME="${DB_NAME:-clothing_pos}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
SCHEMA_FILE="$PROJECT_ROOT/clothing-pos-backend/schema.sql"
MIGRATION_FILE="$PROJECT_ROOT/clothing-pos-backend/migration_add_branches.sql"

# ── Helpers ──
print_header() {
  echo ""
  echo -e "${CYAN}============================================${NC}"
  echo -e "${CYAN}  Clothing POS — Database Setup (Docker)${NC}"
  echo -e "${CYAN}============================================${NC}"
  echo ""
}

print_success() { echo -e "${GREEN}✔  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠  $1${NC}"; }
print_error()   { echo -e "${RED}✖  $1${NC}"; }

usage() {
  echo "Usage: $0 [OPTION]"
  echo ""
  echo "Options:"
  echo "  --fresh       Run fresh database setup (schema.sql)"
  echo "  --migrate     Run branch migration (migration_add_branches.sql)"
  echo "  --all         Run fresh setup + migration in sequence"
  echo "  --help        Show this help message"
  echo ""
  echo "Environment variables:"
  echo "  CONTAINER_NAME  Docker container name  (default: pos-db)"
  echo "  DB_USER         Database user           (default: root)"
  echo "  DB_PASSWORD     Database password        (default: rootpassword)"
  echo "  DB_NAME         Database name            (default: clothing_pos)"
  exit 0
}

# ── Check Docker container is running ──
check_container() {
  echo "Checking Docker container '$CONTAINER_NAME' ..."
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_error "Container '$CONTAINER_NAME' is not running."
    echo ""
    echo "   Start it with:  docker compose up -d db"
    echo ""

    # Offer to start it
    read -rp "   Start it now? (y/N): " start_confirm
    if [[ "$start_confirm" =~ ^[Yy]$ ]]; then
      echo "   Starting services ..."
      docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d db
      echo "   Waiting for MariaDB to be ready ..."
      sleep 5
    else
      exit 1
    fi
  fi
  print_success "Container '$CONTAINER_NAME' is running."
}

# ── Wait until MariaDB accepts connections ──
wait_for_db() {
  echo "Waiting for MariaDB to accept connections ..."
  local retries=15
  while [ $retries -gt 0 ]; do
    if docker exec "$CONTAINER_NAME" mariadb -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
      print_success "MariaDB is ready."
      return 0
    fi
    retries=$((retries - 1))
    sleep 2
  done
  print_error "MariaDB did not become ready in time."
  exit 1
}

# ── Run SQL file inside the container ──
run_sql_file() {
  local sql_file="$1"
  local label="$2"

  if [ ! -f "$sql_file" ]; then
    print_error "SQL file not found: $sql_file"
    exit 1
  fi

  echo "   Running $label ..."
  docker exec -i "$CONTAINER_NAME" mariadb -u"$DB_USER" -p"$DB_PASSWORD" < "$sql_file"
}

# ── Fresh Setup ──
run_fresh_setup() {
  echo ""
  echo -e "${CYAN}▸ Running FRESH database setup ...${NC}"

  # Check if DB already exists
  if docker exec "$CONTAINER_NAME" mariadb -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    echo ""
    print_warning "Database '$DB_NAME' already exists!"
    read -rp "   Drop and recreate? This will DELETE all data. (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      echo "   Dropping database '$DB_NAME' ..."
      docker exec "$CONTAINER_NAME" mariadb -u"$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE $DB_NAME;"
      print_success "Database dropped."
    else
      echo "   Aborted."
      exit 0
    fi
  fi

  run_sql_file "$SCHEMA_FILE" "schema.sql"
  print_success "Fresh database setup complete!"

  echo ""
  echo -e "${GREEN}  Database : $DB_NAME${NC}"
  echo -e "${GREEN}  Default admin login:${NC}"
  echo -e "${GREEN}    Email    : admin@clothingpos.com${NC}"
  echo -e "${GREEN}    Password : admin123${NC}"
  echo ""
}

# ── Migration ──
run_migration() {
  echo ""
  echo -e "${CYAN}▸ Running MIGRATION (add multi-branch support) ...${NC}"

  # Check DB exists
  if ! docker exec "$CONTAINER_NAME" mariadb -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    print_error "Database '$DB_NAME' does not exist. Run --fresh first."
    exit 1
  fi

  # Check if migration was already applied
  local tables
  tables=$(docker exec "$CONTAINER_NAME" mariadb -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'branches';" 2>/dev/null)
  if echo "$tables" | grep -q "branches"; then
    print_warning "Table 'branches' already exists — migration may have been applied."
    read -rp "   Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "   Aborted."
      exit 0
    fi
  fi

  run_sql_file "$MIGRATION_FILE" "migration_add_branches.sql"
  print_success "Migration applied successfully!"

  echo ""
  echo -e "${GREEN}  Changes applied:${NC}"
  echo -e "${GREEN}    • branches table created${NC}"
  echo -e "${GREEN}    • branch_id added to users and sales${NC}"
  echo -e "${GREEN}    • branch_stock table created${NC}"
  echo -e "${GREEN}    • stock migrated from product_variants → branch_stock${NC}"
  echo ""
}

# ── Parse arguments ──
MODE=""
case "${1:-}" in
  --fresh)   MODE="fresh" ;;
  --migrate) MODE="migrate" ;;
  --all)     MODE="all" ;;
  --help|-h) usage ;;
esac

# ── Main ──
print_header
check_container
wait_for_db

if [ -z "$MODE" ]; then
  echo ""
  echo "Select an option:"
  echo ""
  echo "  1)  Fresh Setup     — Drop & create DB from schema.sql"
  echo "  2)  Run Migration   — Add multi-branch support (migration_add_branches.sql)"
  echo "  3)  Full Setup      — Fresh + Migration in sequence"
  echo "  4)  Exit"
  echo ""
  read -rp "Enter choice [1-4]: " choice

  case "$choice" in
    1) MODE="fresh" ;;
    2) MODE="migrate" ;;
    3) MODE="all" ;;
    4) echo "Bye!"; exit 0 ;;
    *) print_error "Invalid choice."; exit 1 ;;
  esac
fi

case "$MODE" in
  fresh)   run_fresh_setup ;;
  migrate) run_migration ;;
  all)     run_fresh_setup; run_migration ;;
esac

echo -e "${CYAN}Done! 🎉${NC}"
