# Monorepo: Next.js frontend, Express backend, YOLO models, Docker Compose infra

## Stack
- Frontend: Next.js (TypeScript)
- Backend: Express.js (REST API)
- DB: MySQL
- Models: YOLO (Dockerfiles + scripts)
- Infra: Docker Compose

## Quick start
1. Copy env: `cp .env.example .env`
2. Start dev: `docker compose up --build`
3. Frontend: http://localhost:${FRONTEND_PORT}
4. Backend: http://localhost:${BACKEND_PORT}/api/health
5. MySQL: localhost:${MYSQL_PORT}
