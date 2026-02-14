from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, admin, academic, student

app = FastAPI(
    title="Adaptive Learning Platform API",
    description="Backend API for College Adaptive Learning Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin - User Management"])
app.include_router(academic.router, prefix="/api/v1/admin", tags=["Admin - Academic Management"])
app.include_router(student.router, prefix="/api/v1/student", tags=["Student"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Adaptive Learning Platform API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "adaptive-learning-backend",
        "database": "connected"
    }
