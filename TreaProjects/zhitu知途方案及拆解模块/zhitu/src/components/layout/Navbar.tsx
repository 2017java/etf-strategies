'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, FileSearch, Scale, CircleUserRound } from 'lucide-react';

const navItems = [
  { href: '/assessment', label: '职业测评', icon: Compass },
  { href: '/jd-decoder', label: 'JD解读', icon: FileSearch },
  { href: '/match', label: '匹配分析', icon: Scale },
  { href: '/profile', label: '个人中心', icon: CircleUserRound },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 hidden lg:block bg-ivory border-b border-border-cream">
      <div className="max-w-xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-heading-5 text-near-black">
          知途
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-comfortable min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-terracotta bg-terracotta/5 font-medium'
                    : 'text-olive-gray hover:text-near-black'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="text-body-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
