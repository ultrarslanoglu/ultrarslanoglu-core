# ================================================
# ULTRARSLANOGLU CORE - Native Development Helper
# For running without Docker
# ================================================

# Activate conda environment
conda activate base

# Set environment variables
export FLASK_APP=api-gateway/main.py
export FLASK_ENV=development
export FLASK_DEBUG=1
export PYTHONPATH="${PYTHONPATH}:${PWD}/api-gateway"

# Database connections (local)
export MONGODB_URI="mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin"
export REDIS_URL="redis://localhost:6379/0"
export PG_URI="postgresql://ultraadmin:ultrarslanoglu2025@localhost:5432/ultrarslanoglu"

# Load other variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "✅ Environment configured for native development"
echo "📍 Python: $(python --version)"
echo "📍 Node: $(node --version)"
echo ""
echo "🚀 Quick commands:"
echo "   • Start API: cd api-gateway && python main.py"
echo "   • Start Website: cd ultrarslanoglu-website && npm run dev"
echo "   • Start Celery: cd api-gateway && celery -A src.shared.celery_app worker --loglevel=debug"
