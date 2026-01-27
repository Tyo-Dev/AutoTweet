'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import TweetCard from '@/components/TweetCard';

export default function Home() {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTweet, setGeneratedTweet] = useState('');
    const [explanation, setExplanation] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Handle Generate
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setGeneratedTweet(''); // Reset previous
        setExplanation('');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Generation failed');

            setGeneratedTweet(data.tweet);
            setExplanation(data.explanation);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle Post
    const handlePost = async () => {
        if (!generatedTweet) return;
        setIsPosting(true);

        try {
            const response = await fetch('/api/tweet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tweet: generatedTweet }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Posting failed');

            toast.success('Successfully posted to X!');
            setTopic('');
            setGeneratedTweet('');
            setExplanation('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">

            {/* Content Container */}
            <div className="w-full max-w-2xl z-10 flex flex-col items-center">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-mono text-purple-300 mb-6">
                        <Sparkles size={12} />
                        <span>AI POWERED V2.5</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-4">
                        AutoTweet-X
                    </h1>
                    <p className="text-white/50 text-lg max-w-md mx-auto">
                        Input a topic. Let AI craft the perfect viral post.
                    </p>
                </motion.div>

                {/* Input Area */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    onSubmit={handleGenerate}
                    className="w-full relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

                    <div className="relative glass-panel rounded-2xl p-2 flex items-center shadow-2xl">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="What's happening? e.g. 'The future of AI agents'..."
                            className="flex-1 bg-transparent border-none text-white placeholder-white/30 text-lg px-4 py-3 focus:outline-none"
                            disabled={isGenerating}
                        />

                        <button
                            type="submit"
                            disabled={!topic.trim() || isGenerating}
                            className={`
                px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2
                ${!topic.trim() || isGenerating
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-neutral-200'}
              `}
                        >
                            {isGenerating ? (
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            ) : (
                                <>
                                    Generate <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.form>

                {/* Result Area */}
                <AnimatePresence mode="wait">
                    {generatedTweet && (
                        <TweetCard
                            key="tweet-card"
                            content={generatedTweet}
                            explanation={explanation}
                            onUpdate={setGeneratedTweet}
                            onPost={handlePost}
                            isPosting={isPosting}
                        />
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
