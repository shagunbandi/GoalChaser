'use client'

import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'
import type { SubjectConfig } from '../types'

interface SubjectFilterProps {
  subjects: SubjectConfig[]
  selectedSubjects: Set<string>
  onToggleSubject: (subjectId: string) => void
  onSelectAllSubjects: () => void
  onClearAllSubjects: () => void
}

export function SubjectFilter({
  subjects,
  selectedSubjects,
  onToggleSubject,
  onSelectAllSubjects,
  onClearAllSubjects,
}: SubjectFilterProps) {
  return (
    <MultiSelectDropdown
      items={subjects}
      selectedIds={selectedSubjects}
      getItemId={(s) => s.id}
      getItemLabel={(s) => s.name}
      getItemColor={(s) => s.color}
      onToggle={onToggleSubject}
      onSelectAll={onSelectAllSubjects}
      onClearAll={onClearAllSubjects}
      label="Subjects"
      icon="📚"
    />
  )
}
