import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const oauth = new OAuth({
    consumer: {
        key: (process.env.TWITTER_API_KEY || '').trim(),
        secret: (process.env.TWITTER_API_SECRET || '').trim(),
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64');
    },
});

export async function postTweet(text: string) {
    const token = {
        key: (process.env.TWITTER_ACCESS_TOKEN || '').trim(),
        secret: (process.env.TWITTER_ACCESS_SECRET || '').trim(),
    };

    // ATTEMPT 2: Try v1.1 Endpoint (Legacy) - Sometimes Free Tier works here if v2 is bugged
    // Note: v1.1 uses query parameters or form-urlencoded body, simpler signature
    const request_data = {
        url: 'https://api.twitter.com/1.1/statuses/update.json',
        method: 'POST',
        data: { status: text },
    };

    // For v1.1 Form URL Encoded, we MUST include data in signature
    const headers = oauth.toHeader(oauth.authorize(request_data, token));

    // Convert data to URLSearchParams for body
    const body = new URLSearchParams();
    body.append('status', text);

    const response = await fetch(request_data.url, {
        method: request_data.method,
        headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twitter API (Fetch v1.1) Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
}

export async function verifyCredentials() {
    const token = {
        key: (process.env.TWITTER_ACCESS_TOKEN || '').trim(),
        secret: (process.env.TWITTER_ACCESS_SECRET || '').trim(),
    };

    const request_data = {
        url: 'https://api.twitter.com/2/users/me',
        method: 'GET',
    };

    const headers = oauth.toHeader(oauth.authorize(request_data, token));

    const response = await fetch(request_data.url, {
        method: request_data.method,
        headers: {
            ...headers,
        },
    });

    if (!response.ok) {
        throw new Error(`Verify Failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
