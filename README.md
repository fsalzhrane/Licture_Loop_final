# LectureLoop - University Note Sharing App

LectureLoop is a web application designed for university students to share and organize lecture notes. Built with React, Supabase, and Tailwind CSS.

## Features

- User authentication with email/password
- Create and manage courses
- Upload and view lecture notes (images, PDFs, audio files)
- Organize notes by course
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **Routing**: React Router
- **Deployment**: Vercel/Netlify (recommended)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lecture-loop.git
cd lecture-loop
```

2. Install dependencies:

```bash
npm install
```

3. Connect to Supabase:

   - Click the "Connect to Supabase" button in StackBlitz
   - Or create a Supabase project manually at https://supabase.com
   - Add your Supabase URL and anon key to the `.env` file (see `.env.example`)

4. Run the development server:

```bash
npm run dev
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/create_tables.sql`
3. Enable Storage and create a bucket called "notes"
4. Set up bucket policies to allow authenticated users to upload files

## Deployment

The app can be deployed to any static hosting service:

1. Build the app:

```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service of choice (Vercel, Netlify, etc.)

## License

MIT