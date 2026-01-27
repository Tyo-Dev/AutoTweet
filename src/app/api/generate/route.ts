import { NextResponse } from 'next/server';
import { generateTweet } from '@/lib/openrouter';

export async function POST(request: Request) {
    try {
        const { topic, preferences } = await request.json();

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            );
        }

        const tweet = await generateTweet(topic, preferences);

        return NextResponse.json({ tweet });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate tweet' },
            { status: 500 }
        );
    }
}
