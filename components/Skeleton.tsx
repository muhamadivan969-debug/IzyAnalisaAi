"use client";

export default function Skeleton({ className = "h-6 w-full rounded-xl bg-[#111a2e]" }: { className?: string }) {
  return <div className={`${className} animate-pulse`}></div>;
}
