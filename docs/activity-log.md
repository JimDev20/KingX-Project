# Activity Log

## 2026-11-03

### Landing page signal field reskin

- Replaced the hero orbit and depth plates with a full-bleed canvas signal field and a right-side status console.
- Added range-driven, pointer-reactive signal fields to the hero, product, status, FAQ, and inverted CTA sections.
- Switched the landing page to monochrome ink surfaces with a warm paper light theme and removed monospace and micro-label styling.
- Added offscreen pause, reduced-motion static drawing, and a DPR cap for large section canvases.
- Final checks: TypeScript and targeted ESLint pass; taste inspector reports 0 findings with product-UI image and footage exemptions; five canvases render at 320/390/1440 with no overflow or console errors.

### Landing page touch support

- Kept native scrolling on coarse pointers by limiting Lenis to fine-pointer devices; desktop keeps smooth wheel and tilt.
- Added coarse-pointer touch targets, manipulation gestures, short-screen menu scrolling, and a tap-specific hero hint.
- Made signal fields respond to taps without blocking scroll and pause drawing during touch scrolling.
- Added viewport-height fallbacks and guarded saved-theme storage.
- Verified touch swipes at 320/390/844/1024, menu anchors, range/theme/FAQ taps, reduced motion, and desktop Lenis behavior with no overflow or console errors.

### Landing page section design and light theme

- Added local landing light/dark toggle with persisted `kingx_landing_theme` and a warm paper light palette.
- Added tonal section bands, status fact cards, status panel chrome, FAQ active states, centered CTA, and footer redesign.
- Removed eyebrows, decorative numbering, micro-labels, and hairlines flagged by the taste inspector.
- Final checks: TypeScript and targeted ESLint pass; taste inspector reports 0 findings; theme toggle, persistence, and 320/390/1440 overflow checks pass.

### Landing page 3D depth and polish

- Added CSS perspective depth plates, static hero tilt, and a slow orbit plane behind the live preview.
- Added pointer-driven hero tilt via GSAP with reduced-motion and touch guards.
- Moved reveal targets to depth wrappers; kept borders only on `data-ui` cards.
- Final checks: TypeScript and targeted ESLint pass; taste inspector reports 0 findings.

## 2026-11-02

### Landing page redesign

- Removed all anti-patterns from `avoid.md`:
  - Purple-to-blue gradient hero and buttons
  - Gradient hero text (`bg-clip-text text-transparent`)
  - Badge above headline ("Now in public beta · Free to use")
  - Glassmorphism cards (`backdrop-blur`)
  - Three icon boxes in a row (stats section)
  - Lucide icons everywhere (reduced to Activity only)
  - Em dashes ("middot") throughout copy
  - Fake stats ("10K+ Websites Monitored", etc.)
  - Pricing section with dollar amounts (removed entirely)
- Reduced to single primary CTA ("Start monitoring free")
- Kept icons minimal (Activity for logo only)
- No credentials, no unnecessary words
- Follows HCI/Ux reference docs: clear words, visual hierarchy, accessible contrast

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
