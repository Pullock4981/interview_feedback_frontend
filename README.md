# NexView Frontend

This is the Next.js frontend application for NexView - the Interview Feedback Management System.

## Features
- **Dashboard**: Overview of interviews and students.
- **Interviews Management**: Start, monitor, and submit comprehensive interview feedback.
- **Students Management**: Import and manage student lists using Google Sheets or manually.
- **Question Bank**: Configure course templates and question banks.
- **Dark Mode**: Fully supported dark/light theme toggle.

## Tech Stack
- [Next.js](https://nextjs.org/) (React framework)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [Lucide React](https://lucide.dev/) (Icons)
- [SweetAlert2](https://sweetalert2.github.io/) (Popups and Notifications)

## Getting Started

First, make sure you have your environment variables set up. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` to point to your backend API.

Then, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

This frontend is optimized for deployment on [Vercel](https://vercel.com/). Connect your GitHub repository to Vercel and it will automatically build and deploy the Next.js app. Make sure to set `NEXT_PUBLIC_API_URL` in the Vercel Environment Variables settings.
