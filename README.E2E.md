# E2E Testing Guide

This guide explains how to run end-to-end (e2e) tests for the Goal Chaser application using Playwright and Firebase emulators.

## Prerequisites

1. **Node.js and npm** installed
2. **Firebase CLI** installed (included in devDependencies)
3. **Playwright** installed (included in devDependencies)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

## Running E2E Tests

### Quick Start (All in One Terminal)

The easiest way to run tests is to let Playwright start everything for you:

```bash
npm run test:e2e
```

This will:
- Start the Firebase emulators
- Start the Next.js dev server
- Run all tests
- Generate an HTML report

### Step-by-Step (Multiple Terminals)

For more control, you can start services manually:

#### Terminal 1: Start Firebase Emulators

```bash
npm run emulators
```

Wait for the message:
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! View status and logs at http://localhost:4000 │
└─────────────────────────────────────────────────────────────┘
```

#### Terminal 2: Start the Development Server

```bash
npm run dev
```

Wait for:
```
✓ Ready in Xms
○ Local:        http://localhost:3000
```

#### Terminal 3: Run Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

## Test Structure

### Test Files

- `__tests__/e2e/auth.spec.ts` - Authentication flow tests (sign up, sign in, sign out)
- `__tests__/e2e/recurring-agenda.spec.ts` - Recurring agenda tests (existing)

### Fixtures

- `__tests__/fixtures/auth.fixture.ts` - Reusable authentication helpers and fixtures

### Configuration

- `playwright.config.ts` - Playwright configuration
- `.env.test` - Environment variables for testing (connects to emulators)

## Test Coverage

### Authentication Tests

The `auth.spec.ts` file includes tests for:

1. ✅ Display sign-in page when not authenticated
2. ✅ Sign up a new user
3. ✅ Sign in with existing user
4. ✅ Display error for invalid email format
5. ✅ Display error for weak password
6. ✅ Display error for incorrect password
7. ✅ Sign out successfully
8. ✅ Toggle between sign-in and sign-up modes
9. ✅ Persist authentication across page reloads

## Viewing Test Results

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This will open an interactive report in your browser showing:
- Test results
- Screenshots of failures
- Video recordings
- Step-by-step execution traces

### Playwright UI Mode

For the best debugging experience, use UI mode:

```bash
npm run test:e2e:ui
```

This provides:
- Live test execution
- Step-by-step debugging
- Time travel debugging
- Visual test picker
- Watch mode

## Firebase Emulator UI

While running tests, you can view the Firebase Emulator UI at:

```
http://localhost:4000
```

This shows:
- Authentication users
- Firestore data
- Real-time database state

## Environment Variables

The `.env.test` file configures the test environment:

```env
# Application URL
BASE_URL=http://localhost:3000

# Firebase Emulator Settings
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080

# Firebase Project (for emulator)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-test
```

## Troubleshooting

### Emulators Won't Start

```bash
# Kill any existing emulator processes
pkill -f firebase

# Clear emulator data
rm -rf ~/.config/firebase/emulators/

# Start fresh
npm run emulators
```

### Tests Timing Out

- Ensure emulators are running before starting tests
- Ensure dev server is running on port 3000
- Check network/firewall settings
- Increase timeout in `playwright.config.ts`

### Authentication Errors

- Verify `.env.test` has correct emulator settings
- Check that `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`
- Ensure emulator ports match (Auth: 9099, Firestore: 8080)
- Clear browser storage: tests run in isolated contexts

### Can't See Tests in UI

Make sure you're running from the project root:

```bash
cd /path/to/goal-chaser
npm run test:e2e:ui
```

## CI/CD Integration

For continuous integration, the tests automatically:
- Run with 2 retries on failure
- Use 1 worker (serial execution)
- Start emulators and dev server automatically
- Generate HTML reports
- Capture videos and screenshots on failure

Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Writing New Tests

### Using the Auth Fixture

```typescript
import { test, expect } from '../fixtures/auth.fixture'

test('my authenticated test', async ({ authenticatedPage }) => {
  // authenticatedPage is already signed in with a unique user
  await expect(authenticatedPage.locator('text=Create Goal')).toBeVisible()
})
```

### Manual Authentication

```typescript
import { signUpUser, signInUser, signOut } from '../fixtures/auth.fixture'

test('manual auth test', async ({ page }) => {
  await signUpUser(page, 'user@test.com', 'password123', 'Test User')
  
  // Do authenticated actions
  
  await signOut(page)
})
```

## Best Practices

1. **Use unique emails**: Generate unique emails per test to avoid conflicts
2. **Clean up**: Sign out after tests (or use the fixture)
3. **Wait for states**: Use `waitForLoadState('networkidle')` liberally
4. **Flexible selectors**: Use `.or()` for alternative selectors
5. **Test isolation**: Each test should be independent
6. **Meaningful names**: Use descriptive test names
7. **Error handling**: Use `.catch()` for optional elements

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

