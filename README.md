# FlashMind 🧠

FlashMind is a modern, AI-powered flashcard application designed to help you learn faster and retain information longer. Built with React, TypeScript, and Supabase, it offers a seamless experience for creating, studying, and sharing flashcard decks.

You can visit on: https://flashmind-phi.vercel.app/

### Tech Stack

*   **Frontend:** [React](https://reactjs.org/) (v18), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Real-time)
*   **AI:** [Google Gemini API](https://deepmind.google/technologies/gemini/)

### For setting up the project locally.
### Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn
*   A Supabase account
*   A Google Cloud project with Gemini API enabled

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/flashmind.git
    cd flashmind
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    npm run dev
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory based on the following template:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEY=your_gemini_api_key
    ```
