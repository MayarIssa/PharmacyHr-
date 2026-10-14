# Nour HR — Pharmacy HR System

**Live:** [hr-pharmacy-nine.vercel.app](https://hr-pharmacy-nine.vercel.app/)

A bilingual (Arabic/English) human-resources system for a pharmacy with several branches. It covers the whole employee lifecycle, from onboarding and schedules to attendance, requests and monthly payroll, with each role seeing only what it should.

## Features

- **Employees and branches:** employee records with branch history, banks, and custody items issued to staff.
- **Attendance and schedules:** shift schedules, attendance tracking, and forgotten-hours requests.
- **Requests and approvals:** holidays, overtime, salary borrows (cash and installments), appointments and resignations.
- **Payroll:** monthly payroll with bonuses, discounts and borrow deductions.
- **Performance:** evaluations against configurable criteria, plus complaints.
- **Company news** and onboarding for new staff.
- **Roles:** admin, HR, area managers (who see only their branches) and staff.
- **Audit log** of important changes.
- **Arabic and English,** with a full right-to-left layout for Arabic.

## Security

The database has 25 tables, and row-level security is on for every one of them, enforced by 53 Postgres policies. Access is checked in the database itself, not only in the UI, so a user can't read or change another branch's or another employee's data by calling the API directly.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, row-level security) · Vercel

## Run it locally

```bash
npm install
cp .env.production .env.local   # points at the Supabase project
npm run dev
```

The schema lives in `supabase/migrations/001_initial_schema.sql`.

A GitHub Action pings the database twice a week so the free Supabase project doesn't pause and the live demo stays up.
