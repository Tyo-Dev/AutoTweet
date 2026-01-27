import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AutoTweet-X',
    },
});

// List of free models to try in order of preference/capability
const MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'openchat/openchat-7:free',
    'qwen/qwen-2.5-72b-instruct:free', // High capability back up
    'microsoft/phi-3-medium-128k-instruct:free'
];

// Google Gemini Direct Fallback
async function generateWithGeminiFallback(topic: string, specificPreferences?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found');
    }

    console.log('Attempting generation with Gemini Direct API (Fallback)...');

    const prompt = `You are an expert social media manager specializing in X (Twitter).
Your task is to craft high-impact, engaging tweets based on the user's input.

Topic: ${topic}
${specificPreferences ? `Preferences: ${specificPreferences}` : ''}

Guidelines:
- **Length**: Strictly under 280 characters.
- **Style**: Dynamic, professional yet accessible, potentially viral.
- **Structure**: Hook -> Value/Point -> Call to Action (if appropriate).
- **Hashtags**: Include 1-3 relevant, high-traffic hashtags.
- **Response**: Return ONLY the tweet text. Do not include quotes, explanations, or conversational filler.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error('No content from Gemini');

    return content.trim();
}

export async function generateTweet(topic: string, specificPreferences?: string): Promise<string> {
    let lastError = null;

    // 1. Try OpenRouter Models
    for (const model of MODELS) {
        try {
            console.log(`Attempting generation with model: ${model}`);

            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert social media manager specializing in X (Twitter).
Your task is to craft high-impact, engaging tweets based on the user's input.

Guidelines:
- **Length**: Strictly under 280 characters.
- **Style**: Dynamic, professional yet accessible, potentially viral.
- **Structure**: Hook -> Value/Point -> Call to Action (if appropriate).
- **Hashtags**: Include 1-3 relevant, high-traffic hashtags.
- **Response**: Return ONLY the tweet text. Do not include quotes, explanations, or conversational filler.`
                    },
                    {
                        role: 'user',
                        content: `Topic: ${topic}\n${specificPreferences ? `Preferences: ${specificPreferences}` : ''}`
                    }
                ],
                temperature: 0.8,
                // Removed strict response_format as it causes 400s on some free models
            });

            const content = completion.choices[0].message.content?.trim();
            if (!content) throw new Error('No content received');

            return content.replace(/^"|"$/g, ''); // Simple cleanup

        } catch (error: any) {
            console.warn(`Model ${model} failed:`, error.message || error);
            if (error?.response) {
                console.warn(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
            }
            lastError = error;
            // Continue to next model
        }
    }

    // 2. Try Gemini Direct Fallback
    try {
        return await generateWithGeminiFallback(topic, specificPreferences);
    } catch (geminiError: any) {
        console.error('Gemini Fallback Failed:', geminiError.message);
        lastError = geminiError;
    }

    // 3. Last Resort: Dummy Data
    console.error('All models (OpenRouter + Gemini Direct) failed. Last error:', lastError);
    console.log('Falling back to dummy data...');

    const mockTweets = [
        `[DUMMY] AI agents are transforming the future! 🤖✨ Input: "${topic}". Imagine automated workflows that save hours. #AI #FutureOfWork`,
        `[DUMMY] Just explored "${topic}" and it's mind-blowing. 🚀 The tech landscape is shifting rapidly. Are you ready? #Tech #Innovation`,
        `[DUMMY] Why is everyone talking about "${topic}"? Because it's a game changer. 💡 Don't get left behind! #Trends #Growth`
    ];

    // Return a random dummy tweet
    return mockTweets[Math.floor(Math.random() * mockTweets.length)];
}
