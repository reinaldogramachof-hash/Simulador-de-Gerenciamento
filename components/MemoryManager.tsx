import React, { useEffect, useMemo, useState } from 'react'
import { AppMode, Process } from '../types'
import Toast from './Toast'

type Props = {
  totalMemory: number
  usedMemory: number
  onClearMemory: () => void
  mode: AppMode
  setMode: (m: AppMode) => void
  processes: Process[]
  onDataChanged: () => void
}

const api = 'http://localhost:3001'

const MemoryManager: React.FC<Props> = ({ totalMemory, onDataChanged }) => {
  const [summary, setSummary] = useState<{ totalMemory: number; usedMemory: number; freeMemory: number } | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  async function fetchSummary() {
    const res = await fetch(`${api}/api/memory/summary`)
    const data = await res.json()
    setSummary(data)
    onDataChanged()
  }

  async function clear() {
    const res = await fetch(`${api}/api/memory/clear`, { method: 'POST' })
    if (res.ok) setToast({ message: 'Memória limpa', type: 'success' })
    fetchSummary()
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const used = summary?.usedMemory ?? 0
  const free = summary?.freeMemory ?? totalMemory - used
  const percent = useMemo(() => Math.max(0, Math.min(100, Math.round((used / totalMemory) * 100))), [used, totalMemory])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gerenciador de Memória</h2>
        <div className="flex gap-2">
          <button onClick={fetchSummary} className="px-3 py-1 rounded-md bg-slate-700 text-white">Atualizar</button>
          <button onClick={clear} className="px-3 py-1 rounded-md bg-blue-600 text-white">Limpar</button>
        </div>
      </div>
      <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
        <div className="text-base text-slate-300">Total: {totalMemory} MB</div>
        <div className="text-base text-slate-300">Usada: {used} MB</div>
        <div className="text-base text-slate-300">Livre: {free} MB</div>
        <div className="mt-3 h-3 w-full bg-slate-600 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 text-sm text-slate-300">{percent}% usado</div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default MemoryManager