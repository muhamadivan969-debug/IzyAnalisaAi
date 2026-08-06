import Card from '@/components/Card';

export default function Profile() {
  return (
    <div className="space-y-4">
      <div className="bg-[#0a0e1a] p-5 rounded-xl border border-[#162035] flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-lg text-white">👤</div>
        <div>
          <h3 className="font-bold text-base">Trader IzyAnalisaAI</h3>
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1">Akun Gratis</span>
        </div>
      </div>

      <div className="bg-[#0a0e1a] rounded-xl border border-[#162035] overflow-hidden divide-y divide-[#162035]">
        <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm">Upgrade Premium</span><span className="text-gray-500">›</span></div>
        <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm">Pengaturan</span><span className="text-gray-500">›</span></div>
        <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm">Bantuan & FAQ</span><span className="text-gray-500">›</span></div>
        <div className="p-4 flex justify-between items-center hover:bg-[#111a2e] cursor-pointer"><span className="text-sm text-[#ff4d5a]">Log Out</span></div>
      </div>
    </div>
  );
}
