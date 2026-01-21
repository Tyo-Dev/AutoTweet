import { NextResponse } from 'next/server';
import { postTweet, verifyCredentials } from '@/lib/twitter';

export async function POST(request: Request) {
    try {
        const { tweet } = await request.json();

        if (!tweet) {
            return NextResponse.json(
                { error: 'Tweet content is required' },
                { status: 400 }
            );
        }

        // Attempt to post the tweet using Manual Fetch (Bypassing broken library)
        console.log('Attempting post via Manual Fetch...');

        try {
            const userCheck = await verifyCredentials();
            console.log('Manual Verify Success:', userCheck);
        } catch (e: any) {
            console.error('Manual Verify Failed:', e.message);
        }

        const createdTweet = await postTweet(tweet);

        return NextResponse.json({
            success: true,
            id: createdTweet.data.id,
            text: createdTweet.data.text
        });
    } catch (error: any) {
        console.error('Twitter API Error (toString):', error.toString());
        console.error('Twitter API Error Message:', error.message);
        console.error('Twitter API Error Stack:', error.stack);

        if (error.response) {
            console.error('Twitter API Error Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Twitter API Error Response Status:', error.response.status);
        }

        // Better error message for the frontend
        const errorMessage = error?.data?.detail || error?.message || 'Failed to post tweet';

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
