import Card from '@/components/Card';

export default function Stream() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Diskusi Komunitas</h2>
      <Card>
        <textarea placeholder="Bagikan ide analisismu hari ini..." className="w-full bg-[#111a2e] border border-[#162035] rounded-lg p-3 text-sm" rows={3} />
        <div className="flex justify-end mt-3"><button className="bg-[#00c2ff] text-[#05070d] px-4 py-2 rounded-lg font-bold">POST</button></div>
      </Card>

      <Card>
        <h3 className="font-bold text-base text-white">Grup VIP Premium Chat</h3>
        <p className="text-xs text-gray-400 mt-2">Dapatkan sinyal harian eksklusif, analisis chart komprehensif, dan trading plan tanpa batas.</p>
        <div className="mt-3"><button className="bg-[#00c2ff] text-[#05070d] px-4 py-2 rounded-lg font-bold">Daftar Sekarang</button></div>
      </Card>
    </div>
  );
}
