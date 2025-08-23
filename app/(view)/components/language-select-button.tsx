'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React from 'react'

const LANGUAGES = [
  {
    value: 'en',
    label: 'English',
  },
]

export default function LanguageSelectButton(
  props: React.ComponentProps<typeof Select>,
) {
  return (
    <Select defaultValue="en" {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent side="top">
        {LANGUAGES.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
