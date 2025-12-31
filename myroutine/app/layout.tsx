import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import AppShell from "@/components/app-shell"
import DaumPostcodeScript from "@/components/daum-postcode-script"

export const metadata: Metadata = {
  title: "MyRoutine - 구독형 이커머스",
  description: "신선한 상품을 구독하고 편리하게 받아보세요",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DaumPostcodeScript />
          <AppShell>
            {children}
            {/* <Analytics /> */}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
