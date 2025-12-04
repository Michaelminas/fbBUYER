**Product Requirements Document (PRD)**
**Product:** Cash For Phones Today — MVP (Sydney iPhone Buyback)
**Version:** 1.0 (Strict MVP)
**Date:** 2025-08-20
**Owner:** Product Manager

---

## 1. Overview

**Goal:** Convert iPhone sellers in Sydney into paid, completed transactions with a fast, trustworthy experience.

**Primary KPI:** Paid Devices per Day (PDD)

**Launch Region:** Sydney, Australia (AU/Sydney timezone)

**Supported Platforms:**
- Mobile Web (Customer-facing)
- Desktop Web (Customer + Admin)
- Admin Dashboard (Desktop-only)

**Excluded:** Android devices, native mobile apps, automated payments, multi-crew/depot support

---

## 2. Customer-Facing Experience

### 2.1 Flow Summary
1. **Instant Quote**  
2. **Email Verification**  
3. **Scheduling (Pickup or Drop-off)**  
4. **On-site Inspection & Payment**  
5. **Email Receipt (if applicable)**

### 2.2 Quote Engine
- **Input:** Model, Storage, Damage Checklist, Pickup/Drop-off, Address
- **Base Price:** From internal price catalog
- **Damage Deduction:** Sum via structured cost table
- **Margin:** 25% (Base) / 30% (Pro, Pro Max)
- **Pickup Fee:**
  - $0 if raw fee < $20
  - Else: $1.25/km × distance (one-way, hub to customer)
  - Clamp: min $20, max $50
  - Round: Nearest $5
- **Floor:** Final payout must be ≥ $50
- **Locked Devices:** Fixed tier pricing
  - Base = $50
  - Pro = $100
  - Pro Max = $150
- **Final Payout:** Rounded down to nearest $5
- **Quote Validity:** 7 days; "Subject to inspection" disclosed

### 2.3 Verification
- Required for all users
- Email-based; 15-minute TTL
- Confirming email unlocks scheduling calendar

### 2.4 Scheduling
- **Visible Slots:** Next 7–14 days
- **Operating Hours:** 12:00–20:00 (no Sundays)
- **Same-Day:** Only if:
  - Request ≤ 15:00
  - Distance ≤ 20 km
  - Drive time ≤ 60 min
  - Capacity available
- **Slot Duration:** 60 min
- **Travel Buffer:** 15 min

### 2.5 Payment & Receipts
- **Methods:** Cash (preferred), PayID
- **Split Payment:** 50%/50% for repair-then-wipe cases
- **Receipts:** Only sent for split payments (via email PDF)

---

## 3. Admin Dashboard (Desktop)

### 3.1 Lead Management
- View/search/filter leads
- Edit status: New → Verified → Scheduled → Completed
- View quote + appointment metadata

### 3.2 Scheduling View
- See daily/weekly calendar view
- Slot capacity view
- Confirm, cancel, or reschedule bookings

### 3.3 Payout Management
- Finalize payout amount at inspection
- Select payment method
- Mark lead complete
- Receipt generator for 50/50 cases

### 3.4 Config Management
- Adjust:
  - Pickup fee rates
  - Margin % per tier
  - Profit thresholds by distance
- Enable/disable CLAUDE spec mode

---

## 4. Driver Interface (Portal)

### 4.1 Assigned Leads View
- View today's pickups with map and time
- Access full quote + damage summary

### 4.2 Inspection Flow
- Mark as:
  - Arrived
  - Inspected
  - Completed
- Upload condition notes
- Capture optional photos (if needed)

### 4.3 Payment & Closure
- Select payout method
- Record any adjustments
- Mark job paid/complete

---

## 5. API & Backend

### 5.1 Key Routes
- `POST /api/quote` — Create quote and calculate fee
- `POST /api/verify/send` — Send token email
- `POST /api/verify/confirm` — Confirm token and unlock scheduling
- `POST /api/schedule/reserve` — Reserve a slot
- `POST /api/schedule/confirm` — Finalize booking
- `POST /api/admin/complete` — Mark inspection complete

### 5.2 Services
- Google Maps API (computeRouteMatrix)
- Resend (email service)
- **Neon Postgres** + Prisma

---

## 6. Business Logic

### 6.1 Profit Guardrails
- Accept only if:
  - Expected Net Profit ≥ $100
- Net Profit = Base - Damage - Margin - Pickup Fee - Runner Cost Proxy

### 6.2 Fraud Controls
- Email validation
- IMEI check
- Quote rate limiting
- No-show blacklist by phone/email

---

## 7. Accessibility & Design

- Mobile-first, responsive
- WCAG AA compliance
- High-contrast toggle (visible)
- Semantic HTML, keyboard nav
- Calm, neutral copy
- No emojis or hype language

---

## 8. Non-Goals (v1 Exclusions)
- Android device support
- Multiple crews or depots
- Full logistics routing
- Native mobile apps
- Automated payments

---

## 9. Delivery & Constraints
- Hosting: Vercel
- DB: **Neon** (Postgres)
- Email: **Resend**
- Cron jobs: Quote expiry, slot unlock, analytics
- P95 latency: ≤ 300ms (quote)

---

**END PRD**