#!/bin/bash
# ============================================
# Clothing POS - Database Setup Script
# ============================================
# This script sets up the MySQL database for the Clothing POS system.
# It supports two modes:
#   1. Fresh setup  — creates the DB and all tables from scratch (schema.sql)
#   2. Migration    — adds multi-branch support to an existing DB (migration_add_branches.sql)
# ============================================

set -e

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Defaults (override via .env or flags) ──
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-clothing_pos}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../clothing-pos-backend/schema.sql"
MIGRATION_FILE="$SCRIPT_DIR/../clothing-pos-backend/migration_add_branches.sql"

# ── Load .env if present ──
if [ -f "$SCRIPT_DIR/../clothing-pos-backend/.env" ]; then
  echo -e "${CYAN}Loading environment variables from .env ...${NC}"
  set -a
  source "$SCRIPT_DIR/../clothing-pos-backend/.env"
  set +a
  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-3306}"
  DB_USER="${DB_USER:-root}"
  DB_NAME="${DB_NAME:-clothing_pos}"
fi

# ── Helper functions ──
print_header() {
  echo ""
  echo -e "${CYAN}============================================${NC}"
  echo -e "${CYAN}  Clothing POS — Database Setup${NC}"
  echo -e "${CYAN}============================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✔  $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠  $1${NC}"
}

print_error() {
  echo -e "${RED}✖  $1${NC}"
}

usage() {
  echo "Usage: $0 [OPTION]"
  echo ""
  echo "Options:"
  echo "  --fresh       Run fresh database setup (schema.sql)"
  echo "  --migrate     Run branch migration on existing DB (migration_add_branches.sql)"
  echo "  --help        Show this help message"
  echo ""
  echo "If no option is provided, an interactive menu will be shown."
  echo ""
  echo "Environment variables (or .env file):"
  echo "  DB_HOST       Database host     (default: localhost)"
  echo "  DB_PORT       Database port     (default: 3306)"
  echo "  DB_USER       Database user     (default: root)"
  echo "  DB_PASSWORD   Database password (default: empty)"
  echo "  DB_NAME       Database name     (default: clothing_pos)"
  exit 0
}

# ── Build mysql command ──
build_mysql_cmd() {
  local cmd="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
  if [ -n "$DB_PASSWORD" ]; then
    cmd="$cmd -p$DB_PASSWORD"
  fi
  echo "$cmd"
}

# ── Check MySQL is reachable ──
check_mysql() {
  echo -e "Checking MySQL connection..."
  local cmd
  cmd=$(build_mysql_cmd)
  if $cmd -e "SELECT 1;" > /dev/null 2>&1; then
    print_success "MySQL connection successful  (${DB_USER}@${DB_HOST}:${DB_PORT})"
  else
    print_error "Cannot connect to MySQL at ${DB_USER}@${DB_HOST}:${DB_PORT}"
    echo "       Please make sure MySQL is running and credentials are correct."
    exit 1
  fi
}

# ── Fresh Setup ──
run_fresh_setup() {
  echo ""
  echo -e "${CYAN}▸ Running FRESH database setup ...${NC}"

  if [ ! -f "$SCHEMA_FILE" ]; then
    print_error "Schema file not found: $SCHEMA_FILE"
    exit 1
  fi

  local cmd
  cmd=$(build_mysql_cmd)

  # Confirm if DB already exists
  if $cmd -e "USE $DB_NAME;" 2>/dev/null; then
    echo ""
    print_warning "Database '$DB_NAME' already exists!"
    read -rp "   Drop and recreate? This will DELETE all data. (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      echo "   Dropping database '$DB_NAME' ..."
      $cmd -e "DROP DATABASE $DB_NAME;"
      print_success "Database dropped."
    else
      echo "   Aborted."
      exit 0
    fi
  fi

  echo "   Creating database and tables ..."
  $cmd < "$SCHEMA_FILE"
  print_success "Fresh database setup complete!"

  echo ""
  echo -e "${GREEN}  Database : $DB_NAME${NC}"
  echo -e "${GREEN}  Tables created from : schema.sql${NC}"
  echo -e "${GREEN}  Default admin login :${NC}"
  echo -e "${GREEN}    Email    : admin@clothingpos.com${NC}"
  echo -e "${GREEN}    Password : admin123${NC}"
  echo ""
}

# ── Migration ──
run_migration() {
  echo ""
  echo -e "${CYAN}▸ Running MIGRATION (add multi-branch support) ...${NC}"

  if [ ! -f "$MIGRATION_FILE" ]; then
    print_error "Migration file not found: $MIGRATION_FILE"
    exit 1
  fi

  local cmd
  cmd=$(build_mysql_cmd)

  # Check DB exists
  if ! $cmd -e "USE $DB_NAME;" 2>/dev/null; then
    print_error "Database '$DB_NAME' does not exist. Run --fresh first."
    exit 1
  fi

  # Check if migration was already applied
  if $cmd "$DB_NAME" -e "SHOW TABLES LIKE 'branches';" 2>/dev/null | grep -q "branches"; then
    print_warning "Table 'branches' already exists — migration may have already been applied."
    read -rp "   Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "   Aborted."
      exit 0
    fi
  fi

  echo "   Applying migration ..."
  $cmd "$DB_NAME" < "$MIGRATION_FILE"
  print_success "Migration applied successfully!"

  echo ""
  echo -e "${GREEN}  Changes applied:${NC}"
  echo -e "${GREEN}    • branches table created${NC}"
  echo -e "${GREEN}    • branch_id added to users and sales${NC}"
  echo -e "${GREEN}    • branch_stock table created${NC}"
  echo -e "${GREEN}    • stock_quantity migrated from product_variants → branch_stock${NC}"
  echo ""
}

# ── Parse arguments ──
MODE=""

case "${1:-}" in
  --fresh)   MODE="fresh" ;;
  --migrate) MODE="migrate" ;;
  --help|-h) usage ;;
esac

# ── Main ──
print_header

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
  read -rsp "Enter MySQL password for user '$DB_USER' (leave blank if none): " DB_PASSWORD
  echo ""
fi

check_mysql

if [ -z "$MODE" ]; then
  echo ""
  echo "Select an option:"
  echo ""
  echo "  1)  Fresh Setup        — Create database & all tables from scratch"
  echo "                           (uses schema.sql)"
  echo ""
  echo "  2)  Run Migration      — Add multi-branch support to existing DB"
  echo "                           (uses migration_add_branches.sql)"
  echo ""
  echo "  3)  Exit"
  echo ""
  read -rp "Enter choice [1-3]: " choice

  case "$choice" in
    1) MODE="fresh" ;;
    2) MODE="migrate" ;;
    3) echo "Bye!"; exit 0 ;;
    *) print_error "Invalid choice."; exit 1 ;;
  esac
fi

case "$MODE" in
  fresh)   run_fresh_setup ;;
  migrate) run_migration ;;
esac

echo -e "${CYAN}Done! 🎉${NC}"
