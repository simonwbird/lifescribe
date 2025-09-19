# Phase 1B: CI Integration Steps

## 📋 Required Package.json Script Additions

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "codemod:date-dry-run": "tsx scripts/codemod-date-formatting.ts",
    "codemod:date-apply": "tsx scripts/codemod-date-formatting.ts --fix", 
    "lint:date-formatting": "eslint --config .eslintrc.codemod.js src/**/*.{ts,tsx}",
    "lint:date-fix": "eslint --config .eslintrc.codemod.js --fix src/**/*.{ts,tsx}",
    "enforce-date-formatting": "npm run lint:date-formatting && echo '✅ All date formatting follows centralized patterns'"
  }
}
```

## 🔧 ESLint Plugin Setup

1. **Install ESLint plugin for local rules:**
```bash
npm install -D eslint-plugin-local-rules
```

2. **Update main .eslintrc.js to include local plugin:**
```javascript
module.exports = {
  extends: ['./.eslintrc.js'],
  plugins: ['local'],
  rules: {
    // Enforce centralized date formatting
    'local/no-ad-hoc-date-formatting': 'error',
    
    // Temporarily allow some patterns during migration
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^userRegion$' // Allow userRegion variable
    }],
  },
  settings: {
    'local-rules': {
      'no-ad-hoc-date-formatting': require('./eslint-rules/no-ad-hoc-date-formatting')
    }
  }
}
```

## 🚀 CI Pipeline Integration

### Pre-commit Hook (Recommended)
```bash
# Install husky if not already present
npm install -D husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint:date-formatting"
```

### GitHub Actions Workflow
The workflow file `.github/workflows/enforce-date-formatting.yml` is already created and will:

1. ✅ Run on all PRs touching TypeScript files
2. ✅ Check for ad-hoc date formatting violations
3. ✅ Verify formatForUser imports are present  
4. ✅ Fail CI if violations found
5. ✅ Provide helpful error messages with fix instructions

### Integration with Existing CI

Add to your main CI workflow (e.g., `.github/workflows/ci.yml`):

```yaml
- name: Check Date Formatting Standards
  run: npm run enforce-date-formatting
```

## 🎯 Enforcement Strategy 

### Phase 1: Warning Mode (1 week)
```javascript
// .eslintrc.js
'local-rules/no-ad-hoc-date-formatting': 'warn'
```
- Warnings appear but don't break CI
- Team gets familiar with new patterns
- Codemod can be applied incrementally

### Phase 2: Error Mode (After codemod)
```javascript
// .eslintrc.js  
'local-rules/no-ad-hoc-date-formatting': 'error'
```
- CI fails on violations
- Forces use of centralized utilities
- Prevents regression to ad-hoc patterns

## 📊 Monitoring & Metrics

### Track Compliance Progress
```bash
# Count remaining violations
npm run lint:date-formatting -- --format json | jq '.[] | length'

# Track by file type  
npm run lint:date-formatting | grep -E "src/.*.tsx?" | wc -l
```

### Pre-merge Checklist Template
```markdown
## Date Formatting Compliance ✅

- [ ] No ad-hoc `toLocaleDateString()` calls
- [ ] No `formatDistanceToNow()` in UI components  
- [ ] All date displays use `formatForUser()`
- [ ] User region context properly imported
- [ ] ESLint passes: `npm run lint:date-formatting`
```

## 🔧 Troubleshooting Guide

### Common ESLint Failures

**Error**: `formatForUser is not defined`
```typescript
// ❌ Missing import
{formatForUser(date, 'dateOnly', userRegion)}

// ✅ Add import
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
const userRegion = getCurrentUserRegion()
```

**Error**: `userRegion is not defined`  
```typescript
// ✅ Add at component start
const MyComponent = () => {
  const userRegion = getCurrentUserRegion()
  // ... rest of component
}
```

**Error**: `no-ad-hoc-date-formatting` violations
```typescript
// ❌ Ad-hoc formatting
{new Date(story.created_at).toLocaleDateString()}

// ✅ Centralized formatting  
{formatForUser(story.created_at, 'datetime', userRegion)}
```

### ESLint Auto-fix Not Working

1. **Check import is present:**
```typescript
import { formatForUser } from '@/utils/date'
```

2. **Run manual fix:**
```bash
npm run lint:date-fix
```

3. **Check file is not excluded:**
```javascript
// .eslintrc.codemod.js
ignorePatterns: [
  // Make sure your file isn't ignored
]
```

### CI Pipeline Failures

**Failure**: "formatForUser import missing"
- **Fix**: Add imports to files using `formatForUser`
- **Command**: `npm run lint:date-fix`

**Failure**: "Ad-hoc date formatting detected" 
- **Fix**: Run codemod or manual replacement
- **Command**: `npm run codemod:date-apply`

**Failure**: "Type errors after codemod"
- **Fix**: Ensure `userRegion` variable is defined
- **Check**: TypeScript compilation with `npm run type-check`

## 📈 Success Metrics 

### Week 1 (Warning Mode)
- [ ] ESLint rule deployed to CI
- [ ] Team notified of new patterns
- [ ] Codemod dry-run report reviewed

### Week 2 (Codemod Application)  
- [ ] Codemod applied to 80%+ of files
- [ ] High-confidence replacements automated
- [ ] Low-confidence cases manually reviewed

### Week 3 (Error Mode)
- [ ] ESLint rule switched to error
- [ ] CI pipeline enforcing compliance
- [ ] Zero ad-hoc date formatting violations

### Ongoing Maintenance
- [ ] New code automatically compliant
- [ ] Regular review of date utility usage
- [ ] Performance monitoring of centralized formatting

---

## 🚦 Ready to Execute

1. **Review dry-run report**: `CODEMOD_DRY_RUN_REPORT.md`  
2. **Apply codemod**: `npm run codemod:date-apply`
3. **Enable ESLint rule**: Update `.eslintrc.js`
4. **Commit and test**: Verify CI pipeline  
5. **Monitor compliance**: Track violations over time

*CI will fail until codemod sweep is merged and violations resolved*
