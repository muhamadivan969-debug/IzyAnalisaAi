"use client";

import { Home, BarChart2, MessageCircle, Star, User } from "lucide-react";
import { useRouter } from "next/router";

export default function BottomNav() {
  const router = useRouter();
  const tabs = [
    { key: "home", label: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { key: "analisa", label: "Analisa", href: "/analisa", icon: <BarChart2 className="w-5 h-5" /> },
    { key: "stream", label: "Stream", href: "/stream", icon: <MessageCircle className="w-5 h-5" /> },
    { key: "watchlist", label: "Watchlist", href: "/watchlist", icon: <Star className="w-5 h-5" /> },
    { key: "profile", label: "Profil", href: "/profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#05070d]/90 backdrop-blur-md border-t border-[#ffffff12] max-w-md mx-auto z-40 flex justify-around py-3">
      {tabs.map(tab => {
        const active = router.pathname === tab.href || (router.pathname.startsWith('/stock') && tab.key === 'home' && tab.href === '/');
        return (
          <button key={tab.key} onClick={() => router.push(tab.href)} className={`flex flex-col items-center text-[10px] font-bold transition-all ${active ? 'text-[#00c2ff]' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 flex items-center justify-center`}>{tab.icon}</div>
            <span className="capitalize">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
