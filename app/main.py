from fastapi import FastAPI

from app.api.routes.environments import router as environment_router
from app.api.routes.flags import router as flag_router
from app.api.routes.evaluation import router as evaluation_router
from app.api.routes.flag_versions import router as flag_versions_router
from app.api.routes.audit_logs import router as audit_logs_router
from app.api.targeting import router as targeting_router


app = FastAPI(
    title="Feature Flag Management System",
    version="1.0.0",
    description="Feature Flag Management and Release Control System"
)


app.include_router(environment_router)
app.include_router(flag_router)
app.include_router(evaluation_router)
app.include_router(flag_versions_router)
app.include_router(audit_logs_router)
app.include_router(targeting_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "feature-flag-management-system"
    }
