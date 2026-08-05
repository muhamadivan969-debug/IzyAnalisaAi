export default function ChartPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[#071028] rounded-xl border border-[#162035] p-4 ${className}`}>
      <div className="h-40 bg-gradient-to-r from-[#00121a] to-[#001a2b] rounded-lg" />
    </div>
  );
}
