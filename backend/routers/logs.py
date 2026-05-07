from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db.mongo import logs_col
from datetime import datetime
from core.auth import get_current_user
import hashlib

router = APIRouter()

class AttackLog(BaseModel):
    user_id: str
    problem_id: str
    attack_prompt: str
    response: str
    is_success: bool
    blocked_at: str = ""
    attack_type: str = ""

def anonymize_user_id(user_id: str) -> str:
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]

# 로그 저장 (인증 필요)
@router.post("/")
async def save_log(log: AttackLog, user_id: str = Depends(get_current_user)):
    data = log.dict()
    data["user_id"] = anonymize_user_id(log.user_id)
    data["created_at"] = datetime.utcnow()
    await logs_col.insert_one(data)
    return {"message": "로그 저장 완료"}

# 전체 로그 조회 (인증 필요)
@router.get("/")
async def get_logs(user_id: str = Depends(get_current_user)):
    logs = await logs_col.find().to_list(1000)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs

# 문제별 로그 조회 (인증 필요)
@router.get("/problem/{problem_id}")
async def get_logs_by_problem(problem_id: str, user_id: str = Depends(get_current_user)):
    logs = await logs_col.find({"problem_id": problem_id}).to_list(1000)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs