#!/usr/bin/env node

/**
 * Generate Dummy User Data Script
 * Creates comprehensive test data with all plugins and features populated
 * 
 * Usage:
 *   node scripts/generate-dummy-user.mjs
 *   # Outputs: dummy-user-data.json
 *   # Upload via: /debug/restore
 */

import { writeFileSync } from 'fs'

// Helper: Generate random date in range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper: Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// Helper: Random integer in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper: Random item from array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper: Generate UUID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate Study Plugin Data
 */
function generateStudyData(dates) {
  const subjects = [
    { id: 'math', name: 'Mathematics', topics: ['Calculus', 'Linear Algebra', 'Statistics'], color: '#FF6B6B' },
    { id: 'physics', name: 'Physics', topics: ['Quantum Mechanics', 'Thermodynamics', 'Electromagnetism'], color: '#4ECDC4' },
    { id: 'cs', name: 'Computer Science', topics: ['Algorithms', 'Data Structures', 'Machine Learning'], color: '#95E1D3' },
  ]

  const dayData = {}
  
  dates.forEach(date => {
    // ~70% of days have study data
    if (Math.random() < 0.7) {
      const numSubjects = randomInt(1, 3)
      const selectedSubjects = []
      
      for (let i = 0; i < numSubjects; i++) {
        const subject = subjects[i]
        const numTopics = randomInt(1, subject.topics.length)
        const topics = subject.topics.slice(0, numTopics)
        const hours = Math.round((Math.random() * 4 + 1) * 10) / 10 // 1-5 hours, 1 decimal
        
        selectedSubjects.push({
          subject: subject.name,
          topics,
          hours
        })
      }
      
      dayData[date] = {
        _data: {
          subjects: selectedSubjects,
          directHours: 0,
          notes: Math.random() < 0.3 ? 'Good progress today!' : undefined
        }
      }
    }
  })

  const config = {
    _data: {
      subjects: subjects.map(s => ({
        ...s,
        hasTopics: true,
        trackStreaks: true,
        streakType: 'daily',
        targetFrequency: 1
      }))
    }
  }

  return { dayData, config }
}

/**
 * Generate Productivity Plugin Data
 */
function generateProductivityData(dates) {
  const areas = [
    { id: 'running', name: 'Running', topics: ['Morning Run', '5K', '10K', 'Trail Run'], color: '#FF6B6B', hasTopics: true },
    { id: 'badminton', name: 'Badminton', topics: [], color: '#4ECDC4', hasTopics: false },
    { id: 'coding', name: 'Coding', topics: [], color: '#007AFF', hasTopics: false },
    { id: 'meditation', name: 'Meditation', topics: ['Mindfulness', 'Breath Work', 'Body Scan', 'Loving Kindness'], color: '#AF52DE', hasTopics: true },
    { id: 'reading', name: 'Reading', topics: [
      'Atomic Habits',
      'Deep Work',
      'Thinking Fast and Slow',
      'The Psychology of Money',
      'Sapiens',
      'Educated',
      '1984',
      'The Alchemist',
      'The Midnight Library',
      'Project Hail Mary'
    ], color: '#34C759', hasTopics: true },
  ]

  const dayData = {}
  
  dates.forEach(date => {
    // ~80% of days have productivity data
    if (Math.random() < 0.8) {
      const status = randomInt(5, 10) // Mostly good days
      const numAreas = randomInt(1, 3)
      const selectedAreas = []
      
      // Randomly shuffle and select areas
      const shuffledAreas = [...areas].sort(() => 0.5 - Math.random())
      
      for (let i = 0; i < numAreas; i++) {
        const area = shuffledAreas[i]
        
        // Only add topics if the area has them
        let topics = []
        if (area.hasTopics && area.topics.length > 0) {
          const numTopics = randomInt(1, Math.min(3, area.topics.length))
          // Randomly select topics
          const shuffled = [...area.topics].sort(() => 0.5 - Math.random())
          topics = shuffled.slice(0, numTopics)
        }
        
        const hours = Math.round((Math.random() * 3 + 0.5) * 10) / 10
        
        selectedAreas.push({
          area: area.name,
          topics,
          hours
        })
      }
      
      dayData[date] = {
        _data: {
          status,
          areas: selectedAreas,
          directHours: Math.round(Math.random() * 2 * 10) / 10,
          notes: Math.random() < 0.2 ? 'Productive day!' : undefined
        }
      }
    }
  })

  const config = {
    _data: {
      areas: areas.map(a => ({
        id: a.id,
        name: a.name,
        topics: a.topics,
        hasTopics: a.hasTopics,
        color: a.color,
        trackStreaks: true,
        streakType: 'daily',
        targetFrequency: 1
      }))
    }
  }

  return { dayData, config }
}

/**
 * Generate Finance Plugin Data
 */
