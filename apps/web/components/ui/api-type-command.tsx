'use client'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ApiType } from '@/utils/api/constants'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export type ApiTypeCommandProps<T extends string> = {
  entries: ApiType<T>[]
  value: T
  onSelect: (value: T) => void
  getLabel: (category: ApiType<T>) => React.ReactNode | string | null
  placeholder?: string
  nothingFound?: string
}

export default function ApiTypeCommand<T extends string>({
  entries,
  value,
  onSelect,
  getLabel,
  placeholder,
  nothingFound = 'Nothing found',
}: ApiTypeCommandProps<T>) {
  return (
    <Command>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{nothingFound}</CommandEmpty>
        <CommandGroup>
          {entries.map((entry) => (
            <CommandItem
              key={entry.value}
              value={entry.value}
              onSelect={(selected) => onSelect(selected as T)}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  value === entry.value ? 'opacity-100' : 'opacity-0',
                )}
              />
              {getLabel(entry)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
