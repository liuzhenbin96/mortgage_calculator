import './globals.css';
import React from 'react';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';


export const metadata = {
  title: '房贷还款计算器',
  description: '世界级设计的房贷还款模拟与管理工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        {children}
        <Analytics/>
        <SpeedInsights/>
        </body>
    </html>
  );
}
