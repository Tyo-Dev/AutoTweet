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
async function generateWithGeminiFallback(topic: string, specificPreferences?: string): Promise<{ tweet: string; explanation: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found');
    }

    console.log('Attempting generation with Gemini Direct API (Fallback)...');

    const prompt = `You are an expert social media manager specializing in X (Twitter).
Your task is to craft high-impact, engaging tweets based on the user's input, AND provide a deep strategic explanation.

Topic: ${topic}
${specificPreferences ? `Preferences: ${specificPreferences}` : ''}

RESPONSE FORMAT:
You MUST return a valid JSON object with exactly these two keys:
{
  "tweet": "The actual tweet content (under 280 chars)",
  "explanation": "A detailed explanation of why you wrote it this way, the context you assumed, and the strategy used."
}
DO NOT wrap the result in markdown code blocks. Just return the raw JSON string.

Guidelines for Tweet:
- **Length**: Strictly under 280 characters.
- **Style**: Dynamic, professional yet accessible, potentially viral.
- **Structure**: Hook -> Value/Point -> Call to Action (if appropriate).
- **Hashtags**: Include 1-3 relevant, high-traffic hashtags.

Guidelines for Explanation:
- Explain the choice of words, tone, and structure.
- Describe the target audience and expected engagement.
- Provide context on why this angle works for the given topic.
- Be verbose and educational (give a solid, insightful logic).`;

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

    try {
        const cleanContent = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleanContent);
        return {
            tweet: parsed.tweet || cleanContent,
            explanation: parsed.explanation || "No explanation provided."
        };
    } catch (e: any) {
        // Try loose matching
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                tweet: parsed.tweet || content,
                explanation: parsed.explanation || "No explanation provided."
            };
        }
        throw new Error('Failed to parse Gemini JSON');
    }
}

export async function generateTweet(topic: string, specificPreferences?: string): Promise<{ tweet: string; explanation: string }> {
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
Your task is to craft high-impact, engaging tweets based on the user's input, AND provide a deep strategic explanation.

RESPONSE FORMAT:
You MUST return a valid JSON object with exactly these two keys:
{
  "tweet": "The actual tweet content (under 280 chars)",
  "explanation": "A detailed explanation of why you wrote it this way, the context you assumed, and the strategy used."
}
DO NOT wrap the result in markdown code blocks like \`\`\`json. Just return the raw JSON string.

Guidelines for Tweet:
- **Length**: Strictly under 280 characters.
- **Style**: Dynamic, professional yet accessible, potentially viral.
- **Structure**: Hook -> Value/Point -> Call to Action (if appropriate).
- **Hashtags**: Include 1-3 relevant, high-traffic hashtags.

Guidelines for Explanation:
- Explain the choice of words, tone, and structure.
- Describe the target audience and expected engagement.
- Provide context on why this angle works for the given topic.
- Be verbose and educational (give a solid, insightful logic).
`
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

            try {
                // Remove any potential markdown wiring before parsing
                const cleanContent = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
                const parsed = JSON.parse(cleanContent);
                return {
                    tweet: parsed.tweet || content,
                    explanation: parsed.explanation || "No explanation provided."
                };
            } catch (e) {
                // Try loose matching if strict parsing fails
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        tweet: parsed.tweet || content,
                        explanation: parsed.explanation || "No explanation provided."
                    };
                }

                throw new Error('Failed to parse JSON response');
            }

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
        {
            tweet: `[DUMMY] AI agents are transforming the future! 🤖✨ Input: "${topic}". Imagine automated workflows that save hours. #AI #FutureOfWork`,
            explanation: "This tweet leverages the trending topic of AI agents to create immediate interest. The hook 'transforming the future' appeals to forward-thinking tech enthusiasts. The use of emojis adds visual appeal, and the hashtags target the relevant communities for maximum visibility."
        },
        {
            tweet: `[DUMMY] Just explored "${topic}" and it's mind-blowing. 🚀 The tech landscape is shifting rapidly. Are you ready? #Tech #Innovation`,
            explanation: "This tweet uses a personal discovery angle ('Just explored') to make the content relatable. The question 'Are you ready?' creates a sense of FOMO (Fear Of Missing Out), encouraging engagement and clicks."
        },
        {
            tweet: `[DUMMY] Why is everyone talking about "${topic}"? Because it's a game changer. 💡 Don't get left behind! #Trends #Growth`,
            explanation: "This tweet uses a question-answer format to immediately provide value. It positions the topic as 'everyone is talking about it', which serves as social proof. The phrase 'game changer' reinforces its importance."
        }
    ];

    // Return a random dummy tweet
    return mockTweets[Math.floor(Math.random() * mockTweets.length)];
}
