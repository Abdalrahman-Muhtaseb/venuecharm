'use client'

import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ThemeToggleProps {
  isHe: boolean
}

export function ThemeToggle({ isHe }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light',  label: isHe ? 'בהיר' : 'Light',  icon: Sun },
    { value: 'dark',   label: isHe ? 'כהה' : 'Dark',    icon: Moon },
    { value: 'system', label: isHe ? 'מערכת' : 'System', icon: Monitor },
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={isHe ? 'ערכת נושא' : 'Theme'}
          className="rounded-full"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" aria-hidden="true" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {options.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon className="me-2 h-4 w-4" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {theme === value && <Check className="h-4 w-4" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
