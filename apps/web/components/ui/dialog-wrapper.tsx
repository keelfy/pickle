'use client'

import { useModalStore } from '@/providers/modal'
import { ModalParamValue, ModalType } from '@/stores/modal'
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './drawer'

type DialogWrapperProps = {
  modalType: ModalType
  validateModalParams?: (params: Record<string, ModalParamValue>) => boolean
  isDesktop: boolean | undefined
}

type DialogWrapperContentsProps = React.PropsWithChildren<
  React.ComponentProps<'div'>
> & {
  isDesktop: boolean | undefined
}

export function DialogWrapperHeader({
  isDesktop,
  children,
  ...props
}: DialogWrapperContentsProps) {
  const Header = isDesktop ? DialogHeader : DrawerHeader
  return <Header {...props}>{children}</Header>
}

export function DialogWrapperFooter({
  isDesktop,
  children,
  ...props
}: DialogWrapperContentsProps) {
  const Footer = isDesktop ? DialogFooter : DrawerFooter
  return <Footer {...props}>{children}</Footer>
}

export function DialogWrapperTitle({
  isDesktop,
  children,
  ...props
}: DialogWrapperContentsProps) {
  const Title = isDesktop ? DialogTitle : DrawerTitle
  return <Title {...props}>{children}</Title>
}

export function DialogWrapperDescription({
  isDesktop,
  children,
  ...props
}: DialogWrapperContentsProps) {
  const Description = isDesktop ? DialogDescription : DrawerDescription
  return <Description {...props}>{children}</Description>
}

export default function DialogWrapper({
  isDesktop,
  modalType,
  validateModalParams = () => true,
  children,
}: React.PropsWithChildren<DialogWrapperProps>) {
  const { currentModal, modalParams, closeModal } = useModalStore(
    (state) => state,
  )

  const isOpen = React.useMemo(
    () => currentModal === modalType && validateModalParams(modalParams ?? {}),
    [currentModal, modalParams, validateModalParams, modalType],
  )

  if (!isOpen || isDesktop === undefined) {
    return null
  }

  const Window = isDesktop ? Dialog : Drawer
  const Content = isDesktop ? DialogContent : DrawerContent
  const styles = isDesktop ? 'max-h-svh overflow-y-auto' : ''

  return (
    <Window open={isOpen} onOpenChange={closeModal}>
      <Content className={styles}>{isOpen && children}</Content>
    </Window>
  )
}
