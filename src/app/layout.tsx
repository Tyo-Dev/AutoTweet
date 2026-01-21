import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'AutoTweet-X | AI Post Generator',
    description: 'Generate viral X posts with AI',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={outfit.variable}>
            <body className="antialiased selection:bg-purple-500/30 selection:text-white">
                {/* Background Aurora Effect */}
                <div className="aurora-bg" />

                {children}

                <Toaster
                    position="bottom-center"
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: 'rgba(20, 20, 20, 0.8)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                        }
                    }}
                />
            </body>
        </html>
    );
}
