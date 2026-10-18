import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.flag_routes import router as flags_router
from app.api.auth import router as auth_router
from app.api.audit_routes import router as audit_router
from app.api.analytics_routes import router as analytics_router
from app.api.cleanup_routes import router as cleanup_router
from app.services.evaluation_analytics_scheduler import analytics_flush_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    analytics_task = asyncio.create_task(analytics_flush_loop())
    try:
        yield
    finally:
        analytics_task.cancel()
        await asyncio.gather(analytics_task, return_exceptions=True)

app = FastAPI(
    title="Feature Flag Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")

def home():
    return {"message": "Feature flag management system is running" }

app.include_router(cleanup_router, prefix="/api")
app.include_router(flags_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
