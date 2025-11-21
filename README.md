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


# AI Image Analysis & Q&A Platform

A full-stack AI web application for object detection using YOLO and conversational Q&A powered by Google's Gemini AI.

## Features

- 🔐 **Secure Authentication**: User signup/login with JWT tokens
- 🖼️ **Image Upload**: Upload images for object detection
- 🤖 **YOLO Detection**: Real-time object detection with YOLOv8
- 📊 **Sortable Results**: Interactive table with detection results
- 💬 **AI Q&A**: Ask questions about detected objects using Gemini AI
- 🐳 **Dockerized**: Complete Docker setup for easy deployment

## Architecture

### Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Knex.js ORM
- **AI Models**: 
  - YOLOv8 (Ultralytics) for object detection
  - Google Gemini 2.0 Flash for conversational AI
- **Infrastructure**: Docker, Docker Compose

### System Design

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │─────▶│  Express.js  │─────▶│ PostgreSQL  │
│  Frontend   │      │   Backend    │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─────▶ Python/YOLO
                            │       (Object Detection)
                            │
                            └─────▶ Gemini API
                                    (Q&A)
```

### Project Structure

```
.
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   └── Dockerfile
│
├── backend/              # Express.js API
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Python YOLO script
│   ├── migrations/      # Database migrations
│   ├── uploads/         # Image storage
│   └── Dockerfile
│
├── infra/               # Infrastructure
│   └── docker-compose.yml
│
└── models/              # YOLO model weights
    └── yolov8n.pt
```

## Prerequisites

- Docker & Docker Compose
- Gemini API Key ([Get it here](https://aistudio.google.com/app/apikey))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Configure Environment Variables

```bash
cd infra
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Download YOLO Model (Optional)

The YOLO model will be automatically downloaded on first run. To download manually:

```bash
mkdir -p models
cd models
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
```

### 4. Run with Docker Compose

From the `infra` directory:

```bash
docker compose up --build
```

This will:
- Build frontend and backend containers
- Start PostgreSQL database
- Run database migrations
- Start all services

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## Usage

1. **Sign Up**: Create a new account
2. **Login**: Sign in with your credentials
3. **Upload Image**: Select an image to analyze
4. **Detect Objects**: Click "Detect Objects" to run YOLO
5. **View Results**: See annotated image and sortable detection table
6. **Ask Questions**: Query the AI about detected objects

### Example Questions

- "How many cars are there?"
- "What is the highest-confidence object?"
- "List all detected objects"
- "Are there any people in the image?"

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Detection
- `POST /api/detect` - Upload image and run detection
- `GET /api/detect/:imageId` - Get detection results

### Q&A
- `POST /api/qa` - Ask question about detections
- `GET /api/qa/:imageId` - Get Q&A history

## Development

### Run Locally (Without Docker)

#### Backend

```bash
cd backend
npm install
pip3 install -r requirements.txt

# Setup database
createdb ai_detection
npm run migrate

# Start server
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend

# Create new migration
npx knex migrate:make migration_name

# Run migrations
npm run migrate

# Rollback
npm run migrate:rollback
```

## Technical Choices

### Why Express.js Instead of FastAPI?

While the assignment suggested FastAPI, we chose Express.js for:
- Unified JavaScript/TypeScript ecosystem
- Better integration with Node.js tools
- Easier Python script integration via `child_process`
- Simpler deployment with fewer moving parts

### Why PostgreSQL?

- Robust relational database for structured data
- Excellent JSON support for metadata
- Strong data integrity with foreign keys
- Easy Docker deployment

### Why YOLOv8?

- State-of-the-art object detection
- Fast inference speed
- Easy Python integration
- Pre-trained models available

### Why Gemini 2.0 Flash?

- Latest Google AI model
- Fast response times
- Good at understanding structured data
- Free tier available for development

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **File Validation**: Image type and size checks
- **SQL Injection Protection**: Knex.js parameterized queries
- **CORS Configuration**: Controlled cross-origin access

## Performance Optimizations

- Image size limits (10MB)
- Database connection pooling
- Efficient query indexing
- Static file serving via Express
- Docker layer caching

## Troubleshooting

### YOLO Detection Fails

```bash
# Check Python dependencies
docker exec -it ai_detection_backend pip3 list

# Verify model exists
docker exec -it ai_detection_backend ls -la models/
```

### Database Connection Error

```bash
# Check database status
docker compose ps

# View database logs
docker compose logs db
```

### Port Already in Use

```bash
# Change ports in docker-compose.yml
# Frontend: 3000 → 3001
# Backend: 5000 → 5001
# Database: 5432 → 5433
```

## Future Enhancements

- [ ] Image history and management
- [ ] Batch image processing
- [ ] Custom YOLO model training
- [ ] Real-time detection with webcam
- [ ] Export detection results (CSV/JSON)
- [ ] User settings and preferences
- [ ] Multi-language support

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Author

Your Name - [Your Email]

## Acknowledgments

- Ultralytics for YOLOv8
- Google for Gemini AI
- Next.js and Express.js teams