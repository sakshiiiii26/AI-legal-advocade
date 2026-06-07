# LexAI Deployment Guide

This project consists of a Next.js frontend and a FastAPI backend. The easiest and most robust way to deploy this full-stack application is to use **Vercel** for the frontend and **Render** (or Railway/Heroku) for the backend.

## 0. Version Control (Prerequisite)
Before deploying, make sure all your code is pushed to a GitHub repository. Both Vercel and Render connect directly to your GitHub repository to automatically build and deploy your app.
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## 1. Deploying the Backend (Render)
Render is an excellent platform for deploying Python/FastAPI applications.

1. Go to [Render](https://render.com/) and create an account.
2. Click **New** and select **Web Service**.
3. Connect your GitHub account and select your `LEXIS` repository.
4. Render will automatically detect the `render.yaml` file in the root folder and configure your backend service (named `lexai-backend`). 
   - **Alternative manual setup:** If it asks for manual settings, use:
     - **Root Directory:** `backend`
     - **Environment:** `Python`
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables**: In the Render dashboard for your web service, add your API keys:
   - `OPENAI_API_KEY` (Your OpenAI Key)
   - `GROQ_API_KEY` (Your Groq Key - optional)
   - Any other secrets needed for the backend.
6. Click **Deploy Web Service**.
7. Once deployed, copy the Render URL (e.g., `https://lexai-backend.onrender.com`). You will need this for the frontend.

*(Note: The `backend/Procfile` is also provided in case you prefer to use Heroku instead of Render).*

---

## 2. Deploying the Frontend (Vercel)
Vercel is the creator of Next.js and provides the best hosting experience for the frontend.

1. Go to [Vercel](https://vercel.com/) and create an account.
2. Click **Add New...** -> **Project**.
3. Import your `LEXIS` repository from GitHub.
4. In the configuration step:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: Click `Edit` and select `frontend`.
5. **Environment Variables**: Open the Environment Variables section and add:
   - `NEXT_PUBLIC_API_URL`: Set this to your Render backend URL (e.g., `https://lexai-backend.onrender.com`).
6. Click **Deploy**.
7. Vercel will build and launch your frontend. Once complete, it will give you a live domain for your Next.js application.

---

## 3. Post-Deployment Checklist
- [ ] Visit your Vercel URL to ensure the UI loads correctly.
- [ ] Test the chat/AI features to ensure the frontend successfully communicates with the backend.
- [ ] Ensure the CORS settings on your backend allow requests from your new Vercel domain (the current `main.py` is set to `allow_origin_regex=".*"` which allows all domains, but you may want to restrict this to your Vercel domain later for security).

You're all set! Every time you push to the `main` branch, both Vercel and Render will automatically deploy your new changes.
