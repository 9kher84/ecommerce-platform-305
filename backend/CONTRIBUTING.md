# Contributing to E-Commerce Platform

Thank you for your interest in contributing to our e-commerce platform! This document provides guidelines and best practices for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Security Guidelines](#security-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Error Handling](#error-handling)
- [Documentation](#documentation)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Prioritize security and user privacy

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- Redis >= 6.0 (optional)
- Git

### Setup Development Environment

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ecommerce-platform.git
   cd ecommerce-platform/backend
   ```

2. **Install Dependencies**

   ```bash
   npm ci  # Use ci for reproducible installs
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Setup Database**

   ```bash
   createdb ecommerce_db_dev
   node seed.js
   ```

5. **Run Tests**

   ```bash
   npm test
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical production fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(auth): add refresh token rotation
fix(quotes): prevent self-trading fraud
docs(api): update swagger documentation
test(integration): add SSRF protection tests
```

## 💻 Coding Standards

### JavaScript Style Guide

1. **Use ES6+ Features**

   ```javascript
   // Good
   const { User } = require("../models");
   const users = await User.findAll();

   // Avoid
   var User = require("../models").User;
   ```

2. **Async/Await over Callbacks**

   ```javascript
   // Good
   const user = await User.findByPk(id);

   // Avoid
   User.findByPk(id).then(user => { ... });
   ```

3. **Destructuring**

   ```javascript
   // Good
   const { email, password } = req.body;

   // Avoid
   const email = req.body.email;
   const password = req.body.password;
   ```

4. **Arrow Functions**

   ```javascript
   // Good
   const getUser = async (id) => {
     return await User.findByPk(id);
   };

   // Avoid
   function getUser(id) {
     return User.findByPk(id);
   }
   ```

### File Organization

```javascript
// 1. External dependencies
const express = require("express");
const { Op } = require("sequelize");

// 2. Internal dependencies
const { User } = require("../models");
const { AuthenticationError } = require("../utils/errors");
const { getMessage } = require("../utils/responseMessages");

// 3. Configuration
const config = require("../config");

// 4. Constants
const MAX_LOGIN_ATTEMPTS = 5;

// 5. Functions
const login = async (req, res, next) => {
  // Implementation
};

// 6. Exports
module.exports = { login };
```

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `camelCase.js` or `PascalCase.js` (for classes)
- **Folders**: `lowercase` or `kebab-case`

## 🔒 Security Guidelines

### Critical Rules

1. **NEVER Commit Secrets**

   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use Custom Error Classes**

   ```javascript
   // Good
   const { AuthenticationError } = require("../utils/errors");
   throw new AuthenticationError("Invalid credentials");

   // Avoid
   res.status(401).json({ error: "Invalid credentials" });
   ```

3. **Validate All Inputs**

   ```javascript
   // Good
   const { error, value } = schema.validate(req.body);
   if (error) {
     throw new ValidationError(error.message);
   }

   // Avoid
   const user = await User.create(req.body); // Dangerous!
   ```

4. **Sanitize User Input**

   ```javascript
   // Already handled by middleware, but be aware
   const sanitized = xss(userInput);
   ```

5. **Use Parameterized Queries**

   ```javascript
   // Good (Sequelize handles this)
   const user = await User.findOne({ where: { email } });

   // Avoid raw queries without parameters
   await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`);
   ```

6. **HttpOnly Cookies for Tokens**

   ```javascript
   // Good
   res.cookie("token", jwt, {
     httpOnly: true,
     secure: process.env.NODE_ENV === "production",
     sameSite: "Strict",
   });

   // Avoid
   res.json({ token: jwt }); // Never send tokens in JSON!
   ```

7. **Rate Limiting**
   ```javascript
   // Already configured, but be aware of endpoints that need it
   router.post("/login", loginLimiter, login);
   ```

### SSRF Protection

```javascript
// Good - Use fetchProtected utility
const { fetchImageProtected } = require("../utils/fetchProtected");
const image = await fetchImageProtected(imageUrl);

// Avoid - Direct fetch without validation
const response = await axios.get(imageUrl); // Dangerous!
```

### Fraud Detection

```javascript
// Always capture device fingerprint for sensitive operations
const deviceFingerprint = req.headers["x-device-fingerprint"];

// Check for self-trading
const { detectSelfTrading } = require("../utils/fraudDetection");
if (detectSelfTrading(buyerFingerprint, sellerFingerprint)) {
  throw new FraudDetectionError("Self-trading detected");
}
```

## 🧪 Testing Requirements

### Test Coverage

All new features MUST include tests:

- **Integration Tests**: For API endpoints
- **Unit Tests**: For business logic

### Writing Tests

```javascript
describe('Feature Name', () => {
    beforeAll(async () => {
        // Setup
    });

    afterAll(async () => {
        // Cleanup
    });

    it('should do something specific', async () => {
        // Arrange
        const input = { ... };

        // Act
        const result = await someFunction(input);

        // Assert
        expect(result).toBeDefined();
        expect(result.status).toBe('success');
    });
});
```

### Running Tests

```bash
# All tests
npm test

# Specific suite
npm test tests/integration/auth.test.js

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Requirements for PR

- ✅ All existing tests must pass
- ✅ New features must have tests
- ✅ Coverage should not decrease
- ✅ Tests should be meaningful

## 📝 Error Handling

### Use Custom Error Classes

```javascript
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  FraudDetectionError,
} = require("../utils/errors");

// Examples
throw new ValidationError("Invalid email format");
throw new AuthenticationError("Invalid credentials");
throw new AuthorizationError("Admin access required");
throw new NotFoundError("User");
throw new FraudDetectionError("Self-trading detected");
```

### Error Response Structure

All errors should follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {} // Optional
  }
}
```

### Centralized Messages

```javascript
const { getMessage } = require("../utils/responseMessages");

// Get message in Arabic (default)
const message = getMessage("AUTH_REQUIRED");

// Get message in English
const message = getMessage("AUTH_REQUIRED", "en");

// Dynamic messages
const message = getMessage("PLAN_CONTACT_LIMIT", "ar", "Free", 1);
```

## 📚 Documentation

### Code Comments

```javascript
/**
 * Authenticate user and return JWT token
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 * @throws {AuthenticationError} If credentials are invalid
 * @throws {ValidationError} If required fields are missing
 */
const login = async (req, res, next) => {
  // Implementation
};
```

### API Documentation (Swagger)

Add JSDoc comments to routes:

```javascript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);
```

## 🔄 Pull Request Process

### Before Submitting

1. ✅ Run all tests: `npm test`
2. ✅ Run linter: `npm run lint` (if configured)
3. ✅ Update documentation
4. ✅ Add/update tests
5. ✅ Check for security issues
6. ✅ Rebase on latest main

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] All tests pass
- [ ] New tests added
- [ ] Manual testing completed

## Security Checklist

- [ ] No secrets committed
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] SSRF protection considered

## Documentation

- [ ] README updated
- [ ] API docs updated
- [ ] Code comments added
```

### Review Process

1. Automated checks must pass
2. At least one approval required
3. All conversations resolved
4. No merge conflicts

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment:**

- OS: [e.g., Ubuntu 20.04]
- Node version: [e.g., 16.14.0]
- Browser: [e.g., Chrome 96]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions

**Additional context**
Mockups, examples, etc.
```

## 📞 Getting Help

- **Documentation**: Check README.md and API docs
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Email**: support@example.com

## 🎯 Priority Areas

Current focus areas for contributions:

1. Test coverage improvement
2. Performance optimization
3. Documentation enhancement
4. Bug fixes
5. Security improvements

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing! 🙏**
