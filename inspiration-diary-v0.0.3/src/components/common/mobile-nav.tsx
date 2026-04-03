'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Lightbulb, CheckSquare, BarChart3, Plus } from 'lucide-react'

const navItems = [
  { href: '/', label: '灵感', icon: Lightbulb },
  { href: '/todos', label: '待办', icon: CheckSquare },
  { href: '/stats', label: '统计', icon: BarChart3 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <>
      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-20 px-4">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            // 中间位置留空给浮动按钮
            if (index === 1) {
              return (
                <div key="spacer" className="w-16" />
              )
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 transition-all',
                  isActive
                    ? 'text-[#E8B4B8]'
                    : 'text-gray-500'
                )}
              >
                <Icon className={cn(
                  'h-6 w-6 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-xs font-medium transition-all',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* 浮动创作按钮 */}
      <Link href="/new" className="fixed bottom-20 right-4 z-50">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#E8B4B8] to-[#A8D5BA] rounded-full blur-md opacity-70 animate-pulse" />
          <button className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#E8B4B8] to-[#A8D5BA] rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-15 active:scale-95">
            <Plus className="h-6 w-6 text-white" />
          </button>
        </div>
      </Link>
    </>
  )
}