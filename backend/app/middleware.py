from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, excluded_paths: list = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or [
            "/api/auth/createUser",
            "/api/auth/login",
            "/auth",
            "/docs",
            "/openapi.json",
            "/redoc",
        ]

    async def dispatch(self, request: Request, call_next):
        # Let CORS preflight requests pass through to CORSMiddleware
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        for excluded in self.excluded_paths:
            if path.startswith(excluded):
                return await call_next(request)

        is_api_request = path.startswith("/api/")

        token = request.cookies.get("access_token")

        if not token:
            if is_api_request:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Not authenticated"},
                )
            return RedirectResponse(url="/auth", status_code=302)

        payload = verify_token(token)
        if payload is None:
            if is_api_request:
                response = JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or expired token"},
                )
                response.delete_cookie("access_token")
                return response
            response = RedirectResponse(url="/auth", status_code=302)
            response.delete_cookie("access_token")
            return response

        request.state.user_id = payload.get("sub")
        return await call_next(request)
