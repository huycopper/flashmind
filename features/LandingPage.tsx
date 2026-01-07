import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="bg-surface p-6 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:-translate-y-1 animate-slide-up">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary animate-float">
            {icon}
        </div>
        <h3 className="text-xl font-medium text-textPrimary mb-2">{title}</h3>
        <p className="text-textSecondary leading-relaxed">{description}</p>
    </div>
);

export const LandingPage: React.FC = () => {
    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
            {/* Hero Section */}
            <section className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-background text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="space-y-4 animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-textPrimary">
                            Master any subject with
                            <span className="text-primary block mt-2">FlashMind AI</span>
                        </h1>
                        <p className="text-xl text-textSecondary max-w-2xl mx-auto">
                            Create intelligent flashcards instantly using AI. Share your decks with a global community and discover thousands of public learning resources.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
                        <Link
                            to="/register"
                            className="px-8 py-3 bg-primary text-white text-lg font-medium rounded-full hover:bg-blue-600 transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Get Started for Free
                        </Link>
                        <Link
                            to="/public"
                            className="px-8 py-3 bg-white text-primary text-lg font-medium rounded-full border border-border hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Explore Public Decks
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-textPrimary mb-4">Why choose FlashMind?</h2>
                        <p className="text-textSecondary text-lg max-w-2xl mx-auto">
                            Our platform combines cognitive science with advanced AI to deliver the most effective study experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            title="AI-Powered Creation"
                            description="Generate comprehensive flashcard decks from any text or topic in seconds using our advanced AI."
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            }
                        />
                        <FeatureCard
                            title="Create Flashcards"
                            description="Easily build your own custom decks. Add terms, definitions, and organize your study materials your way."
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        />
                        <FeatureCard
                            title="Community Library"
                            description="Access a vast library of shared decks from other learners. Study anything from languages to coding."
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};
