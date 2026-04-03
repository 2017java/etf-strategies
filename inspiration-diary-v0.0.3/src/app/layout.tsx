import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/common/nav'
import { MobileNav } from '@/components/common/mobile-nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '灵感日记 - 记录每一个灵感瞬间',
  description: '一个帮助用户快速记录灵感想法的应用，支持文字、图片、语音多种输入方式，通过AI进行洞察分析',
  themeColor: '#E8B4B8',
  icons: [
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      url: '/icons/icon-180x180.png',
      sizes: '180x180',
    },
    {
      rel: 'mask-icon',
      url: '/icons/maskable-icon-512x512.png',
      color: '#E8B4B8',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8B4B8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="灵感日记" />
        <meta name="description" content="记录每一个闪光的想法" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#FAFAF8] to-[#F5F0F6]">
          <Nav />
          <main className="flex-1 pb-24">{children}</main>
          <MobileNav />
        </div>
        <script src="/service-worker-registration.js" defer></script>
      </body>
    </html>
  )
}
