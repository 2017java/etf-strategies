'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Lightbulb, CheckSquare, BarChart3, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

const navItems = [
  { href: '/', label: '灵感记录', icon: Lightbulb },
  { href: '/todos', label: '待办事项', icon: CheckSquare },
  { href: '/stats', label: '统计分析', icon: BarChart3 },
]

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">灵感日记</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'transition-colors hover:text-foreground/80 flex items-center gap-1',
                    pathname === item.href
                      ? 'text-foreground'
                      : 'text-foreground/60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
              <Lightbulb className="mr-2 h-6 w-6 text-primary" />
              <span className="font-bold">灵感日记</span>
            </Link>
            <nav className="flex flex-col space-y-4 mt-6">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'transition-colors hover:text-foreground/80 flex items-center gap-2',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-foreground/60'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
          <Lightbulb className="h-6 w-6 text-primary" />
          <span className="font-bold">灵感日记</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link href="/new">
              <Button size="sm">记录灵感</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
