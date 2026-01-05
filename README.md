# FlashMind - AI-Powered Flashcard Learning Platform

A modern, full-stack flashcard application built with React, TypeScript, and Supabase. Create, organize, and share flashcards with AI-powered assistance.

## Features

- 🎴 **Create & Manage Decks**: Build custom flashcard decks with questions and answers
- 🤖 **AI-Powered Assistance**: Get AI-generated answers using Google Gemini API
- 🌐 **Public Sharing**: Share your decks publicly or keep them private
- 📊 **Progress Tracking**: Monitor your learning journey with analytics
- 👥 **Community Features**: Rate and comment on public decks
- 🔒 **Secure Authentication**: Powered by Supabase Auth with Row Level Security
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd flashcard-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create a Supabase project
   - Run the database migrations
   - Get your API keys

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_GEMINI_API_KEY=your_gemini_api_key
     ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`

## Project Structure

```
├── components/          # Reusable UI components
├── context/            # React context providers (Auth)
├── features/           # Feature-based components
│   ├── Auth.tsx       # Login/Register
│   ├── Landing.tsx    # Landing page
│   ├── DeckManagement.tsx
│   ├── Study.tsx
│   ├── PublicBrowser.tsx
│   ├── Admin.tsx
│   └── Profile.tsx
├── lib/                # Library configurations
│   └── supabase.ts    # Supabase client
├── services/           # Business logic and API calls
│   ├── supabaseService.ts
│   └── aiService.ts
├── supabase/
│   └── migrations/     # Database migration files
└── types.ts           # TypeScript type definitions
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- `user_profiles` - User account information
- `decks` - Flashcard decks
- `cards` - Individual flashcards
- `study_reviews` - Study progress tracking (SRS-ready)
- `deck_ratings` - User ratings for public decks
- `deck_comments` - Comments on public decks
- `admin_warnings` - Admin moderation warnings

See `supabase/migrations/` for the complete schema.

## Security

- **Row Level Security (RLS)**: All tables have RLS policies ensuring users can only access their own data
- **Supabase Auth**: Secure authentication with session management
- **API Key Protection**: Environment variables for sensitive keys

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- TypeScript for type safety
- Functional React components with hooks
- Tailwind CSS for styling
- ESLint for code quality (if configured)

## Deployment

### Vercel (Recommended for Frontend)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase Hosting

Supabase provides hosting for your database and API. The frontend can be deployed separately.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- AI powered by [Google Gemini](https://ai.google.dev)
- UI components styled with [Tailwind CSS](https://tailwindcss.com)
