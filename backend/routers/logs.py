from fastapi import APIRouter
from pydantic import BaseModel
from db.mongo import logs_col
from datetime import datetime
import hashlib

router = APIRouter()

class AttackLog(BaseModel):
    user_id: str
    problem_id: str
    attack_prompt: str
    response: str
    is_success: bool
    blocked_at: str = ""   # 차단된 레이어 (input / process / output / none)
    attack_type: str = ""  # 공격 유형

def anonymize_user_id(user_id: str) -> str:
    # user_id를 해싱해서 비식별화 (US-19)
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]

# 로그 저장
@router.post("/")
async def save_log(log: AttackLog):
    data = log.dict()
    data["user_id"] = anonymize_user_id(log.user_id)  # 비식별화 처리
    data["created_at"] = datetime.utcnow()
    await logs_col.insert_one(data)
    return {"message": "로그 저장 완료"}

# 로그 전체 조회 (관리자용)
@router.get("/")
async def get_logs():
    logs = await logs_col.find().to_list(1000)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs

# 문제별 로그 조회
@router.get("/problem/{problem_id}")
async def get_logs_by_problem(problem_id: str):
    logs = await logs_col.find({"problem_id": problem_id}).to_list(1000)
    for l in logs:
        l["id"] = str(l["_id"])
        del l["_id"]
    return logs