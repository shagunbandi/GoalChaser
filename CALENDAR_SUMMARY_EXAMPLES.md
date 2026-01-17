# Enhanced Calendar Summary Examples

The calendar detail panel now supports richer summaries with multiple rendering types and customization options.

## New Summary Types

### 1. **chip** (Enhanced) - Compact single-line
```typescript
{
  type: 'chip',
  title: 'Hours',
  subtitle: '2h tracked', // NEW
  icon: '⏱️',
  badge: '3', // NEW: Show count or status badge
  content: '2h',
  color: '#A855F7',
  gradient: { from: '#A855F7', to: '#8B5CF6' }, // NEW: Gradient backgrounds
  actions: [{ label: 'View details', url: '/...' }]
}
```

### 2. **stats** (NEW) - Display multiple metrics in a grid
```typescript
{
  type: 'stats',
  title: 'Productivity',
  subtitle: 'Daily overview',
  icon: '📊',
  badge: 'High',
  gradient: { from: '#06B6D4', to: '#3B82F6' },
  stats: [
    { 
      label: 'Score', 
      value: '8/10', 
      icon: '⭐', 
      color: '#22C55E',
      subtitle: '+2 from yesterday'
    },
    { label: 'Areas', value: 3, icon: '🎯' },
    { label: 'Topics', value: 12, icon: '📝' },
    { label: 'Streak', value: '5 days', icon: '🔥' }
  ],
  actions: [
    { label: 'View Details', url: '/...', variant: 'primary' }
  ]
}
```

### 3. **list** (NEW) - Display items vertically
```typescript
{
  type: 'list',
  title: 'Today\'s Areas',
  subtitle: '3 areas tracked',
  icon: '🎯',
  badge: '3',
  items: [
    {
      id: '1',
      label: 'Work',
      value: '6h',
      icon: '💼',
      color: '#06B6D4',
      subtitle: '3 topics',
      onClick: () => navigateToArea('work')
    },
    {
      id: '2',
      label: 'Learning',
      value: '2h',
      icon: '📚',
      color: '#A855F7'
    },
    {
      id: '3',
      label: 'Exercise',
      value: '1h',
      icon: '🏃',
      color: '#22C55E'
    }
  ],
  actions: [
    { label: 'Add Area', variant: 'primary' }
  ]
}
```

### 4. **card** (Enhanced) - Full-featured card
```typescript
{
  type: 'card',
  title: 'Finance',
  subtitle: 'Daily transactions',
  icon: '💰',
  badge: '5 transactions',
  gradient: { from: '#22C55E', to: '#10B981' },
  content: {
    'Total Income': '₹5,000',
    'Total Expenses': '₹2,500',
    'Net': '₹2,500'
  },
  actions: [
    { label: 'Add Transaction', variant: 'primary' },
    { label: 'View Report', variant: 'secondary' }
  ]
}
```

### 5. **accordion** (Enhanced) - Expandable content
```typescript
{
  type: 'accordion',
  title: 'Travel',
  subtitle: 'Active trips',
  icon: '✈️',
  badge: '2',
  content: {
    'Destination': 'Paris',
    'Duration': '7 days',
    'Status': 'In Progress'
  },
  actions: [
    { label: 'View Itinerary', url: '/...' }
  ]
}
```

## New Features

### Gradients
Add visual depth with gradient backgrounds:
```typescript
gradient: {
  from: '#A855F7', // Purple
  to: '#8B5CF6'    // Darker purple
}
```

### Badges
Show counts, status, or labels:
```typescript
badge: '3'        // Number
badge: 'New'      // Status
badge: 'High'     // Label
```

### Subtitles
Add context or additional information:
```typescript
title: 'Hours',
subtitle: '2h tracked today'
```

### Stat Items (for stats type)
```typescript
stats: [
  {
    label: 'Score',
    value: '8/10',
    icon: '⭐',
    color: '#22C55E',
    subtitle: '+2 from yesterday' // Trend or context
  }
]
```

### List Items (for list type)
```typescript
items: [
  {
    id: '1',
    label: 'Work',
    value: '6h',
    icon: '💼',
    color: '#06B6D4',
    subtitle: '3 topics',
    onClick: () => {} // Make it interactive
  }
]
```

## Real-World Examples

### Hours Plugin with Stats
```typescript
calendar: {
  getDaySummary: (date, data) => {
    const subjects = data?.subjects || []
    const totalHours = subjects.reduce((sum, s) => sum + s.hours, 0)
    
    return {
      color: '#A855F7',
      hasData: totalHours > 0,
      summary: {
        type: 'stats',
        title: 'Hours Tracked',
        subtitle: formatHours(totalHours),
        icon: '⏱️',
        badge: subjects.length,
        gradient: { from: '#A855F7', to: '#8B5CF6' },
        stats: subjects.slice(0, 4).map(s => ({
          label: s.subject,
          value: formatHours(s.hours),
          color: s.color
        })),
        actions: [
          { label: 'View Details', url: buildUrl(...) }
        ]
      }
    }
  }
}
```

### Productivity Plugin with List
```typescript
calendar: {
  getDaySummary: (date, data) => {
    const areas = data?.areas || []
    
    return {
      color: '#06B6D4',
      hasData: areas.length > 0,
      summary: {
        type: 'list',
        title: 'Productivity',
        subtitle: `${areas.length} areas tracked`,
        icon: '🎯',
        badge: data.status ? `${data.status}/10` : undefined,
        gradient: { from: '#06B6D4', to: '#3B82F6' },
        items: areas.map(area => ({
          id: area.area,
          label: area.area,
          value: `${area.topics.length} topics`,
          icon: '📝',
          color: '#06B6D4'
        })),
        actions: [
          { label: 'View Details', url: buildUrl(...) }
        ]
      }
    }
  }
}
```

## Migration Guide

All existing summaries will continue to work. To use new features:

1. **Add subtitle**: `subtitle: 'Additional context'`
2. **Add badge**: `badge: '3'` or `badge: 'New'`
3. **Add gradient**: `gradient: { from: '#color1', to: '#color2' }`
4. **Switch to stats**: Change `type: 'chip'` to `type: 'stats'` and add `stats` array
5. **Switch to list**: Change to `type: 'list'` and add `items` array

All fields are optional except `type`, `title`, and the required fields for each type.
