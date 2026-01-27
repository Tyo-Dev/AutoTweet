'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TweetCardProps {
    content: string;
    explanation?: string;
    onUpdate: (newContent: string) => void;
    onPost: () => void;
    isPosting: boolean;
}

export default function TweetCard({ content, explanation, onUpdate, onPost, isPosting }: TweetCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);

    useEffect(() => {
        setEditedContent(content);
    }, [content]);

    const handleCopy = () => {
        navigator.clipboard.writeText(editedContent);
        toast.success('Tweet copied to clipboard!');
    };

    const handleSave = () => {
        onUpdate(editedContent);
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass-card w-full max-w-xl mx-auto rounded-2xl p-6 mt-8 relative group overflow-hidden"
        >
            {/* Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            X
                        </div>
                        <span className="text-white/80 font-medium text-sm">Preview</span>
                    </div>

                    <div className="flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                                title="Edit Tweet"
                            >
                                <Edit2 size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="p-2 hover:bg-green-500/20 rounded-full transition-colors text-green-400 hover:text-green-300"
                                title="Save Changes"
                            >
                                <Check size={16} />
                            </button>
                        )}
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                            title="Copy to Clipboard"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {isEditing ? (
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full bg-black/20 text-white border border-white/10 rounded-xl p-4 min-h-[120px] focus:ring-1 focus:ring-blue-500 outline-none resize-none font-sans text-lg leading-relaxed"
                        />
                    ) : (
                        <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap font-sans min-h-[120px]">
                            {editedContent}
                        </p>
                    )}

                    <div className={`mt-2 text-right text-xs ${editedContent.length > 280 ? 'text-red-400' : 'text-white/40'}`}>
                        {editedContent.length} / 280
                    </div>
                </div>

                {/* AI Explanation Section */}
                {explanation && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                                <span className="text-xs">✨</span>
                            </div>
                            <h3 className="text-sm font-semibold text-purple-200">AI Strategy Insight</h3>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed italic bg-white/5 p-4 rounded-xl border border-white/5">
                            "{explanation}"
                        </p>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onPost}
                        disabled={isPosting || editedContent.length > 280}
                        className={`
              relative overflow-hidden group/btn px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300
              ${isPosting || editedContent.length > 280
                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                : 'bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]'}
            `}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isPosting ? 'Posting...' : 'Post to X'}
                            {!isPosting && <Send size={14} className="-mt-0.5" />}
                        </span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
