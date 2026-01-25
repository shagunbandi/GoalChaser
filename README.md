# Goal Chaser

A comprehensive goal and habit tracking application built with Next.js and Firebase.

## Features

- 🎯 **Goal Tracking** - Create and manage multiple goals with date ranges
- 📅 **Calendar View** - Visualize your progress throughout the year
- 📊 **Analytics** - Track trends and insights across all your data
- 🔌 **Plugin Architecture** - Modular design with multiple tracking plugins:
  - 📚 **Study Plugin** - Track study hours, subjects, and topics
  - 🎯 **Productivity Plugin** - Monitor daily productivity with areas and topics
  - 💰 **Finance Plugin** - Manage expenses, income, and investments
  - ✈️ **Travel Plugin** - Plan and document your travels
  - 📅 **Period Plugin** - Track menstrual cycles

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase account with Firestore enabled
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Configure Firebase credentials in .env.local
```

### Development

```bash
# Run development server
npm run dev
# or
just dev

# Open http://localhost:3000
```

### Testing with Dummy Data

Generate comprehensive test data with all plugins populated:

```bash
# Generate dummy data
just generate-dummy-data

# The script creates dummy-user-data.json with:
# - 366 days of data
# - All plugins populated
# - Realistic data patterns

# Upload via /debug/restore in the app
```

## Docker Deployment

```bash
# Build and start containers
just docker-deploy

# View logs
just docker-logs

# Stop containers
just docker-down
```

See [justfile](./justfile) for all available commands.

## Data Management

### Backup & Restore

Access the debug dashboard at `/debug` to:
- **Backup**: Download all your data as JSON (`/debug/backup`)
- **Restore**: Upload and restore from JSON backup (`/debug/restore`)

### Scripts

See [scripts/README.md](./scripts/README.md) for detailed documentation on all available scripts:
- `generate-dummy-user.mjs` - Generate comprehensive test data
- `setup-test-user.mjs` - Create Firebase test users
- `download-database.mjs` - Download database backups
- And more...

## Plugin Architecture

Goal Chaser uses a plugin-based architecture for complete feature isolation. See [`.cursorrules`](./.cursorrules) and [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) for details on:
- Creating new plugins
- Plugin SDK
- Data providers
- Calendar integration
- Analytics integration

## Testing

```bash
# Run E2E tests
just test-e2e

# Run with UI
just test-e2e-ui

# Run specific test
just test-auth
```

See [README.E2E.md](./README.E2E.md) for E2E testing documentation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
