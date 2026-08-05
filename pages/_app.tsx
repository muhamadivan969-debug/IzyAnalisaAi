"use client";

import '@/app/globals.css';
import type { AppProps } from 'next/app';
import { ToastProvider } from '@/components/Toast';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#05070d] text-[#e5e9f5]">
        <Header />
        <main className="max-w-md mx-auto p-4 pb-28">
          <Component {...pageProps} />
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
