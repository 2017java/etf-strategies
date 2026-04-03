import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/common/nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '灵感日记 - 记录每一个灵感瞬间',
  description: '一个帮助用户快速记录灵感想法的应用，支持文字、图片、语音多种输入方式，通过AI进行洞察分析',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
