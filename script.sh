#!/usr/bin/env bash
set -euo pipefail

# 1) Create folders
mkdir -p frontend backend infra models

# 2) Root files
cat > README.md <<'EOF'
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
EOF

cat > .env.example <<'EOF'
# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Backend
BACKEND_PORT=4000
BACKEND_LOG_LEVEL=info

# MySQL
MYSQL_PORT=3306
MYSQL_DATABASE=appdb
MYSQL_USER=appuser
MYSQL_PASSWORD=app_password
MYSQL_ROOT_PASSWORD=root_password
MYSQL_HOST=mysql
EOF

# 3) Root .gitignore
cat > .gitignore <<'EOF'
# Node
node_modules/
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env
.env
.env.local
.env.*.local

# OS
.DS_Store

# Logs
logs/
*.log

# Build
dist/
.next/
coverage/

# Docker
docker-data/
EOF

# 4) Frontend scaffold
cat > frontend/package.json <<'EOF'
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p ${FRONTEND_PORT:-3000}",
    "build": "next build",
    "start": "next start -p ${FRONTEND_PORT:-3000}",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/react": "latest",
    "@types/node": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest"
  }
}
EOF

cat > frontend/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "incremental": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "allowJs": false,
    "types": ["node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

cat > frontend/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/navigation-types/compat/navigation" />
/// <reference types="next/types/global" />
EOF

cat > frontend/next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
export default nextConfig;
EOF

mkdir -p frontend/app
cat > frontend/app/page.tsx <<'EOF'
export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Next.js + Express + MySQL (Docker)</h1>
      <p>Frontend running. Backend health at: {process.env.NEXT_PUBLIC_API_BASE_URL}/api/health</p>
    </main>
  );
}
EOF

cat > frontend/.gitignore <<'EOF'
node_modules/
.next/
dist/
.env
EOF

# 5) Backend scaffold
cat > backend/package.json <<'EOF'
{
  "name": "backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon --watch src --ext js,mjs,json --exec node src/index.mjs",
    "start": "node src/index.mjs"
  },
  "dependencies": {
    "cors": "latest",
    "dotenv": "latest",
    "express": "latest",
    "mysql2": "latest",
    "morgan": "latest"
  },
  "devDependencies": {
    "nodemon": "latest"
  }
}
EOF

mkdir -p backend/src
cat > backend/src/index.mjs <<'EOF'
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.BACKEND_LOG_LEVEL || 'dev'));

const PORT = Number(process.env.BACKEND_PORT || 4000);
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'mysql',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'appuser',
  password: process.env.MYSQL_PASSWORD || 'app_password',
  database: process.env.MYSQL_DATABASE || 'appdb'
};

app.get('/api/health', async (_req, res) => {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const [rows] = await conn.query('SELECT 1 AS ok');
    await conn.end();
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', error: (err && err.message) || 'unknown' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
EOF

cat > backend/.gitignore <<'EOF'
node_modules/
dist/
.env
EOF

# 6) Models placeholders (YOLO)
mkdir -p models/yolo-v5 models/yolo-v8 models/scripts

cat > models/yolo-v5/Dockerfile <<'EOF'
# Placeholder YOLOv5 Dockerfile
FROM python:3.10-slim
WORKDIR /workspace
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/ultralytics/yolov5.git .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["bash"]
EOF

cat > models/yolo-v8/Dockerfile <<'EOF'
# Placeholder YOLOv8 Dockerfile
FROM python:3.10-slim
WORKDIR /workspace
RUN pip install --no-cache-dir ultralytics
CMD ["bash"]
EOF

mkdir -p models/scripts
cat > models/scripts/train.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "Training script placeholder. Mount datasets and start training."
EOF
chmod +x models/scripts/train.sh

# 7) Infra: docker-compose.yml
cat > infra/docker-compose.yml <<'EOF'
services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    ports:
      - "${MYSQL_PORT}:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    image: node:20
    container_name: backend
    working_dir: /usr/src/app
    depends_on:
      - mysql
    environment:
      BACKEND_PORT: ${BACKEND_PORT}
      BACKEND_LOG_LEVEL: ${BACKEND_LOG_LEVEL}
      MYSQL_HOST: mysql
      MYSQL_PORT: ${MYSQL_PORT}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "${BACKEND_PORT}:4000"
    volumes:
      - ../backend:/usr/src/app
    command: bash -lc "npm install && npm run dev"

  frontend:
    image: node:20
    container_name: frontend
    working_dir: /usr/src/app
    depends_on:
      - backend
    environment:
      FRONTEND_PORT: ${FRONTEND_PORT}
      NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
    ports:
      - "${FRONTEND_PORT}:3000"
    volumes:
      - ../frontend:/usr/src/app
    command: bash -lc "npm install && npm run dev"

volumes:
  mysql_data:
EOF

# 8) Git init
git init
git add .
git commit -m "Initial scaffold: frontend, backend, models, infra with docker-compose"

echo "Scaffold complete. Next steps:"
echo "1) cp .env.example .env"
echo "2) cd infra && docker compose up --build"

