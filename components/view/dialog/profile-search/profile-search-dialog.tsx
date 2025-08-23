'use client'

import { CommandDialog } from '@/components/ui/command'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import React from 'react'
import ProfileSearchDialogContent from './profile-search-dialog-content'
import { ModalType } from '@/stores/modal'

export default function ProfileSearchDialog() {
  const { currentModal, closeModal } = useModalStore((state) => state)
  const { profile } = useProfileStore((state) => state)

  const isOpen = React.useMemo(
    () => currentModal == ModalType.ProfileSearch && profile?.id !== undefined,
    [currentModal, profile?.id],
  )

  if (!isOpen) {
    return null
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={closeModal}
      commandProps={{ shouldFilter: false }}
    >
      {isOpen && <ProfileSearchDialogContent />}
    </CommandDialog>
  )
}
