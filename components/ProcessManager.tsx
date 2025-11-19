import React, { useEffect, useMemo, useState } from 'react'
import { Process, AppMode } from '../types'
import Toast from './Toast'
import Modal from './Modal'

type Props = {
  processes: Process[]
  setProcesses: (p: Process[]) => void
  mode: AppMode
  setMode: (m: AppMode) => void
  onDataChanged: () => void
}

const api = 'http://localhost:3001'

const CRITICAL = new Set(['Processo Ocioso do Sistema', 'kernel_task'])

const ProcessManager: React.FC<Props> = ({ processes, setProcesses, onDataChanged }) => {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [confirmKill, setConfirmKill] = useState<{ pid: number; name: string } | null>(null)
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu')
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Em Execução' | 'Suspenso'>('Todos')
  const [filterText, setFilterText] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [confirmBulkKill, setConfirmBulkKill] = useState(false)

  async function fetchProcesses() {
    setLoading(true)
    try {
      const res = await fetch(`${api}/api/processes`)
      const data = await res.json()
      setProcesses(data)
      setToast({ message: 'Processos atualizados', type: 'success' })
    } finally {
      setLoading(false)
      onDataChanged()
    }
  }

  useEffect(() => {
    fetchProcesses()
  }, [])

  async function simulate() {
    const res = await fetch(`${api}/api/processes/simulate`, { method: 'POST' })
    if (res.ok) setToast({ message: 'Simulação iniciada', type: 'success' })
    setTimeout(() => {
      fetchProcesses()
    }, 2800)
  }

  async function toggle(pid: number, status: 'Suspenso' | 'Em Execução') {
    await fetch(`${api}/api/processes/${pid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    fetchProcesses()
  }

  async function kill(pid: number) {
    const target = processes.find(p => p.pid === pid)
    if (target && CRITICAL.has(target.name)) {
      setToast({ message: 'Processo crítico não pode ser encerrado', type: 'error' })
      return
    }
    const res = await fetch(`${api}/api/processes/${pid}`, { method: 'DELETE' })
    if (res.status === 204) setToast({ message: 'Processo encerrado', type: 'success' })
    else setToast({ message: 'Falha ao encerrar processo', type: 'error' })
    fetchProcesses()
  }

  function toggleSelect(pid: number) {
    const target = processes.find(p => p.pid === pid)
    if (target && CRITICAL.has(target.name)) return
    setSelected(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid])
  }

  function selectByStatus(kind: 'Todos' | 'Em Execução' | 'Suspenso' | 'Nenhum') {
    if (kind === 'Nenhum') {
      setSelected([])
      return
    }
    const ids = processes.filter(p => (kind === 'Todos' ? true : p.status === kind) && !CRITICAL.has(p.name)).map(p => p.pid)
    setSelected(ids)
  }

  async function bulkSuspend() {
    if (!selected.length) return
    const targets = processes.filter(p => selected.includes(p.pid) && p.status === 'Em Execução')
    await Promise.all(targets.map(p => fetch(`${api}/api/processes/${p.pid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Suspenso' })
    })))
    setToast({ message: 'Processos suspensos', type: 'success' })
    setSelected([])
    fetchProcesses()
  }

  async function bulkResume() {
    if (!selected.length) return
    const targets = processes.filter(p => selected.includes(p.pid) && p.status === 'Suspenso')
    await Promise.all(targets.map(p => fetch(`${api}/api/processes/${p.pid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Em Execução' })
    })))
    setToast({ message: 'Processos retomados', type: 'success' })
    setSelected([])
    fetchProcesses()
  }

  async function bulkKill() {
    if (!selected.length) return
    const targets = processes.filter(p => selected.includes(p.pid) && !CRITICAL.has(p.name))
    if (!targets.length) {
      setToast({ message: 'Nenhum processo elegível para encerramento', type: 'error' })
      return
    }
    await Promise.all(targets.map(p => fetch(`${api}/api/processes/${p.pid}`, { method: 'DELETE' })))
    setToast({ message: 'Processos encerrados', type: 'success' })
    setSelected([])
    fetchProcesses()
  }

  const displayed = useMemo(() => {
    let list = [...processes]
    if (filterStatus !== 'Todos') list = list.filter(p => p.status === filterStatus)
    if (filterText) list = list.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()))
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'cpu') return b.cpu - a.cpu
      return b.memory - a.memory
    })
    return list
  }, [processes, sortBy, filterStatus, filterText])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gerenciador de Processos</h2>
        <div className="flex gap-2">
          <button onClick={fetchProcesses} className="px-3 py-1 rounded-md bg-slate-700 text-white">Atualizar</button>
          <button onClick={simulate} className="px-3 py-1 rounded-md bg-blue-600 text-white">Simular</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Ordenar:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option value="cpu">CPU</option>
            <option value="memory">Memória</option>
            <option value="name">Nome</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Status:</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option>Todos</option>
            <option>Em Execução</option>
            <option>Suspenso</option>
          </select>
        </div>
        <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Filtrar por nome" className="px-2 py-1 rounded-md bg-slate-700 text-white flex-grow" />
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">Selecionar:</label>
          <select onChange={e => selectByStatus(e.target.value as any)} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option value="Nenhum">Nenhum</option>
            <option value="Todos">Todos</option>
            <option value="Em Execução">Em Execução</option>
            <option value="Suspenso">Suspenso</option>
          </select>
        </div>
        <div className="text-sm text-slate-400">Selecionados: {selected.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={bulkSuspend} disabled={!selected.length} className={`px-3 py-1 rounded-md ${selected.length ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Suspender</button>
          <button onClick={bulkResume} disabled={!selected.length} className={`px-3 py-1 rounded-md ${selected.length ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Retomar</button>
          <button onClick={() => setConfirmBulkKill(true)} disabled={!selected.length} className={`px-3 py-1 rounded-md ${selected.length ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Encerrar selecionados</button>
        </div>
      </div>
      {loading && <div className="text-slate-300 text-base">Carregando…</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayed.map(p => (
          <div key={p.pid} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(p.pid)} onChange={() => toggleSelect(p.pid)} className="h-4 w-4" disabled={CRITICAL.has(p.name)} />
                <div className="font-semibold text-white">{p.name}</div>
              </div>
              <div className="text-xs text-slate-400">PID {p.pid}</div>
            </div>
            <div className="mt-2 text-base text-slate-300">CPU {p.cpu}% • Mem {p.memory}MB • {p.status} • {p.priority}</div>
            <div className="mt-2 text-sm text-slate-400">PC {p.programCounter}</div>
            <div className="mt-3 flex gap-2">
              {p.status === 'Em Execução' ? (
                <button onClick={() => toggle(p.pid, 'Suspenso')} className="px-2 py-1 rounded-md bg-yellow-600 text-white">Suspender</button>
              ) : (
                <button onClick={() => toggle(p.pid, 'Em Execução')} className="px-2 py-1 rounded-md bg-green-600 text-white">Retomar</button>
              )}
              <button onClick={() => !CRITICAL.has(p.name) ? setConfirmKill({ pid: p.pid, name: p.name }) : null} className={`px-2 py-1 rounded-md ${CRITICAL.has(p.name) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-red-600 text-white'}`}>Encerrar</button>
            </div>
          </div>
        ))}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Modal
        open={!!confirmKill}
        title="Confirmar encerramento"
        description={confirmKill ? `Encerrar ${confirmKill.name} (PID ${confirmKill.pid})` : ''}
        confirmText="Encerrar"
        onCancel={() => setConfirmKill(null)}
        onConfirm={() => {
          if (confirmKill) kill(confirmKill.pid)
          setConfirmKill(null)
        }}
      />
      <Modal
        open={confirmBulkKill}
        title="Confirmar encerramento em massa"
        description={`Encerrar ${selected.length} processos selecionados`}
        confirmText="Encerrar"
        onCancel={() => setConfirmBulkKill(false)}
        onConfirm={() => {
          setConfirmBulkKill(false)
          bulkKill()
        }}
      />
    </div>
  )
}

export default ProcessManager