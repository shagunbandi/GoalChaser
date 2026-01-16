# Plugin Navigation Pattern: Year → Month → Day

This document explains the new navigation pattern for plugins.

## Overview

Plugins now support a three-level navigation pattern:

1. **Year View** - Shows all 12 months in a grid (existing)
2. **Month View** - Shows a single month calendar with day details panel (NEW)
3. **Day Details** - Details panel on the right when a day is selected (NEW)

## URL Structure

```
/goal/[goalId]/[pluginId]/[year]              → Year view
/goal/[goalId]/[pluginId]/[year]/[month]      → Month view
/goal/[goalId]/[pluginId]/[year]/[month]?date=[iso] → Month view with selected day
```

## Implementation Guide

### 1. Update Plugin Page Component

Your plugin page now receives a `month` parameter:

```typescript
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'

export default function MyPluginPage({ context, params, year, month }: PluginPageProps) {
  const {
    goal,
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    initialSelectedDay,
    updateDayData,
    updateConfig,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToMonth,       // NEW: Navigate to month view
    navigateToPrevMonth,   // NEW: Navigate to previous month
    navigateToNextMonth,   // NEW: Navigate to next month
    jumpToDay,
    year: currentYear,
  } = usePluginPage<MyPluginDayData, MyPluginConfig>({
    pluginId: 'my-plugin',
    params,
    year,
  })
  
  if (isLoading) return <LoadingState />
  if (!goal) return <NotFoundState />
  
  // Show month view if month parameter is present
  if (month) {
    return <MyPluginMonthView 
      month={month}
      year={currentYear}
      // ... pass other props
    />
  }
  
  // Otherwise show year view
  return <MyPluginYearView 
    year={currentYear}
    // ... pass other props
  />
}
```

### 2. Add Month Navigation to Year View

Update your year view config to include month navigation:

```typescript
import type { YearViewConfig } from '@/types'

const config: YearViewConfig = {
  year,
  todayISO,
  header: { /* ... */ },
  months: monthsData,
  modal: { /* ... */ },
  onPrevYear: navigateToPrevYear,
  onNextYear: navigateToNextYear,
  
  // NEW: Add month click handler
  onMonthClick: (year, month) => {
    navigateToMonth(year, month)
  },
}
```

Now when users click on a month name in the year view, they'll navigate to the month view.

### 3. Create Month View Component

Use the new `PluginMonthView` component from the SDK:

```typescript
import { PluginMonthView, type PluginMonthViewProps } from '@/sdk'
import type { MyPluginDayData } from '../types'

interface MyPluginMonthViewProps {
  month: number
  year: number
  todayISO: string
  dayData: Record<string, MyPluginDayData>
  onUpdateDay: (iso: string, updates: Partial<MyPluginDayData>) => Promise<void>
  navigateToMonth: (year: number, month: number) => void
  // ... other props
}

export function MyPluginMonthView({
  month,
  year,
  todayISO,
  dayData,
  onUpdateDay,
  navigateToMonth,
  // ...
}: MyPluginMonthViewProps) {
  // Build day customizations based on your plugin data
  const buildDayCustomization = (date: string, data: MyPluginDayData | null) => {
    if (!data) return null
    
    return {
      backgroundColor: data.completed ? 'bg-green-500/20' : 'bg-red-500/20',
      indicators: [
        {
          id: 'status',
          label: data.completed ? 'Completed' : 'Incomplete',
          color: data.completed ? '#00FF00' : '#FF0000',
        },
      ],
      content: (
        <div className="text-xs text-white/60 mt-1">
          {data.count} items
        </div>
      ),
    }
  }
  
  return (
    <PluginMonthView
      plugin={myPlugin}
      year={year}
      month={month}
      goalId={goalId}
      todayISO={todayISO}
      dayData={dayData}
      onUpdateDay={onUpdateDay}
      onBackToYear={() => navigateToMonth(year, 0)} // or use router.back()
      buildDayCustomization={buildDayCustomization}
    />
  )
}
```

### 4. Implement Detail Provider (Optional but Recommended)

To customize the day details panel, implement a detail provider in your plugin definition:

```typescript
import type { PluginDetailProvider } from '@/sdk'
import { MyDayDetails } from './components/MyDayDetails'

export class MyPluginDetailProvider implements PluginDetailProvider<MyPluginDayData> {
  renderDetail(
    data: MyPluginDayData | null,
    date: string,
    onUpdate: (updates: Partial<MyPluginDayData>) => Promise<void>
  ): ReactNode {
    return (
      <MyDayDetails
        date={date}
        data={data}
        onUpdate={onUpdate}
      />
    )
  }
}

// In your plugin definition:
export const MyPlugin: Plugin<MyPluginDayData, MyPluginConfig> = {
  id: 'my-plugin',
  metadata: { /* ... */ },
  routes: [ /* ... */ ],
  dataProvider: new MyPluginDataProvider(),
  detailProvider: new MyPluginDetailProvider(), // Add this
  calendar: { /* ... */ },
}
```

## Benefits

1. **No More Modals**: Day details are shown in a right panel instead of a modal
2. **Better UX**: Users can see the calendar and details at the same time
3. **Consistent Pattern**: All plugins follow the same navigation pattern
4. **Reusable Components**: Use `MonthCalendar` and `PluginMonthView` from SDK
5. **Customizable**: Full control over day styling and detail rendering

## Migration Checklist

For existing plugins:

- [ ] Add `month` parameter handling to plugin page component
- [ ] Add `onMonthClick` handler to year view config
- [ ] Create month view component using `PluginMonthView`
- [ ] Implement `buildDayCustomization` function
- [ ] (Optional) Implement `PluginDetailProvider` for custom day details
- [ ] Update navigation calls to use new month navigation helpers
- [ ] Test year → month → day navigation flow
- [ ] Remove old modal-based day detail code (if any)
