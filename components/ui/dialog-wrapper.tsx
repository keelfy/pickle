import { useMediaQuery } from '@/lib/use-media-query'
import { useModalStore } from '@/providers/modal'
import { ModalParamValue, ModalType } from '@/stores/modal'
import React from 'react'
import { Dialog, DialogContent } from './dialog'
import { Drawer, DrawerContent } from './drawer'

type DialogWrapperProps = {
  modalType: ModalType
  validateModalParams?: (params: Record<string, ModalParamValue>) => boolean
}

export default function DialogWrapper({
  modalType,
  validateModalParams = () => true,
  children,
}: React.PropsWithChildren<DialogWrapperProps>) {
  const { currentModal, modalParams, closeModal } = useModalStore(
    (state) => state,
  )

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const isOpen = React.useMemo(
    () => currentModal === modalType && validateModalParams(modalParams ?? {}),
    [currentModal, modalParams, validateModalParams, modalType],
  )

  if (!isOpen) {
    return null
  }

  if (!isDesktop) {
    return (
      <Drawer open={isOpen} onOpenChange={closeModal}>
        <DrawerContent>{children}</DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-svh overflow-y-auto">
        {isOpen && children}
      </DialogContent>
    </Dialog>
  )
}
