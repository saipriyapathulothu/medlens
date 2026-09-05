"""
MedLens Backend Runner
----------------------
Convenient starter script for beginners.
Run this script using:
    python run_backend.py
"""

import sys
import os

# Add current directory to Python path so `import app` works reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    try:
        import uvicorn
    except ImportError:
        print("\n[ERROR] 'uvicorn' is not installed yet!")
        print("Please install the dependencies first by running:")
        print("    pip install -r requirements.txt\n")
        sys.exit(1)

    print("=" * 60)
    print("  Starting MedLens Backend Server")
    print("  Health Check: http://127.0.0.1:8000/api/health")
    print("  Interactive API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
