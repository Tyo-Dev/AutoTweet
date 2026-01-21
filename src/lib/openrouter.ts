import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL,
        'X-Title': 'AutoTweet-X',
    },
});

export async function generateTweet(topic: string, specificPreferences?: string) {
    try {
        const completion = await openai.chat.completions.create({
            model: 'meta-llama/llama-3-8b-instruct:free', // Default to a stable free model
            messages: [
                {
                    role: 'system',
                    content: `You are an expert social media manager specializing in X (Twitter).
          Your task is to craft high-impact, engaging tweets based on the user's input.
          
          Guidelines:
          - **Length**: Strictly under 280 characters.
          - **Style**: Dynamic, professional yet accessible, potentially viral.
          - **Structure**: Hook -> Value/Point -> Call to Action (if appropriate).
          - **Formatting**: Use appropriate line breaks for readability.
          - **Hashtags**: Include 1-3 relevant, high-traffic hashtags.
          - **Response**: Return ONLY the tweet text. Do not include quotes or conversational filler.`
                },
                {
                    role: 'user',
                    content: `Topic: ${topic}\n${specificPreferences ? `Preferences: ${specificPreferences}` : ''}`
                }
            ],
            temperature: 0.8,
        });

        return completion.choices[0].message.content?.trim();
    } catch (error: any) {
        console.error('OpenRouter Generation Error:', error);

        // Error Handling: Fallback to Mock Data
        console.log('Falling back to dummy data...');

        const mockTweets = [
            `[DUMMY] AI agents are transforming the future! 🤖✨ Input: "${topic}". Imagine automated workflows that save hours. #AI #FutureOfWork`,
            `[DUMMY] Just explored "${topic}" and it's mind-blowing. 🚀 The tech landscape is shifting rapidly. Are you ready? #Tech #Innovation`,
            `[DUMMY] Why is everyone talking about "${topic}"? Because it's a game changer. 💡 Don't get left behind! #Trends #Growth`
        ];

        // Return a random dummy tweet
        return mockTweets[Math.floor(Math.random() * mockTweets.length)];
    }
}
