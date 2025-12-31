# T5: Compliance & Tools Report

## Actions Taken
1. **Static Analysis**: installed `eslint-plugin-security` via npm.
2. **Automated Security Tests**:
    - Created `backend/tests/security/securityControls.test.js`.
    - Includes tests for: Audit Logs, Zero Trust strictness, SQL Injection patterns, and Prompt Injection.
3. **Execution**: Tests run via `npm test` (results logged).

## CI/CD Recommendations
- Add `npm run lint` with strict security rules to the pipeline.
- Ensure `vault_secrets.json` is **never** committed; use actual Vault Agent in real deployment.
