"""
MedLens FastAPI Application
---------------------------
Main entry point for MedLens backend server.
Connects API routers, database lifecycle, demo seeding, and CORS middleware.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import init_db, get_db, SessionLocal

# Import API Routers
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.reports import router as reports_router
from app.api.lab_results import router as lab_results_router
from app.api.conflicts import router as conflicts_router
from app.api.summaries import router as summaries_router
from app.api.comparison import router as comparison_router
from app.api.timeline import router as timeline_router
from app.api.export import router as export_router
from app.services.demo_seeder import seed_demo_data

# Initialize the FastAPI application
app = FastAPI(
    title="MedLens API",
    description="AI-Powered Clinical Information Intelligence Backend",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(reports_router)
app.include_router(lab_results_router)
app.include_router(conflicts_router)
app.include_router(summaries_router)
app.include_router(comparison_router)
app.include_router(timeline_router)
app.include_router(export_router)


@app.on_event("startup")
def on_startup():
    """
    Runs automatically on startup:
    1. Initializes SQLite tables
    2. Auto-seeds Patient A & Patient B synthetic demo records if database is empty
    """
    init_db()
    db = SessionLocal()
    try:
        from app.models import Patient
        if db.query(Patient).count() == 0:
            seed_demo_data(db)
            print("✓ Auto-seeded Patient A & Patient B synthetic demo records.")
    except Exception as e:
        print(f"[Startup Warning] Seeder error: {e}")
    finally:
        db.close()


@app.get("/")
def root():
    """Welcome endpoint for MedLens backend."""
    return {
        "project": "MedLens — AI-Powered Clinical Information Intelligence",
        "version": "1.0.0",
        "description": "Transforms medical reports into structured, traceable, and reviewable patient records.",
        "disclaimer": (
            "MedLens helps organize and explain medical information. "
            "It does not provide medical diagnosis or treatment advice. "
            "Always consult a qualified healthcare professional for medical decisions."
        ),
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint required by specification."""
    return {
        "status": "ok"
    }


@app.get("/api/system-status")
def system_status(db: Session = Depends(get_db)):
    """Diagnostic endpoint checking SQLite connection and table row counts."""
    try:
        from app.models import User, Patient, Report, LabResult, Summary, AuditLog, Conflict
        return {
            "status": "healthy",
            "database": "connected (SQLite)",
            "counts": {
                "users": db.query(User).count(),
                "patients": db.query(Patient).count(),
                "reports": db.query(Report).count(),
                "lab_results": db.query(LabResult).count(),
                "conflicts": db.query(Conflict).count(),
                "summaries": db.query(Summary).count(),
                "audit_logs": db.query(AuditLog).count()
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database_error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
