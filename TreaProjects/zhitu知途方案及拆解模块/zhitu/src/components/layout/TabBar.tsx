'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, FileSearch, Scale, CircleUserRound } from 'lucide-react';

const tabs = [
  { href: '/assessment', label: '测评', icon: Compass },
  { href: '/jd-decoder', label: 'JD解读', icon: FileSearch },
  { href: '/match', label: '匹配', icon: Scale },
  { href: '/profile', label: '我的', icon: CircleUserRound },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-ivory border-t border-border-cream pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] transition-colors ${
                isActive
                  ? 'text-terracotta bg-terracotta/5 font-medium'
                  : 'text-stone-gray'
              }`}
            >
              <Icon size={22} strokeWidth={1.5} />
              <span className="text-micro">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
