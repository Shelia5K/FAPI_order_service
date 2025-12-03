import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FAPI Objednávkový systém',
  description: 'Jednoduchý objednávkový systém s výpočtem DPH a konverzí měn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: Prevents warning when browser extensions
    // (like Google Translate) modify the HTML attributes
    <html lang="cs" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
