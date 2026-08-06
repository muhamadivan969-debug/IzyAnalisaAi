"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, Crown } from "lucide-react";
import { useToast } from "./Toast";
import { useRouter } from "next/router";

export default function Header() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#05070d]/90 backdrop-blur-md border-b border-[#ffffff12] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
        <h1 className="text-lg font-extrabold tracking-tight">
          <span className="text-[#00c2ff]">Izy</span>Analisa<span className="text-[#00c2ff]">AI</span>
        </h1>
      </div>

      <div className="flex items-center space-x-3 relative">
        <button className="p-2 hover:bg-[#0a0e1a] rounded-lg transition-colors" onClick={() => toast('Fitur notifikasi belum aktif')}>
          <Bell className="w-5 h-5 text-gray-300" />
        </button>

        <div ref={ref} className="relative">
          <button onClick={() => setOpen(v => !v)} className="p-1 border border-[#00c2ff]/30 rounded-full bg-[#0a0e1a] transition-all">
            <div className="w-8 h-8 flex items-center justify-center text-[#00c2ff]">
              <User className="w-5 h-5" />
            </div>
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-64 bg-[#0a0e1a] border border-[#ffffff12] rounded-xl shadow-2xl p-4 z-50 animate-fade">
              <div className="pb-3 border-b border-[#ffffff12]">
                <h4 className="font-semibold text-sm">Trader IzyAnalisaAI</h4>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1">Akun Gratis</span>
              </div>

              <div className="py-3 space-y-2 text-sm text-gray-300">
                <button onClick={() => toast('Upgrade belum tersedia')} className="w-full text-left flex items-center py-1 hover:text-white"><Crown className="text-yellow-400 mr-2" /> Upgrade Premium</button>
                <button onClick={() => toast('Pengaturan belum tersedia')} className="w-full text-left py-1 hover:text-white">Pengaturan</button>
                <button onClick={() => toast('Ganti akun...')} className="w-full text-left py-1 hover:text-white">Ganti Akun</button>
                <button onClick={() => toast('Notifikasi...')} className="w-full text-left py-1 hover:text-white">Notifikasi</button>
                <button onClick={() => toast('Bantuan & FAQ...')} className="w-full text-left py-1 hover:text-white">Bantuan & FAQ</button>
              </div>

              <div className="pt-2 border-t border-[#ffffff12]">
                <button onClick={() => toast('Logout...')} className="w-full text-left text-[#ff4d5a] text-sm font-semibold py-1">Log Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
