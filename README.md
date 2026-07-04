# KingX Uptime Monitor

A full-stack cloud-based website uptime monitoring system with real-time status updates, team management, alerts, and analytics.

## Live Demo

- **Frontend:** https://king-x-project-13kl.vercel.app/
- **Backend API:** https://kingx-project1.onrender.com/api

## Features

- User registration & login (JWT authentication)
- Add/edit/delete websites with configurable check methods
- Real-time UP/DOWN/PENDING/MAINTENANCE status
- Uptime percentage & response time history charts
- Background scheduler (5-min checks) with maintenance window support
- Alert rules (email, SMS, Slack, Discord) with enable/disable
- Team management with roles (owner, admin, member, viewer)
- API key management
- Incident tracking & reporting
- SSL certificate monitor
- Webhook endpoints with event type selection
- Audit log with activity history
- Public status pages
- Admin panel (superadmin only)
- Dark mode support
- CSV report export

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS, Recharts, Lucide React
- **Backend:** Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL
- **Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```
KingX-Project/
├── backend-ts/          # TypeScript/Express backend with Prisma
│   ├── prisma/          # Schema & migrations
│   ├── src/
│   │   ├── config/      # Database config
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Scheduler, monitor, SMS
│   │   ├── utils/       # JWT helpers
│   │   └── server.ts    # Entry point
│   └── package.json
├── frontend-next/       # Next.js 16 frontend
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   └── package.json
├── docs/                # Documentation & activity logs
├── CLAUDE.md            # AI coding guidelines
└── README.md
```

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` in both `backend-ts/` and `frontend-next/`
3. Fill in environment variables
4. Run `npm install` in both directories
5. Start backend: `npm run dev` in `backend-ts/`
6. Start frontend: `npm run dev` in `frontend-next/`

## Alerts

- Email: SMTP configuration
- SMS: Email-to-SMS gateway (8 carriers supported)
- Slack: Webhook URL
- Discord: Webhook URL

## License

MIT

---

**Developed by Jimrie Parado**
