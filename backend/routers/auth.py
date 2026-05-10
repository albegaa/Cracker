from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from db.mongo import users_col
from core.config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])

# --- 요청 모델 ---
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- JWT 토큰 생성 ---
def create_token(user_id: str):
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.secret_key,
        algorithm="HS256"
    )

# --- 회원가입 ---
@router.post("/signup")
async def signup(req: SignupRequest):
    if await users_col.find_one({"email": req.email}):
        raise HTTPException(400, "이미 사용 중인 이메일입니다")

    user = {
        "username": req.username,
        "email": req.email,
        "password": pwd_context.hash(req.password),
        "created_at": datetime.utcnow()
    }
    result = await users_col.insert_one(user)
    return {"message": "회원가입 성공", "token": create_token(str(result.inserted_id))}

# --- 로그인 ---
@router.post("/login")
async def login(req: LoginRequest):
    user = await users_col.find_one({"email": req.email})
    if not user or not pwd_context.verify(req.password, user["password"]):
        raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다")

    return {
        "message": "로그인 성공",
        "token": create_token(str(user["_id"])),
        "username": user["username"]   # 추가
    }