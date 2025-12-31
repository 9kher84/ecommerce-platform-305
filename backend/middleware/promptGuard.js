const promptGuard = (req, res, next) => {
    // List of blocked keywords often used in prompt injection or malicious payloads
    const blockedKeywords = [
        'ignore previous instructions',
        'system prompt',
        'you are a generic chatbot',
        'bypass security',
        'drop table',
        'select * from', // Basic SQLi check (primitive)
        'exec(',
        'eval('
    ];

    const stringifyBody = JSON.stringify(req.body || {}).toLowerCase();
    const stringifyQuery = JSON.stringify(req.query || {}).toLowerCase();
    const stringifyParams = JSON.stringify(req.params || {}).toLowerCase();

    const checkInput = (input) => {
        for (const keyword of blockedKeywords) {
            if (input.includes(keyword)) {
                return keyword;
            }
        }
        return null;
    };

    const foundInBody = checkInput(stringifyBody);
    if (foundInBody) {
        console.warn(`[Security] Blocked request containing forbidden keyword in body: ${foundInBody}`);
        return res.status(403).json({ error: 'Malicious content detected.' });
    }

    const foundInQuery = checkInput(stringifyQuery);
    if (foundInQuery) {
        console.warn(`[Security] Blocked request containing forbidden keyword in query: ${foundInQuery}`);
        return res.status(403).json({ error: 'Malicious content detected.' });
    }

    const foundInParams = checkInput(stringifyParams);
    if (foundInParams) {
        console.warn(`[Security] Blocked request containing forbidden keyword in params: ${foundInParams}`);
        return res.status(403).json({ error: 'Malicious content detected.' });
    }

    next();
};

module.exports = promptGuard;
