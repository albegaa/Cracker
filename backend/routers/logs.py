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

# 내가 해결한 문제 목록 조회
@router.get("/me/solved")
async def get_solved_problems(user_id: str = Depends(get_current_user)):
    # 현재 로그인한 사용자의 비식별화 ID
    hashed_user_id = hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    # is_success: true인 로그에서 problem_id만 추출
    logs = await logs_col.find(
        {"user_id": hashed_user_id, "is_success": True},
        {"problem_id": 1, "_id": 0}
    ).to_list(1000)
    
    # 중복 제거
    solved_problem_ids = list(set([log["problem_id"] for log in logs]))
    
    return {"solved_problem_ids": solved_problem_ids}