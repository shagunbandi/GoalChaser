# Quick Start: Dummy User Data

## 🚀 Generate Test Data

```bash
just generate-dummy-data
```

This creates `dummy-user-data.json` with:
- ✅ 366 days of data (full year)
- ✅ All 5 plugins populated
- ✅ Realistic usage patterns
- ✅ ~250KB file

## 📤 Upload to Your Account

1. Start dev server: `just dev`
2. Sign in at `http://localhost:3000`
3. Go to `/debug/restore`
4. Upload `dummy-user-data.json`
5. Click "Restore Data"

⚠️ **Note:** The restore process handles large datasets with batched writes (450 docs per batch). The fix ensures batch handles are properly propagated through recursive subcollection restoration.

## 📊 What You'll Get

| Plugin | Coverage | Details |
|--------|----------|---------|
| 📚 Study | ~70% | 3 subjects with topics and hours |
| 🎯 Productivity | ~80% | 3 areas with status ratings |
| 💰 Finance | ~60% | Expenses, income, investments |
| ✈️ Travel | 4 trips | Multi-day trips with destinations |
| 📅 Period | Regular | 28-day cycles, 5-day periods |

## ⚠️ Important

- **Backup first**: Go to `/debug/backup` before restoring
- **Not destructive**: Adds new data, doesn't delete existing
- **Goal name**: Creates "My 2026 Goals"
- **Goal ID**: `demo-goal-2026`

## 🔄 Regenerate

Each run creates different random data:

```bash
rm dummy-user-data.json
just generate-dummy-data
```

## 📚 More Info

- Full docs: [DUMMY_DATA_GENERATOR.md](./DUMMY_DATA_GENERATOR.md)
- Scripts: [scripts/README.md](./scripts/README.md)
- Architecture: [.cursorrules](./.cursorrules)
