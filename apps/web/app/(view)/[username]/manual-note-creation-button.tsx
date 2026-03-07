'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import React from 'react'

export default function ManualNoteCreationButton({
  children,
  ...props
}: React.PropsWithChildren<ButtonProps>) {
  const openModal = useModalStore((state) => state.openModal)
  const handleClick = () => openModal(ModalType.ManualNoteCreation)

  return (
    <Button variant="default" onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}
