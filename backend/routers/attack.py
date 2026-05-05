from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from core.config import settings
import os

router = APIRouter()

class AttackRequest(BaseModel):
    problem_id: str
    system_prompt: str    # 문제별 방어 지시문
    user_prompt: str      # 학습자가 입력한 공격 프롬프트

class AttackResponse(BaseModel):
    reply: str
    is_mocked: bool = False

async def call_llm(system_prompt: str, user_prompt: str) -> str:
    # API 키 있으면 실제 OpenAI 호출, 없으면 Mock 응답
    if settings.openai_api_key:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.choices[0].message.content
    else:
        # Mock 응답 (API 키 없을 때)
        return f"[Mock] 시스템 프롬프트를 기반으로 응답합니다. 입력: {user_prompt}"

@router.post("/", response_model=AttackResponse)
async def handle_attack(
    req: AttackRequest,
    user_id: str = Depends(get_current_user)
):
    reply = await call_llm(req.system_prompt, req.user_prompt)
    is_mocked = not bool(settings.openai_api_key)
    return AttackResponse(reply=reply, is_mocked=is_mocked)