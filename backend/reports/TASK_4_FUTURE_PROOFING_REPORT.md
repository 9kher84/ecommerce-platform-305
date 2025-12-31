# T4: Future Proofing Report

## Actions Taken
1. **Prompt Guard**: Implemented `backend/middleware/promptGuard.js` to block malicious LLM injection prompts (e.g., "ignore previous instructions").
2. **Central Check**: Implemented `backend/middleware/sanitize.js` to recursively clean all `req.body`, `req.query`, and `req.params`.
3. **Integration**: Verified both middleware are active in `backend/server.js` before the request routing layer.

## Tests
- Added `tests/security/securityControls.test.js` which includes specific cases verifying that blocked keywords receive a 403 Forbidden response.
