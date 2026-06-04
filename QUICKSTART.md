# LexAI Quick Start Guide

## 🚀 Launch the Platform

### Step 1: Start Backend Server
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python main.py
```
✅ Backend running on: **http://localhost:8000**

### Step 2: Start Frontend Server
```bash
cd frontend
npm install  # if not already installed
npm run dev
```
✅ Frontend running on: **http://localhost:3000**

### Step 3: Open in Browser
Visit: **http://localhost:3000**

---

## 🔐 Login Credentials

**Demo Account**:
- Username: `lawyer`
- Password: `pass`

---

## 📍 Navigation Map

After login, use the **Left Sidebar** to navigate:

| Section | Pages | Access |
|---------|-------|--------|
| **Core** | Dashboard | `/` |
| **Cases** | List, Details | `/cases`, `/cases/[id]` |
| **Docs** | Document Mgmt | `/documents` |
| **Draft** | Legal Drafting | `/drafting` |
| **Chat** | AI Assistant | `/chat` |
| **Clients** | Client Portal | `/clients` |
| **Calendar** | Events & Tasks | `/calendar` |
| **Analytics** | Metrics & Charts | `/analytics` |
| **Integrations** | Third-party | `/integrations` |
| **Settings** | Preferences | `/settings` |

---

## ✨ Key Features to Try

### 1️⃣ Dashboard
- View overview stats
- See recent activity timeline
- Quick action shortcuts

### 2️⃣ Cases
- Click "New Case" to create
- Search existing cases
- View case details with tabs:
  - Overview
  - Strategy suggestions
  - Documents
  - Timeline
  - Notes

### 3️⃣ AI Chat
- Click "AI Assistant"
- Try suggested prompts
- Ask custom questions
- Real-time responses with RAG context

### 4️⃣ Legal Drafting
- Select document type
- Choose tone (Formal/Aggressive/Neutral/Persuasive)
- Generate draft
- Copy or download

### 5️⃣ Analytics
- View case trends
- Success rate distribution
- Performance metrics

---

## 🎨 UI Features

### Dark Mode
- Toggle in sidebar
- Automatic system detection
- Persistent across sessions

### Responsive Design
- Works on mobile/tablet/desktop
- Sidebar collapses on small screens
- Touch-friendly buttons

### Professional Components
- Smooth animations
- Hover effects
- Loading states
- Empty state illustrations

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Database (Optional - Currently In-Memory)

To enable PostgreSQL:
1. Install PostgreSQL
2. Create database
3. Update `DATABASE_URL` in backend/.env

---

## 📚 API Documentation

### Chat Request
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake_token" \
  -d '{
    "message": "What are the risks in this case?",
    "case_id": 1
  }'
```

### Case List
```bash
curl -X GET http://localhost:8000/cases \
  -H "Authorization: Bearer fake_token"
```

### Document Upload
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.pdf" \
  -F "case_id=1" \
  -H "Authorization: Bearer fake_token"
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess  # Windows

# Kill process (if needed)
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Module Not Found
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

### OpenAI API Error
- Check `.env` file has valid `OPENAI_API_KEY`
- Verify key is active on OpenAI dashboard
- Check rate limits

---

## 📦 What's Included

### Frontend Components
- Premium sidebar navigation
- Dashboard with cards & timeline
- Case management interface
- Document upload
- Draft generator
- AI chat interface
- Client portal
- Calendar view
- Analytics dashboard
- Settings panel

### Backend Features
- FastAPI server
- JWT authentication
- Case management API
- File upload handling
- AI integration (OpenAI)
- RAG with FAISS
- Database ready

---

## 🎯 Next Steps

1. **Explore the UI** - Navigate all sections
2. **Create a case** - Test case workflow
3. **Try AI chat** - Ask legal questions
4. **Generate drafts** - Create legal documents
5. **Configure settings** - Customize preferences
6. **Connect integrations** - Add external tools

---

## 💡 Tips

- 💾 Use "Save Notes" in case workspace frequently
- 🔍 Search cases by title or type for quick access
- 📱 Try dark mode for reduced eye strain
- ⌨️ Use keyboard shortcuts (hover shows hints)
- 🔄 Refresh page if stuck (F5)

---

## 📞 Support

Having issues?
1. Check browser console (F12)
2. Verify backend is running
3. Check network requests (Network tab)
4. Review error messages in terminal

---

**Happy legal managing! ⚖️**

