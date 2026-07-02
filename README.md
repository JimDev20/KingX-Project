# 🚀 KingX Uptime Monitor

A full-stack cloud-based website uptime monitoring system with real-time status updates, email alerts, and analytics.

## 🌐 Live Demo

- **Frontend (vercel):** https://king-x-project.vercel.app/
- **Backend API:** https://kingx-project.onrender.com/api/health
- **Backend (Render): ** https://kingx-project.onrender.com/

## 📋 Features

- ✅ User Registration & Login (JWT Authentication)
- ✅ Add/Delete Websites
- ✅ Real-time UP/DOWN Status
- ✅ Email Alerts
- ✅ Auto-refresh Dashboard
- ✅ Uptime Percentage
- ✅ Response Time Monitoring
- ✅ History Log
- ✅ Charts (Uptime Pie Chart)
- ✅ Stats Cards

## 🛠️ Tech Stack

- **Frontend:** React, TailwindCSS, Chart.js
- **Backend:** Node.js, Express, MongoDB
- **Monitor:** Python
- **Deployment:** Vercel (Frontend), Railway (Backend)

## 🚀 Deployment

- Frontend: Vercel
- Backend: Railway
- Database: MongoDB Atlas
- Monitor: Python (local or cloud)

## 📁 Project Structure
KingX-Capstone/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── models/
│ │ ├── middleware/
│ │ ├── routes/
│ │ └── server.js
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── api/
│ │ ├── components/
│ │ ├── context/
│ │ └── App.js
│ └── package.json
└── monitor/
├── monitor.py
└── .env


## 📧 Email Alerts

The system sends email alerts when a website goes DOWN. Configure `EMAIL_SENDER`, `EMAIL_PASSWORD`, and `EMAIL_RECIPIENT` in `monitor/monitor.py`.

## 🎯 Future Improvements

- SMS Alerts (Twilio)
- Slack/Discord Integration
- Multi-Region Monitoring
- Mobile App (React Native)
- Export Reports (CSV/PDF)

## 📝 License

MIT

---

**Developed by Jimrie Parado**