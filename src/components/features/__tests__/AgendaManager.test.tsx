/**
 * Component tests for AgendaManager
 * 
 * TODO: Install testing dependencies first:
 * npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
 * 
 * Run with: npm test
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgendaManager } from '../AgendaManager'
import type { AgendaItem, DayDetails } from '@/types'

// Mock data
const mockDayDetails: Record<string, DayDetails> = {
  '2026-01-06': {
    status: null,
    subject: '',
    topic: '',
    note: '',
    subjects: [],
    agendaItems: [],
    plannedItems: [],
    travelPlans: [],
  },
}

const mockAgendaItem: AgendaItem = {
  id: 'agenda_123',
  title: 'Team Meeting',
  startTime: '10:00',
  endTime: '11:00',
  note: 'Weekly sync',
  recurrenceId: 'rec_456',
  sequenceId: 'rec_456',
  repeat: {
    type: 'weekly',
    days: ['mon'],
  },
  subjects: ['Work'],
  completed: false,
  recurrenceStart: '2026-01-06',
  recurrenceEnd: '2026-02-03',
}

const defaultProps = {
  selectedDate: '2026-01-06',
  todayISO: '2026-01-02',
  dayDetails: mockDayDetails,
  agendaItems: [],
  availableSubjects: ['Work', 'Study', 'Personal'],
  onUpdateDetails: jest.fn(() => Promise.resolve()),
  onStatus: jest.fn(),
}

describe('AgendaManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render agenda section with label', () => {
      render(<AgendaManager {...defaultProps} />)
      expect(screen.getByText('Agenda')).toBeInTheDocument()
    })

    it('should show item count when agenda items exist', () => {
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
      }
      render(<AgendaManager {...props} />)
      expect(screen.getByText('1 item')).toBeInTheDocument()
    })

    it('should show correct plural form for multiple items', () => {
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem, { ...mockAgendaItem, id: 'agenda_124' }],
      }
      render(<AgendaManager {...props} />)
      expect(screen.getByText('2 items')).toBeInTheDocument()
    })

    it('should render "Add agenda" button', () => {
      render(<AgendaManager {...defaultProps} />)
      expect(screen.getByText('+ Add agenda')).toBeInTheDocument()
    })

    it('should display existing agenda items', () => {
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
      }
      render(<AgendaManager {...props} />)
      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      expect(screen.getByText('Weekly')).toBeInTheDocument()
    })
  })

  describe('Creating agenda items', () => {
    it('should open modal when clicking "Add agenda"', async () => {
      const user = userEvent.setup()
      render(<AgendaManager {...defaultProps} />)
      
      const addButton = screen.getByText('+ Add agenda')
      await user.click(addButton)
      
      expect(screen.getByText('Add agenda')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add an agenda item...')).toBeInTheDocument()
    })

    it('should create a single agenda item', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = { ...defaultProps, onUpdateDetails }
      
      render(<AgendaManager {...props} />)
      
      // Open modal
      await user.click(screen.getByText('+ Add agenda'))
      
      // Fill in title
      const titleInput = screen.getByPlaceholderText('Add an agenda item...')
      await user.type(titleInput, 'New Meeting')
      
      // Click Add button
      await user.click(screen.getByText('Add'))
      
      await waitFor(() => {
        expect(onUpdateDetails).toHaveBeenCalled()
      })
    })

    it('should create recurring weekly agenda item', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = { ...defaultProps, onUpdateDetails }
      
      render(<AgendaManager {...props} />)
      
      // Open modal
      await user.click(screen.getByText('+ Add agenda'))
      
      // Fill in title
      await user.type(screen.getByPlaceholderText('Add an agenda item...'), 'Team Meeting')
      
      // Select weekly repeat
      const repeatSelect = screen.getByDisplayValue('None')
      await user.selectOptions(repeatSelect, 'weekly')
      
      // Select Monday
      await user.click(screen.getByText('MON'))
      
      // Set end date
      const endDateInput = screen.getByPlaceholderText('Optional')
      await user.clear(endDateInput)
      await user.type(endDateInput, '2026-02-03')
      
      // Click Add
      await user.click(screen.getByText('Add'))
      
      await waitFor(() => {
        // Should be called multiple times (once per occurrence)
        expect(onUpdateDetails).toHaveBeenCalled()
      })
    })

    it('should show validation error when title is empty', async () => {
      const user = userEvent.setup()
      const onStatus = jest.fn()
      const props = { ...defaultProps, onStatus }
      
      render(<AgendaManager {...props} />)
      
      // Open modal
      await user.click(screen.getByText('+ Add agenda'))
      
      // Try to add without title
      await user.click(screen.getByText('Add'))
      
      expect(onStatus).toHaveBeenCalledWith({
        text: 'Agenda title required',
        tone: 'error',
      })
    })
  })

  describe('Editing agenda items', () => {
    it('should open modal in edit mode when clicking edit button', async () => {
      const user = userEvent.setup()
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
      }
      
      render(<AgendaManager {...props} />)
      
      // Click edit button (pencil icon)
      const editButton = screen.getByTitle('Edit')
      await user.click(editButton)
      
      expect(screen.getByText('Edit agenda')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Team Meeting')).toBeInTheDocument()
    })

    it('should preserve end date when editing', async () => {
      const user = userEvent.setup()
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
      }
      
      render(<AgendaManager {...props} />)
      
      // Click edit
      await user.click(screen.getByTitle('Edit'))
      
      // Check that end date is preserved
      const endDateInput = screen.getByPlaceholderText('Optional') as HTMLInputElement
      expect(endDateInput.value).toBe('2026-02-03')
    })

    it('should update agenda item when saving changes', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
        onUpdateDetails,
      }
      
      render(<AgendaManager {...props} />)
      
      // Click edit
      await user.click(screen.getByTitle('Edit'))
      
      // Change title
      const titleInput = screen.getByDisplayValue('Team Meeting')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Meeting')
      
      // Click Update
      await user.click(screen.getByText('Update'))
      
      await waitFor(() => {
        expect(onUpdateDetails).toHaveBeenCalled()
      })
    })
  })

  describe('Deleting agenda items', () => {
    it('should delete single agenda item', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
        onUpdateDetails,
      }
      
      render(<AgendaManager {...props} />)
      
      // Click delete button (X icon)
      const deleteButton = screen.getByTitle('Delete')
      await user.click(deleteButton)
      
      expect(onUpdateDetails).toHaveBeenCalledWith(
        '2026-01-06',
        expect.objectContaining({
          agendaItems: [],
        })
      )
    })

    it('should delete entire series when clicking series delete', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = {
        ...defaultProps,
        agendaItems: [mockAgendaItem],
        onUpdateDetails,
        dayDetails: {
          ...mockDayDetails,
          '2026-01-13': {
            ...mockDayDetails['2026-01-06'],
            agendaItems: [{ ...mockAgendaItem, id: 'agenda_125' }],
          },
        },
      }
      
      render(<AgendaManager {...props} />)
      
      // Click series delete button (trash icon)
      const seriesDeleteButton = screen.getByTitle('Delete series')
      await user.click(seriesDeleteButton)
      
      await waitFor(() => {
        // Should be called for each day with the series
        expect(onUpdateDetails).toHaveBeenCalled()
      })
    })
  })

  describe('Completion toggling', () => {
    it('should toggle completion status for past dates', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = {
        ...defaultProps,
        selectedDate: '2026-01-01', // Past date
        todayISO: '2026-01-02',
        agendaItems: [mockAgendaItem],
        onUpdateDetails,
      }
      
      render(<AgendaManager {...props} />)
      
      // Click completion checkbox
      const completeButton = screen.getByTitle('Mark done')
      await user.click(completeButton)
      
      expect(onUpdateDetails).toHaveBeenCalled()
    })

    it('should attach subjects when completing agenda item', async () => {
      const user = userEvent.setup()
      const onUpdateDetails = jest.fn(() => Promise.resolve())
      const props = {
        ...defaultProps,
        selectedDate: '2026-01-01',
        todayISO: '2026-01-02',
        agendaItems: [mockAgendaItem],
        onUpdateDetails,
      }
      
      render(<AgendaManager {...props} />)
      
      // Click completion
      await user.click(screen.getByTitle('Mark done'))
      
      await waitFor(() => {
        // Should be called twice: once for completion, once for subjects
        expect(onUpdateDetails).toHaveBeenCalledTimes(2)
      })
    })
  })
})

