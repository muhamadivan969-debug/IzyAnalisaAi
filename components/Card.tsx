export default function Card({ children, className = '' }: { children: any; className?: string }) {
  return (
    <div className={`bg-[#0a0e1a] rounded-xl border border-[#162035] p-4 ${className}`}>
      {children}
    </div>
  );
}