function generateFinanceData(dates) {
  const expenseCategories = [
    { id: 'food', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#FF6B6B' },
    { id: 'transport', name: 'Transport', type: 'expense', icon: '🚗', color: '#4ECDC4' },
    { id: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#FFE66D' },
    { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#95E1D3' },
  ]

  const incomeCategories = [
    { id: 'salary', name: 'Salary', type: 'income', icon: '💼', color: '#32D74B' },
    { id: 'freelance', name: 'Freelance', type: 'income', icon: '💻', color: '#00C7BE' },
  ]

  const investmentGroups = [
    { id: 'mutual-fund', name: 'Mutual Fund', icon: '📊', color: '#5856D6' },
    { id: 'stocks', name: 'Stocks', icon: '📉', color: '#34C759' },
  ]

  const dayData = {}
  
  dates.forEach(date => {
    // ~60% of days have transactions
    if (Math.random() < 0.6) {
      const expenses = []
      const numExpenses = randomInt(1, 4)
      
      for (let i = 0; i < numExpenses; i++) {
        const category = randomItem(expenseCategories)
        expenses.push({
          id: generateId(),
          categoryId: category.id,
          categoryName: category.name,
          amount: randomInt(100, 5000),
          currency: '₹',
          description: `${category.name} purchase`,
          date,
          isRecurring: false
        })
      }

      // Income on some days (15%)
      const income = []
      if (Math.random() < 0.15) {
        const category = randomItem(incomeCategories)
        income.push({
          id: generateId(),
          categoryId: category.id,
          categoryName: category.name,
          amount: randomInt(10000, 100000),
          currency: '₹',
          description: category.name,
          date,
          isRecurring: false
        })
      }

      // Investments on some days (10%)
      const investments = []
      if (Math.random() < 0.1) {
        const group = randomItem(investmentGroups)
        investments.push({
          id: generateId(),
          investmentGroupId: group.id,
          investmentGroupName: group.name,
          amount: randomInt(5000, 50000),
          currency: '₹',
          description: `Investment in ${group.name}`,
          date,
          isRecurring: false
        })
      }
      
      dayData[date] = {
        _data: {
          expenses,
          income,
          investments,
          notes: undefined
        }
      }
    }
  })

  const config = {
    _data: {
      transactionSettings: {
        defaultCurrency: '₹',
        expenseCategories,
        incomeCategories,
        investmentGroups
      }
    }
  }

  return { dayData, config }
}

/**
 * Generate Travel Plugin Data
 */
function generateTravelData(dates) {
  const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#FFE66D', '#AF52DE', '#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5856D6']
  
  // Calculate some key date indices throughout the year
  const quarterLength = Math.floor(dates.length / 4)
  
  const trips = []
  let currentIdx = 15 // Start trips after 15 days
  
  // Generate 2 large trips (10-14 days each)
  const largeTrips = [
    {
      title: 'Europe Adventure',
      destination: 'Paris, France',
      duration: 14,
      color: colors[0],
      note: 'Multi-city tour through Europe',
      subTrips: [
        { title: 'Paris', destination: 'Paris, France', days: 4, note: 'Eiffel Tower, Louvre, Notre-Dame' },
        { title: 'Rome', destination: 'Rome, Italy', days: 4, note: 'Colosseum, Vatican, Roman Forum' },
        { title: 'Barcelona', destination: 'Barcelona, Spain', days: 4, note: 'Sagrada Familia, Park Güell, Gothic Quarter' },
        { title: 'Amsterdam', destination: 'Amsterdam, Netherlands', days: 2, note: 'Van Gogh Museum, Canal tour' }
      ]
    },
    {
      title: 'Southeast Asia Tour',
      destination: 'Bangkok, Thailand',
      duration: 12,
      color: colors[1],
      note: 'Exploring Southeast Asia',
      subTrips: [
        { title: 'Bangkok', destination: 'Bangkok, Thailand', days: 3, note: 'Grand Palace, Temples, Street Food' },
        { title: 'Phuket', destination: 'Phuket, Thailand', days: 4, note: 'Beach resort, Island hopping' },
        { title: 'Singapore', destination: 'Singapore', days: 3, note: 'Gardens by the Bay, Marina Bay Sands' },
        { title: 'Bali', destination: 'Bali, Indonesia', days: 2, note: 'Ubud rice terraces, Temples' }
      ]
    }
  ]
  
  // Add large trips
  largeTrips.forEach((trip, idx) => {
    const startDate = dates[currentIdx]
    const endDate = dates[currentIdx + trip.duration - 1]
    trips.push({
      ...trip,
      startDate,
      endDate,
      isLarge: true
    })
    currentIdx += trip.duration + randomInt(20, 35) // Gap between trips
  })
  
  // Generate 5 medium trips (4-7 days each)
  const mediumDestinations = [
    { title: 'Goa Beach Vacation', destination: 'Goa, India', note: 'Beaches, water sports, nightlife' },
    { title: 'Kerala Backwaters', destination: 'Kerala, India', note: 'Houseboat stay, backwaters, beaches' },
    { title: 'Rajasthan Heritage Tour', destination: 'Jaipur, India', note: 'Forts, palaces, desert safari' },
    { title: 'Himachal Mountains', destination: 'Manali, India', note: 'Mountain hiking, snow activities' },
    { title: 'Dubai Shopping Trip', destination: 'Dubai, UAE', note: 'Shopping, Burj Khalifa, Desert safari' }
  ]
  
  mediumDestinations.forEach((dest, idx) => {
    const duration = randomInt(4, 7)
    if (currentIdx + duration < dates.length - 20) {
      const startDate = dates[currentIdx]
      const endDate = dates[currentIdx + duration - 1]
      trips.push({
        title: dest.title,
        destination: dest.destination,
        startDate,
        endDate,
        duration,
        color: colors[(idx + 2) % colors.length],
        note: dest.note
      })
      currentIdx += duration + randomInt(15, 30)
    }
  })
  
  // Generate 6 short trips (2 days each)
  const shortDestinations = [
    { title: 'Lonavala Weekend', destination: 'Lonavala, India', note: 'Hill station, waterfalls' },
    { title: 'Pondicherry Beach Trip', destination: 'Pondicherry, India', note: 'French colony, beaches' },
    { title: 'Agra Taj Mahal Visit', destination: 'Agra, India', note: 'Taj Mahal, Agra Fort' },
    { title: 'Udaipur City of Lakes', destination: 'Udaipur, India', note: 'Lake Palace, City Palace' },
    { title: 'Mysore Palace Trip', destination: 'Mysore, India', note: 'Mysore Palace, Chamundi Hills' },
    { title: 'Coorg Coffee Plantations', destination: 'Coorg, India', note: 'Coffee estates, waterfalls' }
  ]
  
  shortDestinations.forEach((dest, idx) => {
    if (currentIdx + 2 < dates.length - 10) {
      const startDate = dates[currentIdx]
      const endDate = dates[currentIdx + 1] // 2 days
      trips.push({
        title: dest.title,
        destination: dest.destination,
        startDate,
        endDate,
        duration: 2,
        color: colors[(idx + 7) % colors.length],
        note: dest.note
      })
      currentIdx += 2 + randomInt(10, 20)
    }
  })

  const dayData = {}
  
  trips.forEach(trip => {
    const startIdx = dates.indexOf(trip.startDate)
    const endIdx = dates.indexOf(trip.endDate)
    const mainTripId = generateId()
    
    // For large trips with sub-trips
    if (trip.isLarge && trip.subTrips) {
      let subTripStartIdx = startIdx
      
      trip.subTrips.forEach((subTrip, idx) => {
        const subTripEndIdx = Math.min(subTripStartIdx + subTrip.days - 1, endIdx)
        const subTripId = generateId()
        
        for (let i = subTripStartIdx; i <= subTripEndIdx; i++) {
          const date = dates[i]
          if (!dayData[date]) {
            dayData[date] = { _data: { travelPlans: [] } }
          }
          
          // Add main trip reference on all days
          if (!dayData[date]._data.travelPlans.some(t => t.id === mainTripId)) {
            dayData[date]._data.travelPlans.push({
              id: mainTripId,
              title: trip.title,
              startDate: trip.startDate,
              endDate: trip.endDate,
              destination: trip.destination,
              color: trip.color,
              note: trip.note,
              files: []
            })
          }
          
          // Add sub-trip
          dayData[date]._data.travelPlans.push({
            id: subTripId,
            title: subTrip.title,
            startDate: dates[subTripStartIdx],
            endDate: dates[subTripEndIdx],
            destination: subTrip.destination,
            color: trip.color,
            note: subTrip.note,
            parentTravelId: mainTripId,
            files: []
          })
        }
        
        subTripStartIdx = subTripEndIdx + 1
      })
    } else {
      // Regular trips without sub-trips
      for (let i = startIdx; i <= endIdx; i++) {
        const date = dates[i]
        dayData[date] = {
          _data: {
            travelPlans: [{
              id: mainTripId,
              title: trip.title,
              startDate: trip.startDate,
              endDate: trip.endDate,
              destination: trip.destination,
              color: trip.color,
              note: trip.note,
              files: []
            }]
          }
        }
      }
    }
  })

  return { dayData, config: null }
}

/**
 * Generate Period Plugin Data (for users who track periods)
 */
function generatePeriodData(dates) {
  const dayData = {}
  let lastPeriodStart = 0
  
  dates.forEach((date, idx) => {
    // Average cycle: 28 days, period duration: 5 days
    const daysSinceLastPeriod = idx - lastPeriodStart
    
    if (daysSinceLastPeriod >= 28) {
      // Start a new period
      lastPeriodStart = idx
      
      // Mark 5 days as period days
      for (let i = 0; i < 5 && idx + i < dates.length; i++) {
        dayData[dates[idx + i]] = {
          _data: {
            isPeriod: true,
            notes: i === 0 ? 'Day 1' : undefined
          }
        }
      }
    }
  })

  return { dayData, config: { _data: {} } }
}

/**
 * Generate complete user backup
 */
function generateDummyUserBackup() {
  console.log('🎨 Generating dummy user data...\n')

  // Generate dates for the last year
  const today = new Date()
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  const dates = []
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(new Date(d)))
  }

  console.log(`📅 Generating data for ${dates.length} days\n`)

  // Generate goal
  const goalId = 'demo-goal-2026'
  
  console.log('📚 Generating Study plugin data...')
  const study = generateStudyData(dates)
  
  console.log('🎯 Generating Productivity plugin data...')
  const productivity = generateProductivityData(dates)
  
  console.log('💰 Generating Finance plugin data...')
  const finance = generateFinanceData(dates)
  
  console.log('✈️  Generating Travel plugin data...')
  const travel = generateTravelData(dates)
  
  console.log('📅 Generating Period plugin data...')
  const period = generatePeriodData(dates)

  // Build the backup structure
  const backup = {
    _metadata: {
      exportedAt: new Date().toISOString(),
      userId: 'dummy-user',
      userEmail: 'dummy@goalchaser.app',
      version: '1.0.0',
      description: 'Comprehensive dummy user data with all plugins populated',
      stats: {
        goals: 1,
        totalDays: dates.length,
        studyDays: Object.keys(study.dayData).length,
        productivityDays: Object.keys(productivity.dayData).length,
        financeDays: Object.keys(finance.dayData).length,
        travelDays: Object.keys(travel.dayData).length,
        periodDays: Object.keys(period.dayData).length
      }
    },
    data: {
      goals: {
        [goalId]: {
          _data: {
            id: goalId,
            name: 'My 2026 Goals',
            description: 'Comprehensive goal tracking with all features',
            createdAt: dates[0],
            startDate: dates[0],
            endDate: dates[dates.length - 1],
            color: '#007AFF'
          },
          _subcollections: {
            // Study plugin
            addons: {
              study: {
                _subcollections: {
                  days: study.dayData,
                  settings: {
                    config: study.config
                  }
                }
              },
              // Productivity plugin
              productivity: {
                _subcollections: {
                  days: productivity.dayData,
                  settings: {
                    config: productivity.config
                  }
                }
              },
              // Finance plugin
              finance: {
                _subcollections: {
                  days: finance.dayData,
                  settings: {
                    config: finance.config
                  }
                }
              },
              // Travel plugin
              travel: {
                _subcollections: {
                  days: travel.dayData
                }
              },
              // Period plugin
              period: {
                _subcollections: {
                  days: period.dayData,
                  settings: {
                    config: period.config
                  }
                }
              }
            }
          }
        }
      },
      settings: {
        preferences: {
          _data: {
            theme: 'dark',
            notifications: true,
            weekStartsOn: 0
          }
        }
      }
    }
  }

  return backup
}

/**
 * Main execution
 */
function main() {
  console.log('╔════════════════════════════════════════════════════╗')
  console.log('║    Goal Chaser - Dummy User Data Generator        ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  const backup = generateDummyUserBackup()
  const filename = 'dummy-user-data.json'
  
  console.log('\n💾 Writing to file...')
  writeFileSync(filename, JSON.stringify(backup, null, 2))
  
  const stats = backup._metadata.stats
  
  console.log('\n✅ Dummy user data generated successfully!\n')
  console.log('📊 Statistics:')
  console.log(`   • Total days: ${stats.totalDays}`)
  console.log(`   • Study days: ${stats.studyDays}`)
  console.log(`   • Productivity days: ${stats.productivityDays}`)
  console.log(`   • Finance days: ${stats.financeDays}`)
  console.log(`   • Travel days: ${stats.travelDays}`)
  console.log(`   • Period days: ${stats.periodDays}`)
  console.log(`\n📁 Output file: ${filename}`)
  console.log(`   File size: ${(JSON.stringify(backup).length / 1024).toFixed(2)} KB`)
  console.log('\n📤 Upload Instructions:')
  console.log('   1. Sign in to your Goal Chaser account')
  console.log('   2. Navigate to /debug/restore')
  console.log('   3. Select the generated JSON file')
  console.log('   4. Click "Restore Data" to import')
  console.log('\n⚠️  Note: This will add data to your account. Make a backup first!')
  console.log('')
}

main()
