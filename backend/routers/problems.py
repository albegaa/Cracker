from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.mongo import problems_col
from bson import ObjectId
from datetime import datetime

router = APIRouter()

class Problem(BaseModel):
    title: str
    difficulty: str       # "easy" | "medium" | "hard"
    attack_type: str      # "prompt_injection" | "jailbreak" 등
    description: str
    hint: str = ""
    system_prompt: str    # 타겟 LLM에게 줄 방어 지시문

# 문제 전체 조회
@router.get("/")
async def get_problems():
    problems = await problems_col.find().to_list(100)
    for p in problems:
        p["id"] = str(p["_id"])
        del p["_id"]
    return problems

# 문제 단건 조회
@router.get("/{problem_id}")
async def get_problem(problem_id: str):
    p = await problems_col.find_one({"_id": ObjectId(problem_id)})
    if not p:
        raise HTTPException(404, "문제를 찾을 수 없습니다")
    p["id"] = str(p["_id"])
    del p["_id"]
    return p

# 문제 생성
@router.post("/")
async def create_problem(problem: Problem):
    data = problem.dict()
    data["created_at"] = datetime.utcnow()
    data["updated_at"] = datetime.utcnow()
    result = await problems_col.insert_one(data)
    return {"id": str(result.inserted_id), "message": "문제 생성 완료"}

# 문제 수정
@router.put("/{problem_id}")
async def update_problem(problem_id: str, problem: Problem):
    data = problem.dict()
    data["updated_at"] = datetime.utcnow()
    result = await problems_col.update_one(
        {"_id": ObjectId(problem_id)},
        {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "문제를 찾을 수 없습니다")
    return {"message": "문제 수정 완료"}

# 문제 삭제
@router.delete("/{problem_id}")
async def delete_problem(problem_id: str):
    result = await problems_col.delete_one({"_id": ObjectId(problem_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "문제를 찾을 수 없습니다")
    return {"message": "문제 삭제 완료"}