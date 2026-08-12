import { Wrench } from 'lucide-react'

export default function PlaceholderPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto text-center py-24">
      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Wrench size={48} className="text-gray-400" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Fitur Sedang Dibangun</h1>
      <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
        Halaman ini masih dalam tahap pengerjaan (Fase Pengembangan). 
        Silakan cek kembali pada update berikutnya!
      </p>
    </div>
  )
}
