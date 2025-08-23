import { cn } from '@/lib/utils'
import { SortAscIcon, SortDescIcon } from 'lucide-react'
import React from 'react'
import { Button } from './button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'

type SortDrawerOption = {
  label: string
  value: string
}

type SortDrawerProps = React.PropsWithChildren<{
  sortOptions: SortDrawerOption[]
  value: string
  onChange: (value: string) => void
  onReset: () => void
}>

export default function SortDrawer({
  sortOptions,
  value,
  onChange,
  onReset,
  children,
}: SortDrawerProps) {
  const Icon = sortOptions
    .find((option) => option.value === value)
    ?.value.includes('asc')
    ? SortAscIcon
    : SortDescIcon
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Sort Options</DrawerTitle>
          <DrawerDescription className="hidden" />
        </DrawerHeader>
        <div className="flex flex-col gap-2">
          {sortOptions.map((option) => (
            <DrawerClose key={option.value} asChild>
              <Button
                variant="link"
                className={cn(value === option.value && 'underline')}
                onClick={() => onChange(option.value)}
              >
                <Icon className="size-4" />
                {option.label}
              </Button>
            </DrawerClose>
          ))}
        </div>
        <DrawerFooter className="mt-4">
          <DrawerClose asChild>
            <Button variant="destructive" onClick={onReset}>
              Reset Sort
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
