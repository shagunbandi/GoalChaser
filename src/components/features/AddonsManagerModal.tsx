'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import type { AddonId } from '@/types/addon-config'
import { useManageablePlugins } from '@/core/plugin-registry/hooks'

interface AddonsManagerModalProps {
  open: boolean
  onClose: () => void
  goalId: string
  enabledAddons: AddonId[]
  onSave: (enabled: AddonId[]) => Promise<void>
}

export function AddonsManagerModal({
  open,
  onClose,
  goalId,
  enabledAddons,
  onSave,
}: AddonsManagerModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<AddonId[]>(enabledAddons)
  const [isSaving, setIsSaving] = useState(false)
  const { plugins: manageablePlugins, loading } = useManageablePlugins()

  // Filter out primary addons (like calendar) - they can't be disabled
  const allAddons: AddonId[] = manageablePlugins.map(p => p.id as AddonId)

  const handleToggle = (addonId: AddonId) => {
    setSelectedAddons((prev) => {
      if (prev.includes(addonId)) {
        // Don't allow disabling the last addon
        if (prev.length === 1) {
          return prev
        }
        return prev.filter((id) => id !== addonId)
      } else {
        return [...prev, addonId]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(selectedAddons)
      onClose()
    } catch (error) {
      console.error('Error saving add-ons config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    // Reset to current enabled addons on close
    setSelectedAddons(enabledAddons)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Manage Add-ons"
    >
      <div className="space-y-6">
        {/* Description */}
        <p className="text-white/60 text-sm">
          Enable or disable add-ons for this goal. The calendar is always available as your core tracker.
        </p>

        {/* Add-ons List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-white/50 py-4">Loading plugins...</div>
          ) : (
            allAddons.map((addonId) => {
              const plugin = manageablePlugins.find(p => p.id === addonId)
              if (!plugin) return null
              
            const isEnabled = selectedAddons.includes(addonId)
            const isOnlyEnabled = isEnabled && selectedAddons.length === 1

            return (
              <div
                key={addonId}
                className="
                  flex items-center justify-between p-4
                  bg-white/5 hover:bg-white/10
                  border border-white/10 rounded-xl
                  transition-all duration-150
                "
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{plugin.metadata.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{plugin.metadata.name}</h3>
                      {plugin.metadata.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm mt-0.5">
                      {plugin.metadata.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(addonId)}
                  disabled={isOnlyEnabled}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors duration-200 ease-in-out
                    ${isEnabled ? 'bg-blue-500' : 'bg-white/20'}
                    ${isOnlyEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={isOnlyEnabled ? 'Cannot disable the last add-on' : ''}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white
                      transition-transform duration-200 ease-in-out
                      ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            )
          })
          )}
        </div>

        {/* Info message */}
        {selectedAddons.length === 1 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-400/80 text-sm">
              At least one add-on must be enabled
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <button
            onClick={handleClose}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              bg-white/5 hover:bg-white/10
              text-white/80 hover:text-white
              font-medium transition-all duration-150
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              bg-blue-500 hover:bg-blue-600
              text-white font-medium
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
