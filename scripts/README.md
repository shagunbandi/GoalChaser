# Scripts Documentation

This directory contains utility scripts for managing Goal Chaser data and testing.

## Data Management Scripts

### `generate-dummy-user.mjs`

Generate comprehensive dummy user data with all plugins populated for testing and demos.

**Usage:**
```bash
# Using Node directly
node scripts/generate-dummy-user.mjs

# Using just
just generate-dummy-data
```

**Output:**
- Creates `dummy-user-data.json` in the project root
- Contains ~366 days of data across all plugins:
  - Study plugin (3 subjects with topics and hours)
  - Productivity plugin (3 areas with tracking)
  - Finance plugin (expenses, income, investments)
  - Travel plugin (4 trips throughout the year)
  - Period plugin (regular cycle tracking)

**Upload Instructions:**
1. Sign in to your Goal Chaser account
2. Navigate to `/debug/restore`
3. Click "Select Backup File" and choose `dummy-user-data.json`
4. Click "Restore Data" to import

⚠️ **Warning:** This will add/update data in your account. Create a backup first via `/debug/backup`

**Generated Data Includes:**
- ~258 study days with multiple subjects
- ~306 productivity days with status ratings
- ~220 finance days with transactions
- 4 travel plans spanning 29 days
- ~62 period tracking days

---

### `setup-test-user.mjs`

Create a Firebase test user for E2E testing and development.

**Usage:**
```bash
# Using Node directly
node scripts/setup-test-user.mjs

# Using just
just setup-test-user

# With custom credentials
TEST_USER_EMAIL=mytest@example.com TEST_USER_PASSWORD=MyPass123! node scripts/setup-test-user.mjs
```

**Environment Variables:**
- `TEST_USER_EMAIL` - Email for test user (default: `test@goalchaser.test`)
- `TEST_USER_PASSWORD` - Password for test user (default: `TestPassword123!`)

---

### `download-database.mjs`

Download a complete backup of your Firestore database.

**Usage:**
```bash
# Using Node directly
node scripts/download-database.mjs

# Using just
just download-db
```

**Output:**
- Creates a JSON backup file in the project root
- Includes all goals, settings, and plugin data
- Can be restored via `/debug/restore`

---

### `clear-agenda-items.mjs`

Clear all agenda items from a goal.

**Usage:**
```bash
# Using Node directly
node scripts/clear-agenda-items.mjs

# Using just
just clear-agenda
```

---

### `test-firebase.mjs`

Test Firebase connection and authentication.

**Usage:**
```bash
node scripts/test-firebase.mjs
```

---

### `migrate-old-backup.mjs`

Migrate data from old backup format to new plugin-based structure.

**Usage:**
```bash
node scripts/migrate-old-backup.mjs
```

---

## Testing Scripts

### `setup-e2e.sh`

Setup E2E testing environment.

**Usage:**
```bash
./scripts/setup-e2e.sh
```

---

### `run-e2e-tests.sh`

Run E2E tests with proper environment setup.

**Usage:**
```bash
./scripts/run-e2e-tests.sh
```

---

### `start-emulators.sh`

Start Firebase emulators for local testing.

**Usage:**
```bash
./scripts/start-emulators.sh
```

---

## Icon Generation

### `generate-icons.mjs`

Generate PWA icons from SVG source.

**Usage:**
```bash
node scripts/generate-icons.mjs
```

---

## Common Workflows

### Testing with Dummy Data

1. Generate dummy data:
   ```bash
   just generate-dummy-data
   ```

2. Start dev server:
   ```bash
   just dev
   ```

3. Sign in to your account at `http://localhost:3000`

4. Go to `/debug/restore` and upload `dummy-user-data.json`

5. Browse your populated data!

### Creating Backups

1. Sign in at `http://localhost:3000`

2. Navigate to `/debug/backup`

3. Click "Download Backup" to export your data

### Restoring from Backup

1. Sign in at `http://localhost:3000`

2. Navigate to `/debug/restore`

3. Select your backup JSON file

4. Click "Restore Data"

⚠️ **Warning:** Restoration will overwrite existing data with matching IDs

---

## Script Requirements

All scripts require:
- Node.js 18+
- Firebase configuration in environment variables (`.env.local`)
- Active Firebase project with Firestore enabled

For backup/restore operations:
- User must be authenticated
- User must have proper Firestore permissions
