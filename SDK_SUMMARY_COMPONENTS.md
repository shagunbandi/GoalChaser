# SDK Summary Components Usage Guide

Beautiful, reusable components for displaying plugin data in detail panels.

## SummaryCard

A glassmorphic card with header, icon, badge, content area, and footer.

### Basic Usage

```tsx
import { SummaryCard, ActionButton } from '@/sdk'

<SummaryCard
  title="Hours Tracked"
  subtitle="0h 50m total"
  icon="⏱️"
  badge="2 subjects"
  gradient={{ from: '#A855F7', to: '#8B5CF6' }}
  footer={
    <ActionButton variant="primary">
      View Details
    </ActionButton>
  }
>
  {/* Your content here */}
</SummaryCard>
```

### With Stats Grid

```tsx
import { SummaryCard, StatGrid, ActionButton } from '@/sdk'

<SummaryCard
  title="Productivity"
  subtitle="Daily overview"
  icon="📊"
  badge="High"
  gradient={{ from: '#06B6D4', to: '#3B82F6' }}
  footer={
    <ActionButton variant="primary">
      View Details
    </ActionButton>
  }
>
  <StatGrid
    stats={[
      {
        label: 'Score',
        value: '8/10',
        icon: '⭐',
        color: '#22C55E',
        subtitle: '+2 from yesterday',
      },
      {
        label: 'Areas',
        value: 3,
        icon: '🎯',
      },
      {
        label: 'Topics',
        value: 12,
        icon: '📝',
      },
      {
        label: 'Streak',
        value: '5 days',
        icon: '🔥',
      },
    ]}
  />
</SummaryCard>
```

### With Item List

```tsx
import { SummaryCard, ItemList, ActionButton } from '@/sdk'

<SummaryCard
  title="Today's Areas"
  subtitle="3 areas tracked"
  icon="🎯"
  badge="3"
  footer={
    <ActionButton variant="primary">
      Add Area
    </ActionButton>
  }
>
  <ItemList
    items={[
      {
        id: '1',
        label: 'Work',
        value: '6h',
        icon: '💼',
        color: '#06B6D4',
        subtitle: '3 topics',
        onClick: () => navigateToArea('work'),
      },
      {
        id: '2',
        label: 'Learning',
        value: '2h',
        icon: '📚',
        color: '#A855F7',
      },
    ]}
  />
</SummaryCard>
```

### Custom Content

```tsx
<SummaryCard
  title="Finance"
  subtitle="Daily transactions"
  icon="💰"
  badge="5"
  gradient={{ from: '#22C55E', to: '#10B981' }}
  footer={
    <div className="flex gap-2">
      <ActionButton variant="primary">Add Transaction</ActionButton>
      <ActionButton variant="secondary">View Report</ActionButton>
    </div>
  }
>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span className="text-white/50">Total Income:</span>
      <span className="text-white/80 font-medium">₹5,000</span>
    </div>
    <div className="flex justify-between">
      <span className="text-white/50">Total Expenses:</span>
      <span className="text-white/80 font-medium">₹2,500</span>
    </div>
    <div className="flex justify-between pt-2 border-t border-white/10">
      <span className="text-white/70 font-semibold">Net:</span>
      <span className="text-green-400 font-bold">₹2,500</span>
    </div>
  </div>
</SummaryCard>
```

## ActionButton

Styled button for card footers.

### Variants

```tsx
import { ActionButton } from '@/sdk'

// Primary (blue)
<ActionButton variant="primary" onClick={handleClick}>
  View Details
</ActionButton>

// Secondary (transparent)
<ActionButton variant="secondary" onClick={handleClick}>
  Cancel
</ActionButton>

// Danger (red)
<ActionButton variant="danger" onClick={handleDelete}>
  Delete
</ActionButton>

// Disabled
<ActionButton variant="primary" disabled>
  Processing...
</ActionButton>
```

### Multiple Buttons

```tsx
<div className="flex gap-2">
  <ActionButton variant="secondary">Cancel</ActionButton>
  <ActionButton variant="primary">Save</ActionButton>
</div>
```

## StatGrid

Display statistics in a 2-column grid.

```tsx
import { StatGrid } from '@/sdk'

<StatGrid
  stats={[
    {
      label: 'Total Hours',
      value: '24h',
      icon: '⏱️',
      color: '#A855F7',
      subtitle: 'This week',
    },
    {
      label: 'Subjects',
      value: 5,
      icon: '📚',
      color: '#06B6D4',
    },
    {
      label: 'Avg. Daily',
      value: '3.4h',
      icon: '📊',
    },
    {
      label: 'Streak',
      value: '7 days',
      icon: '🔥',
      color: '#F97316',
    },
  ]}
/>
```

## ItemList

Display items in a vertical list.

```tsx
import { ItemList } from '@/sdk'

<ItemList
  items={[
    {
      id: '1',
      label: 'Mathematics',
      value: '4h',
      icon: '🔢',
      color: '#A855F7',
      subtitle: 'Algebra, Calculus',
      onClick: () => viewSubject('math'),
    },
    {
      id: '2',
      label: 'Science',
      value: '3h',
      icon: '🔬',
      color: '#06B6D4',
      subtitle: 'Physics, Chemistry',
      onClick: () => viewSubject('science'),
    },
  ]}
/>
```

