import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.database import Base, engine
from app.middleware import AuthMiddleware
from app.routers import auth, contests

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Circle of Inevitability API")

# CORS middleware - must be added before AuthMiddleware
# Build origins list from environment variable + local development URLs
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    # Support comma-separated URLs for multiple frontends
    for url in frontend_url.split(","):
        url = url.strip()
        if url and url not in cors_origins:
            cors_origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

app.include_router(auth.router)
app.include_router(contests.router)


@app.get("/auth", response_class=HTMLResponse)
def auth_page():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                width: 400px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            h1 {
                color: #fff;
                text-align: center;
                margin-bottom: 30px;
            }
            .tabs {
                display: flex;
                margin-bottom: 30px;
            }
            .tab {
                flex: 1;
                padding: 15px;
                text-align: center;
                background: transparent;
                border: none;
                color: #888;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
                border-bottom: 2px solid transparent;
            }
            .tab.active {
                color: #fff;
                border-bottom-color: #4a90d9;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                color: #ccc;
                margin-bottom: 8px;
            }
            input {
                width: 100%;
                padding: 15px;
                border: none;
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                font-size: 16px;
            }
            input::placeholder {
                color: #888;
            }
            input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.15);
            }
            button[type="submit"] {
                width: 100%;
                padding: 15px;
                border: none;
                border-radius: 10px;
                background: linear-gradient(135deg, #4a90d9 0%, #3672b9 100%);
                color: #fff;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            button[type="submit"]:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(74, 144, 217, 0.4);
            }
            .error {
                background: rgba(255, 0, 0, 0.2);
                color: #ff6b6b;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 20px;
                display: none;
            }
            .success {
                background: rgba(0, 255, 0, 0.2);
                color: #6bff6b;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 20px;
                display: none;
            }
            .form-container {
                display: none;
            }
            .form-container.active {
                display: block;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Circle of Inevitability</h1>
            <div class="tabs">
                <button class="tab active" onclick="showForm('login')">Login</button>
                <button class="tab" onclick="showForm('register')">Register</button>
            </div>

            <div id="error" class="error"></div>
            <div id="success" class="success"></div>

            <div id="login-form" class="form-container active">
                <form onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="login-username">Username</label>
                        <input type="text" id="login-username" placeholder="Enter your username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" placeholder="Enter your password" required>
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>

            <div id="register-form" class="form-container">
                <form onsubmit="handleRegister(event)">
                    <div class="form-group">
                        <label for="register-username">Username</label>
                        <input type="text" id="register-username" placeholder="Choose a username" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <input type="password" id="register-password" placeholder="Choose a password" required>
                    </div>
                    <button type="submit">Create Account</button>
                </form>
            </div>
        </div>

        <script>
            function showForm(type) {
                document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));

                if (type === 'login') {
                    document.querySelector('.tabs button:first-child').classList.add('active');
                    document.getElementById('login-form').classList.add('active');
                } else {
                    document.querySelector('.tabs button:last-child').classList.add('active');
                    document.getElementById('register-form').classList.add('active');
                }

                document.getElementById('error').style.display = 'none';
                document.getElementById('success').style.display = 'none';
            }

            function showError(message) {
                const errorDiv = document.getElementById('error');
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                document.getElementById('success').style.display = 'none';
            }

            function showSuccess(message) {
                const successDiv = document.getElementById('success');
                successDiv.textContent = message;
                successDiv.style.display = 'block';
                document.getElementById('error').style.display = 'none';
            }

            async function handleLogin(event) {
                event.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({username, password})
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        showError(data.detail || 'Login failed');
                        return;
                    }

                    showSuccess('Login successful! Redirecting...');
                    setTimeout(() => window.location.href = '/', 1000);
                } catch (err) {
                    showError('An error occurred. Please try again.');
                }
            }

            async function handleRegister(event) {
                event.preventDefault();
                const username = document.getElementById('register-username').value;
                const password = document.getElementById('register-password').value;

                try {
                    const response = await fetch('/api/auth/createUser', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({username, password})
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        showError(data.detail || 'Registration failed');
                        return;
                    }

                    showSuccess('Account created! Redirecting...');
                    setTimeout(() => window.location.href = '/', 1000);
                } catch (err) {
                    showError('An error occurred. Please try again.');
                }
            }
        </script>
    </body>
    </html>
    """


@app.get("/")
def root():
    return {"message": "Welcome to Circle of Inevitability API"}
