# Travel Plans Debugging Guide

## 🐛 Issue
Travel plans are not persisting to Firebase while other data (productivity scores, notes, etc.) are saving correctly.

## 🔍 Debugging Added

I've added comprehensive debugging logs to track the travel data flow through the entire save pipeline:

### 1. **Page Level** (`src/app/goal/[id]/page.tsx`)

```
🛫 Travel Plan to Save: { plan object }
📅 Dates to Update: [array of ISO dates]
💾 Saving to YYYY-MM-DD: { existing count, updated count, data }
✅ Travel save completed successfully
❌ Failed to save travel: [error details]
```

### 2. **Hook Level** (`src/hooks/useFirebase.ts`)

```
📝 useFirebase updateDayDetails for YYYY-MM-DD: { updates, travelPlans }
💾 Firebase save result for YYYY-MM-DD: SUCCESS or FAILED
```

### 3. **API Level** (`src/lib/api/day-details-api.ts`)

```
🔥 Firebase Saving Travel to YYYY-MM-DD: {
  path: users/{userId}/goals/{goalId}/days/{date},
  travelPlans: [array],
  fullData: {complete object being saved}
}
✅ Firebase Save Successful for YYYY-MM-DD
❌ Firebase write failed: [error]
```

## 📋 How to Test

1. **Open Browser Console** (F12 or Cmd+Opt+I)

2. **Create a Travel Plan**:
   - Go to Year View
   - Click "+ Add travel"
   - Fill in:
     - Title: "Test Travel"
     - Start Date: Pick a date
     - End Date: Pick an end date
     - (optional) Destination, color, notes
   - Click "Save travel"

3. **Check Console Output**:
   Look for the emoji-prefixed logs in this order:
   
   ```
   🛫 Travel Plan to Save: {...}
   📅 Dates to Update: [...]
   💾 Saving to 2026-01-15: {...}
   💾 Saving to 2026-01-16: {...}
   📝 useFirebase updateDayDetails for 2026-01-15: {...}
   🔥 Firebase Saving Travel to 2026-01-15: {...}
   ✅ Firebase Save Successful for 2026-01-15
   💾 Firebase save result for 2026-01-15: SUCCESS
   ...
   ✅ Travel save completed successfully
   ```

4. **Refresh the Page**:
   - After adding travel, refresh the browser
   - Check if the travel plans still appear
   - Check console for load logs

## 🔎 What to Look For

### Scenario A: Data Reaches Firebase
If you see all these logs including the 🔥 Firebase logs:
- **Problem**: Firebase save is happening but data isn't loading back
- **Next Step**: Check the load function in `day-details-api.ts`
- **Check**: Is Firebase returning the data correctly?

### Scenario B: Data Doesn't Reach Firebase
If you see 🛫 and 📅 logs but no 🔥 Firebase logs:
- **Problem**: Data is not reaching the Firebase API layer
- **Likely Cause**: `isUsingFirebase` might be `false`
- **Check**: Look for console messages about "Using offline mode"

### Scenario C: Save Returns FAILED
If you see `💾 Firebase save result: FAILED`:
- **Problem**: Firebase permissions or configuration issue
- **Check**: 
  - Firebase console for security rules
  - Network tab for failed requests
  - Console for specific error messages

### Scenario D: No Logs At All
If you don't see any emoji logs:
- **Problem**: The handleAddTravel function isn't being called
- **Check**: Modal submission, button clicks

## 🔧 Common Issues & Solutions

### Issue 1: "Using offline mode"
**Symptom**: Console shows "Using offline mode" message
**Cause**: Firebase initialization failed
**Solution**: 
- Check `.env.local` file has correct Firebase config
- Verify Firebase project is accessible
- Check network connectivity

### Issue 2: Permission Denied
**Symptom**: Firebase logs show "permission denied" error
**Cause**: Firebase security rules blocking writes
**Solution**:
```javascript
// Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/goals/{goalId}/days/{date} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Issue 3: Data Format Mismatch
**Symptom**: Save succeeds but data doesn't load back
**Cause**: Old `travel` field vs new `travelPlans` field
**Solution**: Already handled in `day-details-api.ts` with migration logic

## 📊 Data Structure

### What Should Be Saved:
```typescript
{
  travelPlans: [
    {
      id: "travel_1704182400000_abc123",
      title: "Work Trip to NYC",
      startDate: "2026-01-15",
      endDate: "2026-01-17",
      destination: "New York",
      color: "#0EA5E9",
      note: "Client meetings"
    }
  ],
  // ... other day details
}
```

### Firebase Path:
```
users/{userId}/goals/{goalId}/days/{YYYY-MM-DD}
```

## 🎯 Expected Behavior

1. **Save**: Travel plan should be saved to all dates in the range
2. **Load**: On page refresh, travel plans should load from Firebase
3. **Display**: Travel plans should appear in:
   - Year view (colored days)
   - Day detail modal (when clicking a travel day)
   - Travel summary cards

## 📝 Next Steps After Debugging

Once you identify where the issue is:

1. **Share the console output** - This will tell us exactly where the flow breaks
2. **Check Firebase Console** - Go to Firestore and manually check if data is being written
3. **Review the specific error** - The error message will guide the fix

## 🧹 Cleanup

After debugging is complete, we can:
1. Keep essential error logging
2. Remove verbose debug logs
3. Add user-friendly error messages

