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

    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';

    // For Twitter API v2 with JSON body, we do NOT include the body in the OAuth 1.0a signature.
    // The signature is generated only based on the URL and Method (and query params, if any).
    const request_data_for_signing = {
        url: url,
        method: method,
        data: {}, // KEEP EMPTY for JSON body requests
    };

    const headers = oauth.toHeader(oauth.authorize(request_data_for_signing, token));

    const response = await fetch(url, {
        method: method,
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Return clear error about quotas if 429/402/403
        if (response.status === 402 || response.status === 429) {
            throw new Error(`Twitter Daily/Monthly Quota Exceeded (Status ${response.status}). You have run out of free tweets.`);
        }
        throw new Error(`Twitter API v2 Failed: ${response.status} ${response.statusText} - ${errorText}`);
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
