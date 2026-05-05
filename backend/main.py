from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, problems, logs    # logs 추가

app = FastAPI(title="Cracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(problems.router, prefix="/api/problems", tags=["problems"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])    # 추가

@app.get("/health")
async def health_check():
    return {"status": "ok"}