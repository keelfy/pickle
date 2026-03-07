'use client'

import { ButtonProps } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const THEMES = [
  {
    value: 'system',
    label: 'System',
    icon: LaptopIcon,
  },
  {
    value: 'light',
    label: 'Light',
    icon: SunIcon,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: MoonIcon,
  },
]

export default function ThemeSelectButton({
  className,
  ...props
}: ButtonProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme, setTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const ICON_SIZE = 16

  return (
    <Select
      defaultValue={theme}
      value={theme}
      onValueChange={(value) => setTheme(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a theme" />
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((theme) => (
          <SelectItem key={theme.value} value={theme.value}>
            <div className="flex items-center gap-2">
              <theme.icon size={ICON_SIZE} />
              <p>{theme.label}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
