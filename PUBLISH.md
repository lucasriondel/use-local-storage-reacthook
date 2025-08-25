# Publishing Guide

This project uses GitHub Actions to automatically publish to NPM. Here's how it works and how to set it up.

## 🚀 How It Works

The workflow (`/.github/workflows/publish.yml`) automatically:

1. **Lints** the code using ESLint
2. **Type checks** using TypeScript
3. **Tests** the code using Vitest
4. **Builds** the project using Rollup
5. **Bumps the version** (if needed)
6. **Publishes** to NPM
7. **Creates a GitHub release**

## 🔧 Setup Required

### 1. NPM Token

You need to create an NPM access token and add it to your GitHub repository secrets:

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click your profile → "Access Tokens"
3. Click "Generate New Token" → "Classic Token"
4. Select "Automation" (for CI/CD)
5. Copy the token
6. In your GitHub repo: Settings → Secrets and variables → Actions
7. Add new secret: `NPM_TOKEN` with your token value

### 2. Repository Settings

Make sure your repository has:

- **Write permissions for GitHub Actions**:
  - Go to Settings → Actions → General → Workflow permissions
  - Select "Read and write permissions"
  - Check "Allow GitHub Actions to create and approve pull requests"
- **Contents permission**: The workflow needs to push tags and commits back to the repository

## 📦 Version Control

### Automatic Triggers

The workflow runs automatically on pushes to `main` when:

- Files in `lib/` directory change
- `package.json` changes
- `tsconfig.json` changes
- `rollup.config.js` changes

### Manual Triggers

You can manually trigger a release:

1. Go to Actions tab in your GitHub repo
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Choose version bump type:
   - **patch** (1.0.0 → 1.0.1) - Bug fixes
   - **minor** (1.0.0 → 1.1.0) - New features
   - **major** (1.0.0 → 2.0.0) - Breaking changes
   - **prerelease** (1.0.0 → 1.0.1-0) - Pre-release versions

### Commit Message Control

You can control version bumping with commit messages:

```bash
# Patch version (default)
git commit -m "fix: resolve URL parsing issue"

# Minor version
git commit -m "feat: add new URL state hook"
git commit -m "something [minor]"

# Major version
git commit -m "feat!: redesign API BREAKING CHANGE: removed old methods"
git commit -m "something [major]"

# Prerelease
git commit -m "feat: experimental feature [prerelease]"
```

## 🔄 Workflow Steps

### 1. Code Quality Checks

- **Linting**: Ensures code follows style guidelines
- **Type Checking**: Validates TypeScript types
- **Testing**: Runs all test suites

### 2. Version Management

- Automatically detects if version bump is needed
- Supports semantic versioning (semver)
- Creates git tags for releases

### 3. Publishing

- Builds the project
- Publishes to NPM with public access
- Creates GitHub release with changelog

### 4. Error Handling

- Fails fast if any step fails
- Provides clear error messages
- Notifies about common setup issues

## 📝 Best Practices

### Before Publishing

1. Ensure all tests pass locally: `pnpm test`
2. Check linting: `pnpm lint`
3. Verify build works: `pnpm build`
4. Review changes in the `lib/` directory

### Version Strategy

- **Patch**: Bug fixes, typos, minor improvements
- **Minor**: New features that don't break existing code
- **Major**: Breaking changes that require users to update their code
- **Prerelease**: Experimental features or beta versions

### Security

- Never commit NPM tokens to the repository
- Use repository secrets for all sensitive data
- Regularly rotate access tokens

## 🐛 Troubleshooting

### Common Issues

**"NPM_TOKEN secret not set"**

- Add NPM_TOKEN to repository secrets

**"Package name already exists"**

- The package name in `package.json` conflicts with existing NPM package
- Change the name or use scoped packages (`@username/package-name`)

**"Tests failed"**

- Fix failing tests before publishing
- Check test output in Actions logs

**"Build failed"**

- Check TypeScript errors
- Verify all dependencies are installed
- Review build configuration

**"Version already exists"**

- The version in `package.json` is already published
- The workflow will automatically bump the version

### Getting Help

1. Check the Actions logs for detailed error messages
2. Verify all required secrets are set
3. Ensure repository permissions are correct
4. Test locally before pushing

## 🎯 Example Usage

```bash
# Quick patch release
git add .
git commit -m "fix: resolve edge case in URL parsing"
git push origin main
# → Automatically publishes patch version

# Feature release
git add .
git commit -m "feat: add debouncing support [minor]"
git push origin main
# → Automatically publishes minor version

# Manual release
# Go to GitHub Actions → Run workflow → Select version type
```

## 📊 Release Notes

Each release automatically creates:

- Git tag (e.g., `v1.2.3`)
- GitHub release with changelog
- NPM package publication

The workflow ensures your package is always in sync across Git tags, GitHub releases, and NPM versions.
