from fastapi import APIRouter, Depends
from pydantic import BaseModel
from core.auth import get_current_user
from core.config import settings
import re

router = APIRouter()

class AttackRequest(BaseModel):
    problem_id: str
    system_prompt: str
    user_prompt: str
    secret: str          # 문제별 탈취 목표 정보 (예: "CRACKER_123")

class LayerResult(BaseModel):
    passed: bool
    blocked_at: str = ""  # "input" | "output" | ""
    reason: str = ""

class AttackResponse(BaseModel):
    reply: str
    is_success: bool
    blocked_at: str = ""
    is_mocked: bool = False

# ── 1단계: 입력 필터 ──────────────────────────────
def input_filter(user_prompt: str) -> LayerResult:
    # 명백한 공격 키워드 패턴 감지
    patterns = [
        r"ignore (all |previous |above )?(instructions?|system|prompts?)",
        r"(system|instruction).{0,20}(무시|ignore|override)",
        r"(비밀번호|password|secret).{0,10}(알려|말해|출력|print|show|reveal)",
        r"(너는|you are|act as).{0,20}(다른|different|new)",
    ]
    for pattern in patterns:
        if re.search(pattern, user_prompt, re.IGNORECASE):
            return LayerResult(
                passed=False,
                blocked_at="input",
                reason=f"입력 단계에서 공격 패턴 감지: {pattern}"
            )
    return LayerResult(passed=True)

# ── 2단계: LLM 호출 ──────────────────────────────
async def call_llm(system_prompt: str, user_prompt: str) -> str:
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
        return f"[Mock] 입력하신 '{user_prompt}'에 대한 응답입니다. 요청하신 정보는 제공할 수 없습니다."

# ── 3단계: 출력 필터 ──────────────────────────────
def output_filter(reply: str, secret: str) -> LayerResult:
    # LLM 응답에 탈취 목표 정보가 포함됐는지 확인
    if secret.lower() in reply.lower():
        return LayerResult(
            passed=False,
            blocked_at="output",
            reason="출력 단계에서 기밀 정보 노출 감지"
        )
    return LayerResult(passed=True)

# ── 메인 엔드포인트 ──────────────────────────────
@router.post("/", response_model=AttackResponse)
async def handle_attack(
    req: AttackRequest,
    user_id: str = Depends(get_current_user)
):
    is_mocked = not bool(settings.openai_api_key)

    # 1단계: 입력 필터
    input_result = input_filter(req.user_prompt)
    if not input_result.passed:
        return AttackResponse(
            reply="입력이 보안 정책에 의해 차단되었습니다.",
            is_success=False,
            blocked_at=input_result.blocked_at,
            is_mocked=is_mocked
        )

    # 2단계: LLM 호출
    reply = await call_llm(req.system_prompt, req.user_prompt)

    # 3단계: 출력 필터
    output_result = output_filter(reply, req.secret)
    if not output_result.passed:
        return AttackResponse(
            reply="응답이 보안 정책에 의해 차단되었습니다.",
            is_success=False,
            blocked_at=output_result.blocked_at,
            is_mocked=is_mocked
        )

    # 모든 레이어 통과 = 공격 성공
    return AttackResponse(
        reply=reply,
        is_success=True,
        blocked_at="",
        is_mocked=is_mocked
    )