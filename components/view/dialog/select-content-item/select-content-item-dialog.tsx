'use client'

import { CommandDialog } from '@/components/ui/command'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import React from 'react'
import SelectContentItemDialogContent from './select-content-item-dialog-content'

export default function SelectContentItemDialog() {
  const { currentModal, closeModal, modalParams: rawModalParams } = useModalStore((state) => state)
  const modalParams = React.useMemo(
    () => getModalParams(ModalType.SelectContentItem, rawModalParams),
    [rawModalParams],
  )

  const isOpen = React.useMemo(
    () =>
      currentModal == ModalType.SelectContentItem &&
    getModalParams(ModalType.SelectContentItem, rawModalParams)?.category !== undefined,
    [currentModal, modalParams],
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
      {isOpen && <SelectContentItemDialogContent />}
    </CommandDialog>
  )
}
