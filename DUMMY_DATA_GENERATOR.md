# Dummy User Data Generator - Implementation Summary

## What Was Created

### Main Script: `scripts/generate-dummy-user.mjs`

A comprehensive Node.js script that generates realistic test data for all plugins in Goal Chaser.

#### Features:
- **366 days** of historical data (full year)
- **All plugins populated** with realistic patterns:
  - Study Plugin (~70% coverage)
  - Productivity Plugin (~80% coverage)
  - Finance Plugin (~60% coverage)
  - Travel Plugin (4 trips throughout the year)
  - Period Plugin (regular 28-day cycles)

#### Generated Data Statistics:
```
• Total days: 366
• Study days: ~258 (3 subjects: Math, Physics, CS)
• Productivity days: ~306 (3 areas: Work, Health, Learning)
• Finance days: ~220 (expenses, income, investments)
• Travel days: 29 (4 trips ranging from 3-14 days)
• Period days: ~62 (regular cycles with 5-day periods)
```

#### Data Realism:
- **Study Plugin**: Variable hours (1-5), multiple subjects with topics
- **Productivity Plugin**: Status ratings (5-10), areas with tracked hours
- **Finance Plugin**: 
  - Daily expenses (₹100-₹5000)
  - Occasional income (₹10k-₹100k)
  - Periodic investments (₹5k-₹50k)
- **Travel Plugin**: 4 trips with destinations, dates, and notes
- **Period Plugin**: Regular 28-day cycles with 5-day duration

### Output Format

The script generates `dummy-user-data.json` with the following structure:

```json
{
  "_metadata": {
    "exportedAt": "ISO timestamp",
    "userId": "dummy-user",
    "userEmail": "dummy@goalchaser.app",
    "version": "1.0.0",
    "description": "Comprehensive dummy user data with all plugins populated",
    "stats": { ... }
  },
  "data": {
    "goals": {
      "demo-goal-2026": {
        "_data": { goal metadata },
        "_subcollections": {
          "addons": {
            "study": { days, settings },
            "productivity": { days, settings },
            "finance": { days, settings },
            "travel": { days },
            "period": { days, settings }
          }
        }
      }
    },
    "settings": { ... }
  }
}
```

This format is compatible with the existing `/debug/restore` endpoint.

## How to Use

### 1. Generate Dummy Data

```bash
# Using Node
node scripts/generate-dummy-user.mjs

# Using just
just generate-dummy-data
```

Output: `dummy-user-data.json` (250-850KB depending on randomization)

### 2. Upload to Firestore

1. Start your development server
2. Sign in to your Goal Chaser account
3. Navigate to `/debug/restore`
4. Select `dummy-user-data.json`
5. Click "Restore Data"

The data will be uploaded to your account under a new goal called "My 2026 Goals".

### 3. Explore the Data

- View the calendar with colored indicators from all plugins
- Check analytics for trends across plugins
- Navigate to individual plugin pages to see detailed data
- Test all features with realistic, comprehensive data

## Additional Files Created

### `scripts/README.md`
Complete documentation for all scripts in the project, including:
- Usage instructions
- Environment variables
- Common workflows
- Script requirements

### Updated Files

1. **`justfile`** - Added convenience commands:
   - `just generate-dummy-data` - Generate dummy user data
   - `just setup-test-user` - Setup Firebase test user
   - `just clear-agenda` - Clear agenda items
   - `just download-db` - Download database backup

2. **`README.md`** - Enhanced with:
   - Project overview and features
   - Testing with dummy data instructions
   - Data management section
   - Plugin architecture references

3. **`.gitignore`** - Added patterns to ignore:
   - `dummy-user-data.json` - Generated test data
   - `*-backup.json` - Any backup files

## Testing

The script was tested and verified to:
- ✅ Generate valid JSON structure
- ✅ Create realistic data patterns
- ✅ Match expected Firestore backup format
- ✅ Include all 5 plugins with appropriate data
- ✅ Generate ~250-850KB files (depending on random data)
- ✅ Be compatible with `/debug/restore` endpoint
- ✅ Handle large datasets with batched writes (fixed batch propagation bug)

## Implementation Notes

### Why This Approach?

1. **Standalone Script**: No dependencies on the main app, can run independently
2. **Randomized Data**: Each run generates different but realistic patterns
3. **Comprehensive Coverage**: Tests all plugins simultaneously
4. **Realistic Patterns**: Data follows natural usage patterns (70-80% coverage for daily plugins, sporadic for travel)
5. **Proper Format**: Matches the exact Firestore backup structure expected by restore

### Data Generation Strategy

- **Study/Productivity**: High frequency (daily habits)
- **Finance**: Medium frequency (regular transactions)
- **Travel**: Low frequency (occasional trips)
- **Period**: Cyclical pattern (28-day cycles)

### Random ID Generation

Uses timestamp + random string to ensure unique IDs:
```javascript
`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

## Future Enhancements

Potential improvements for the future:

1. **CLI Arguments**: Allow customizing date ranges, plugin coverage, etc.
2. **Multiple Goals**: Generate data for multiple goals
3. **Template System**: Define data templates for different user personas
4. **Seed Support**: Reproducible random data with seeds
5. **More Realistic Patterns**: 
   - Seasonal travel (more trips in summer)
   - End-of-month salary patterns
   - Weekend productivity patterns
6. **File Attachments**: Generate mock travel attachments (would require GCS setup)

## Conclusion

The dummy user data generator provides a comprehensive solution for:
- **Testing**: Verify all plugins work with real data
- **Demos**: Showcase the app with populated data
- **Development**: Test UI with various data patterns
- **Debugging**: Reproduce issues with consistent test data

The script is production-ready and can be used immediately to populate test accounts with realistic, comprehensive data across all features.
