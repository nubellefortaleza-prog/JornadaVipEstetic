# ─────────────────────────────────────────────────────────────────────────────
# JornadaVip — Variáveis de Ambiente
#
# Copie este arquivo para .env e preencha os valores.
# ─────────────────────────────────────────────────────────────────────────────

# ── Backend CRM (quando disponível) ─────────────────────────────────────────
# Se definido, o app usa o CRM como backend via REST API.
# Se vazio/omitido, usa localStorage como fallback (modo offline).
# VITE_API_BASE_URL=https://crm.vipestetic.com.br

# ── Gemini IA ────────────────────────────────────────────────────────────────
# Em produção, NÃO defina esta variável. O app usará o proxy do CRM.
# Defina apenas para desenvolvimento local sem backend.
# VITE_GEMINI_API_KEY=sua_api_key_aqui

# ── Clínica ──────────────────────────────────────────────────────────────────
VITE_WHATSAPP_NUMBER=5585000000000
VITE_INSTAGRAM_URL=https://instagram.com/vipestetic
VITE_YOUTUBE_URL=https://youtube.com/@vipestetic

# ── Analytics ────────────────────────────────────────────────────────────────
# VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# VITE_SMARTLOOK_KEY=YOUR_PROJECT_KEY
