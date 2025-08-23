'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu'

type Props = DropdownMenuItemProps & {
  modal: ModalType
  children?: React.ReactNode
}

export default function OpenModalDropdownMenuItem({
  modal,
  children,
  ...props
}: Props) {
  const { openModal } = useModalStore((state) => state)

  return (
    <DropdownMenuItem onClick={() => openModal(modal)} {...props}>
      {children}
    </DropdownMenuItem>
  )
}
