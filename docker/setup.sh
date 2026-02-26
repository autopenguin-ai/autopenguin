#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "    _         _        ____                        _       "
echo "   / \  _   _| |_ ___|  _ \ ___ _ __   __ _ _   _(_)_ __  "
echo "  / _ \| | | | __/ _ \ |_) / _ \ '_ \ / _\` | | | | | '_ \ "
echo " / ___ \ |_| | || (_) |  __/  __/ | | | (_| | |_| | | | | |"
echo "/_/   \_\__,_|\__\___/|_|   \___|_| |_|\__, |\__,_|_|_| |_|"
echo "                                        |___/               "
echo -e "${NC}"
echo "Self-Hosted Setup"
echo "=========================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# -------------------------------------------
# Pre-flight checks
# -------------------------------------------
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Install it: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose V2 is required. Update Docker Desktop or install the compose plugin.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"

# Check memory (Linux)
if command -v free &> /dev/null; then
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 4000 ]; then
        echo -e "${YELLOW}⚠ Less than 4GB RAM (${TOTAL_MEM}MB). Things may be slow.${NC}"
    fi
fi

# Check if .env already exists
if [ -f .env ]; then
    echo ""
    echo -e "${YELLOW}An .env file already exists.${NC}"
    read -p "Overwrite it? (y/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env. Starting services..."
        docker compose up -d --build
        echo -e "${GREEN}Done! App at http://localhost:3000${NC}"
        exit 0
    fi
fi

# -------------------------------------------
# Generate secrets
# -------------------------------------------
echo ""
echo -e "${YELLOW}Generating secure keys...${NC}"

POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
DB_ENC_KEY=$(openssl rand -hex 16)

# Generate proper Supabase JWT tokens
generate_jwt() {
    local role=$1
    local now=$(date +%s)
    local exp=$((now + 315360000)) # 10 years
    local header='{"alg":"HS256","typ":"JWT"}'
    local payload="{\"role\":\"${role}\",\"iss\":\"supabase\",\"iat\":${now},\"exp\":${exp}}"

    local b64_header=$(echo -n "$header" | base64 | tr '+/' '-_' | tr -d '=')
    local b64_payload=$(echo -n "$payload" | base64 | tr '+/' '-_' | tr -d '=')
    local signature=$(echo -n "${b64_header}.${b64_payload}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '=')

    echo "${b64_header}.${b64_payload}.${signature}"
}

ANON_KEY=$(generate_jwt "anon")
SERVICE_ROLE_KEY=$(generate_jwt "service_role")

echo -e "${GREEN}✓ Secrets generated${NC}"

# -------------------------------------------
# Optional configuration
# -------------------------------------------
echo ""
echo -e "${BLUE}=== Configuration ===${NC}"
echo "(Press Enter to accept defaults)"
echo ""

# LLM
echo -e "AutoPenguin includes Ollama for local AI (no API key needed)."
read -p "Cloud LLM API key (Enter to skip, use Ollama): " LLM_KEY
if [ -z "$LLM_KEY" ]; then
    LLM_PROVIDER="ollama"
    echo -e "${GREEN}✓ Using bundled Ollama${NC}"
else
    LLM_PROVIDER="custom"
    echo -e "${GREEN}✓ Cloud LLM key saved${NC}"
fi

# Email
echo ""
echo -e "Email is optional. Without it, auth confirmation is automatic."
read -p "Resend API key (Enter to skip): " RESEND_KEY
if [ -z "$RESEND_KEY" ]; then
    MAILER_AUTOCONFIRM="true"
    echo -e "${GREEN}✓ Email skipped (auto-confirm enabled)${NC}"
else
    MAILER_AUTOCONFIRM="false"
    echo -e "${GREEN}✓ Email configured${NC}"
fi

# App URL
echo ""
read -p "App URL [http://localhost:3000]: " USER_APP_URL
APP_URL="${USER_APP_URL:-http://localhost:3000}"

# -------------------------------------------
# Write .env
# -------------------------------------------
echo ""
echo -e "${YELLOW}Writing .env...${NC}"

cat > .env << ENVEOF
# AutoPenguin Self-Hosted — Generated $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Do not share — contains secrets.

APP_URL=${APP_URL}
EMAIL_FROM_DOMAIN=localhost

# Supabase
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
POSTGRES_DB=postgres
POSTGRES_PORT=5432
SUPABASE_PUBLIC_URL=http://localhost:8000
DB_ENC_KEY=${DB_ENC_KEY}

# Frontend
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=${ANON_KEY}

# Auth
GOTRUE_SITE_URL=${APP_URL}
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=${MAILER_AUTOCONFIRM}
GOTRUE_SMS_AUTOCONFIRM=true
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_JWT_EXPIRY=3600
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated

# LLM
OLLAMA_HOST=http://ollama:11434
DEFAULT_LLM_PROVIDER=${LLM_PROVIDER}
DEFAULT_LLM_MODEL=llama3.2:3b
OPENROUTER_API_KEY=${LLM_KEY:-}

# Email
RESEND_API_KEY=${RESEND_KEY:-}

# Studio
STUDIO_PORT=8443
STUDIO_DEFAULT_ORGANIZATION=AutoPenguin
STUDIO_DEFAULT_PROJECT=Self-Hosted
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=${POSTGRES_PASSWORD}
ENVEOF

echo -e "${GREEN}✓ .env saved${NC}"

# -------------------------------------------
# Start services
# -------------------------------------------
echo ""
echo -e "${YELLOW}Starting AutoPenguin... (first run takes a few minutes)${NC}"
echo ""

docker compose up -d --build

# -------------------------------------------
# Wait for database
# -------------------------------------------
echo ""
echo -e "${YELLOW}Waiting for database...${NC}"
for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U postgres -h localhost > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database ready${NC}"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo -e "${RED}Database didn't start. Check: docker compose logs db${NC}"
        exit 1
    fi
    sleep 2
done

# -------------------------------------------
# Pull Ollama model
# -------------------------------------------
if [ "$LLM_PROVIDER" = "ollama" ]; then
    echo ""
    echo -e "${YELLOW}Pulling Ollama model (llama3.2:3b)...${NC}"
    echo "This downloads ~2GB on first run."
    docker compose exec -T ollama ollama pull llama3.2:3b 2>&1 || {
        echo -e "${YELLOW}⚠ Model pull failed. Run manually:${NC}"
        echo "  docker compose exec ollama ollama pull llama3.2:3b"
    }
fi

# -------------------------------------------
# Done
# -------------------------------------------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AutoPenguin is running!               ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  App:      ${BLUE}${APP_URL}${NC}"
echo -e "  API:      ${BLUE}http://localhost:8000${NC}"
echo -e "  Studio:   ${BLUE}http://localhost:8443${NC}"
echo -e "  Ollama:   ${BLUE}http://localhost:11434${NC}"
echo ""
echo "  Sign up at ${APP_URL} to create your account."
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down             # Stop"
echo "  docker compose up -d            # Start"
echo "  docker compose up -d --build    # Rebuild after updates"
echo ""
