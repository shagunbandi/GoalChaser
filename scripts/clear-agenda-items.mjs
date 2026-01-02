#!/usr/bin/env node

/**
 * Script to clear all agenda items from localStorage
 * This helps clean up before testing
 */

console.log('🧹 Agenda Item Cleanup Script')
console.log('═'.repeat(60))
console.log()
console.log('⚠️  This script requires access to browser localStorage')
console.log()
console.log('To clear all agenda items manually:')
console.log()
console.log('1. Open your browser DevTools (F12)')
console.log('2. Go to Console tab')
console.log('3. Run this code:')
console.log()
console.log('─'.repeat(60))
console.log(`
// Clear all agenda items from all goals
Object.keys(localStorage).forEach(key => {
  if (key.includes('dayDetails')) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      let modified = false;
      
      Object.keys(data).forEach(dateKey => {
        if (data[dateKey].plannedItems) {
          data[dateKey].plannedItems = [];
          modified = true;
        }
      });
      
      if (modified) {
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Cleared agenda items from:', key);
      }
    } catch (e) {
      console.error('Error processing', key, e);
    }
  }
});

console.log('✅ All agenda items cleared!');
`)
console.log('─'.repeat(60))
console.log()
console.log('Or if using Firebase:')
console.log()
console.log('1. Go to Firebase Console')
console.log('2. Navigate to Firestore Database')
console.log('3. Find: users/{userId}/goals/{goalId}/days')
console.log('4. Remove plannedItems field from documents')
console.log()
console.log('═'.repeat(60))
console.log()
console.log('For testing, you can also use the UI to delete series:')
console.log('- Click the 🗑️ button next to any recurring agenda item')
console.log('- This will delete all instances of that series')
console.log()
