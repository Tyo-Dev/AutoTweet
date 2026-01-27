import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL,
        'X-Title': 'AutoTweet-X',
    },
});

export async function generateTweet(topic: string, specificPreferences?: string): Promise<{ tweet: string; explanation: string }> {
    try {
        const completion = await openai.chat.completions.create({
            model: 'meta-llama/llama-3-8b-instruct:free',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert social media manager specializing in X (Twitter).
Your task is to craft high-impact, engaging tweets based on the user's input, AND provide a deep strategic explanation.

RESPONSE FORMAT:
You must return a valid JSON object with exactly these two keys:
{
  "tweet": "The actual tweet content (under 280 chars)",
  "explanation": "A detailed explanation of why you wrote it this way, the context you assumed, and the strategy used."
}

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
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content?.trim();
        if (!content) throw new Error('No content received');

        try {
            const parsed = JSON.parse(content);
            return {
                tweet: parsed.tweet || content,
                explanation: parsed.explanation || "No explanation provided."
            };
        } catch (e) {
            // Fallback if JSON parsing fails but content exists
            return {
                tweet: content,
                explanation: "Could not parse AI explanation. "
            };
        }

    } catch (error: any) {
        console.error('OpenRouter Generation Error:', error);

        // Error Handling: Fallback to Mock Data
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
}
