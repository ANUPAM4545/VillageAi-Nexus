import asyncio
from app.db.base import Base
from app.db.session import engine
from app.models import user, school, student, teacher, class_, attendance

async def setup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(setup())
