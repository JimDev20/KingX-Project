# Activity Log

## 2026-07-04

### Migration: MongoDB to PostgreSQL

- Created backend-ts with Express + Prisma 7 + PostgreSQL
- Prisma 7 requires adapter-based client (PrismaPg) and prisma.config.ts for CLI
- Migrated 2 users (kingxuser, jimrie) and 1 website (google.com) from MongoDB

### Auth: username -> email

- Old usernames stored as fullName; login uses email
- Users login with `username@migrated.kingx.app` + old password
- Register now requires fullName, email + password
- Login uses email field instead of username

### Architecture: two backends

- `backend/` (old, MongoDB, Express) - deprecated, kept for reference
- `backend-ts/` (new, TypeScript, PostgreSQL, Prisma 7) - active

### Frontend updates

- All API calls pointed to backend-ts at localhost:4000
- Auth context switched to email-based
- Added StatsCards, UptimeChart, WebsiteTable components

### Code quality fixes

- Removed try/catch from controllers (33 functions) - errors propagate to centralized errorHandler
- asyncHandler updated to accept (req, res) signatures
- All route files wrapped with asyncHandler
- Removed emoji characters from source code
- Removed junk files (claude.md, codes.txt, proj.txt)
- Untracked .env files with credentials from git index
