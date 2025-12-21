import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QBos Proof Harness',
  description: 'Minimal proof harness for QuietBuild OS API verification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
