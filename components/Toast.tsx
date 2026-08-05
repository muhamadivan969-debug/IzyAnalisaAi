"use client";

import { createContext, useContext, useState } from "react";

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }: any) {
  const [message, setMessage] = useState<string | null>(null);

  function toast(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#00c2ff] text-[#05070d] text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl z-50">{message}</div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || { toast: (m: string) => {} };
}
