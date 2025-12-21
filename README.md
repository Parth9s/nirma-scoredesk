# Nirma ScoreDesk 🎓

![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

**Nirma ScoreDesk** is a comprehensive academic dashboard designed to help engineering students track their academic performance, manage resources, and plan their attendance strategically.

> **Note**: This repository is a showcase of my work. The source code is proprietary and not open for unauthorized use.

## 🚀 Features

### 📊 Academic Tracking
- **SGPA Calculator**: Real-time SGPA prediction based on current marks and semester curriculum.
- **Attendance Manager**: "Safe to Bunk" calculator helping students maintain the mandatory 75% threshold.
- **Grade Analytics**: Visual breakdown of grades across subjects.

### 📚 Resource Hub
- **PYQ Repository**: Filterable access to Previous Year Questions for exam prep.
- **Student Notes**: Community-driven sharing of study materials and handwritten notes.
- **Smart Filtering**: Server-side optimized filtering by Branch and Semester.

### 🗓️ Smart Calendar
- **Academic Schedule**: Integrated academic calendar with holidays and events.
- **Vacation Planner**: AI-powered suggestions to combine weekends with holidays for extended breaks (e.g., "Take Monday off for a 4-day weekend!").
- **Marquee Events**: Dynamic, high-performance marquee animations for upcoming alerts.

### 🛡️ Admin Panel
- **Secure Management**: Protected routes for managing Subjects, Resources, and Holidays.
- **RBAC**: Role-based access control protecting critical write operations.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon.tech](https://neon.tech/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (v5)
- **Deployment**: [Vercel](https://vercel.com/)

## ⚡ Performance

- **LCP**: ~0.19s (Optimized for speed)
- **Server-Side Filtering**: Minimized data payload for filtered lookups.
- **Optimized Assets**: Dynamic imports and code splitting.

---

### © 2024 Parth Savaliya. All Rights Reserved.
