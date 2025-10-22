# Contributing to Rustle.dev

Thank you for your interest in contributing to Rustle.dev! We welcome contributions from the community and are excited to see what you'll build.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/rustle.dev.git
   cd rustle.dev
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```
5. **Run tests**:
   ```bash
   npm test
   ```

## 📋 Development Guidelines

### Code Style
- Use **TypeScript** for all new code
- Follow the existing **ESLint** configuration
- Write **comprehensive tests** for new features
- Use **meaningful commit messages** following conventional commits

### Testing
- Write unit tests for all new functions and components
- Ensure all tests pass before submitting a PR
- Aim for **80%+ test coverage**
- Test both happy path and edge cases

### Documentation
- Update README.md if adding new features
- Add JSDoc comments for public APIs
- Include examples for complex functionality
- Update TypeScript definitions

## 🐛 Bug Reports

When filing a bug report, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (Node.js version, React version, etc.)
5. **Minimal reproduction** if possible

## ✨ Feature Requests

For new features, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and motivation
3. **Provide examples** of how it would be used
4. **Consider backwards compatibility**

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git

### Local Development
```bash
# Install dependencies
npm install

# Start development build
npm run dev

# Run tests in watch mode
npm run test:watch

# Type checking
npm run check-types

# Linting
npm run lint
```

### Building
```bash
# Production build
npm run build

# Clean build artifacts
npm run clean
```

## 📦 Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our guidelines

3. **Test thoroughly**:
   ```bash
   npm test
   npm run build
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add new translation feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### PR Requirements
- ✅ All tests pass
- ✅ Code follows style guidelines
- ✅ Documentation is updated
- ✅ No breaking changes (unless discussed)
- ✅ Includes appropriate tests

## 🏗️ Architecture Overview

### Core Components
- **RustleBox**: Main wrapper component
- **RustleGo**: Dynamic content translation
- **TranslatedHTML**: HTML content support
- **useRustle/applyRustle**: React hooks

### Key Concepts
- **Fingerprinting**: Content identification system
- **Batch Processing**: Optimized API calls
- **Cache Strategy**: Memory → Static → API
- **Framework Agnostic**: Works with React, Next.js, and vanilla JS

## 🔒 Security

### Reporting Security Issues
Please **DO NOT** file public issues for security vulnerabilities. Instead:

1. Email us at **support@rustle.dev**
2. Include detailed description
3. Provide steps to reproduce
4. We'll respond within 48 hours

### Security Guidelines
- Never commit API keys or secrets
- Validate all user inputs
- Use HTTPS for all API calls
- Follow OWASP security practices

## 📄 License

By contributing to Rustle.dev, you agree that your contributions will be licensed under the Apache-2.0 License.

## 🤝 Community

- **Website**: https://rustle.dev
- **Documentation**: https://rustle.dev/docs
- **Issues**: https://github.com/rustledotdev/rustle.dev/issues
- **Email**: support@rustle.dev

## 🙏 Recognition

Contributors will be recognized in our README.md and release notes. Thank you for making Rustle.dev better!

---

**Happy Contributing!** 🎉
