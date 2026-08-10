from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "healthy"
    try:
        # Verify database connectivity
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "unhealthy"
        
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "database": db_status
        }
    }
