from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db.mongo import logs_col
from datetime import datetime
from core.auth import get_current_user
import hashlib

router = APIRouter()

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

# 내가 푼 특정 문제 마지막 로그 조회
@router.get("/me/problem/{problem_id}")
async def get_my_last_log(problem_id: str, user_id: str = Depends(get_current_user)):
    hashed_user_id = hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    log = await logs_col.find_one(
        {"user_id": hashed_user_id, "problem_id": problem_id},
        sort=[("created_at", -1)]  # 가장 최근 로그
    )
    
    if not log:
        raise HTTPException(404, "로그를 찾을 수 없습니다")
    
    log["id"] = str(log["_id"])
    del log["_id"]
    return log