## EmptyState

Beautiful empty state when no data exists.

```tsx
import { EmptyState } from '@/sdk'

// Basic
<EmptyState />

// Custom
<EmptyState
  icon="📊"
  title="No productivity data"
  description="Start tracking your daily productivity to see insights here"
  action={{
    label: 'Add Score',
    onClick: () => setShowForm(true),
  }}
/>

// In a card
<SummaryCard
  title="Hours"
  icon="⏱️"
  footer={<ActionButton variant="primary">Start Tracking</ActionButton>}
>
  <EmptyState
    icon="⏱️"
    title="No hours tracked"
    description="Track your time to see breakdown here"
  />
</SummaryCard>
```

## DataLoadingState

Show while data is loading.

```tsx
import { DataLoadingState, LoadingSpinner } from '@/sdk'

// Full loading state
<DataLoadingState message="Loading your data..." />

// Just the spinner
<LoadingSpinner />

// Custom layout
<div className="py-8">
  <LoadingSpinner className="mb-4" />
  <p className="text-center text-white/50">Processing...</p>
</div>
```

## Props Reference

### SummaryCardProps
```typescript
{
  title: string              // Required: Card title
  subtitle?: string          // Optional: Additional context
  icon?: string             // Optional: Emoji or icon
  badge?: string | number   // Optional: Badge text/count
  gradient?: {              // Optional: Gradient background
    from: string
    to: string
  }
  color?: string            // Optional: Fallback color
  children?: ReactNode      // Optional: Card content
  footer?: ReactNode        // Optional: Footer content
  hoverable?: boolean       // Optional: Enable hover effect
  className?: string        // Optional: Additional classes
}
```

### ActionButtonProps
```typescript
{
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
}
```

### StatGridProps
```typescript
{
  stats: Array<{
    label: string
    value: string | number
    icon?: string
    color?: string
    subtitle?: string
  }>
}
```

### ItemListProps
```typescript
{
  items: Array<{
    id: string
    label: string
    value?: string | number
    icon?: string
    color?: string
    subtitle?: string
    onClick?: () => void
  }>
}
```

### EmptyStateProps
```typescript
{
  icon?: string
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}
```

## Complete Example: Hours Plugin Detail Section

```tsx
import {
  SummaryCard,
  StatGrid,
  ActionButton,
  EmptyState,
  DataLoadingState,
} from '@/sdk'

function HoursDetailSection({ data, isLoading, onViewDetails }) {
  if (isLoading) {
    return <DataLoadingState message="Loading hours data..." />
  }

  if (!data || data.totalHours === 0) {
    return (
      <SummaryCard
        title="Hours Tracked"
        icon="⏱️"
        gradient={{ from: '#A855F7', to: '#8B5CF6' }}
        footer={
          <ActionButton variant="primary" onClick={onViewDetails}>
            Start Tracking
          </ActionButton>
        }
      >
        <EmptyState
          icon="⏱️"
          title="No hours tracked today"
          description="Start tracking your time to see the breakdown"
        />
      </SummaryCard>
    )
  }

  return (
    <SummaryCard
      title="Hours Tracked"
      subtitle={`${formatHours(data.totalHours)} total`}
      icon="⏱️"
      badge={`${data.subjects.length} subjects`}
      gradient={{ from: '#A855F7', to: '#8B5CF6' }}
      footer={
        <ActionButton variant="primary" onClick={onViewDetails}>
          View Details
        </ActionButton>
      }
    >
      <StatGrid
        stats={data.subjects.map((subject) => ({
          label: subject.name,
          value: formatHours(subject.hours),
          icon: '📚',
          color: '#A855F7',
          subtitle: `${subject.topics.length} topics`,
        }))}
      />
    </SummaryCard>
  )
}
```

## Design Guidelines

- **Gradients**: Use the plugin's primary color range for consistency
- **Icons**: Use emojis or simple icon text for clarity
- **Badges**: Show counts, status, or important metadata
- **Subtitles**: Provide additional context without cluttering
- **Colors**: Use meaningful colors (green for positive, red for negative, etc.)
- **Empty States**: Always provide guidance on what to do next
- **Loading States**: Show feedback while data is fetching

## Color Palette Reference

```typescript
// Plugin colors (from calendar indicators)
const PLUGIN_COLORS = {
  productivity: { from: '#06B6D4', to: '#3B82F6' }, // Cyan to Blue
  hours: { from: '#A855F7', to: '#8B5CF6' },        // Purple to Violet
  finance: { from: '#22C55E', to: '#10B981' },      // Green to Emerald
  travel: { from: '#F97316', to: '#EA580C' },       // Orange to Deep Orange
}

// Status colors
const STATUS_COLORS = {
  success: '#22C55E',  // Green
  warning: '#F59E0B',  // Amber
  error: '#EF4444',    // Red
  info: '#3B82F6',     // Blue
}
```
