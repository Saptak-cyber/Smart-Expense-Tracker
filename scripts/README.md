# Pre-Deployment Checks

This directory contains scripts to ensure code quality before deployment.

## Scripts

### pre-deploy.sh

Runs comprehensive checks before deploying:

- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Code formatting verification
- ✅ Production build test

**Usage:**

```bash
./scripts/pre-deploy.sh
```

**Recommended:** Run this before every `git push`

## Quick Commands

```bash
# Run all checks
./scripts/pre-deploy.sh

# Run checks and push if successful
./scripts/pre-deploy.sh && git push

# Individual checks
npm run type-check  # Type checking only
npm run lint        # Linting only
npm run format      # Auto-fix formatting
npm run test:build  # All checks + build
```
