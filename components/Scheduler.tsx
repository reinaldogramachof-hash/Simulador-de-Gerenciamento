import React, { useMemo, useState } from 'react'
import { Process } from '../types'

type Props = {
  processes: Process[]
  setProcesses: (p: Process[]) => void
  onDataChanged: () => void
  policy: 'Prioridade' | 'FCFS' | 'SJF' | 'RoundRobin'
  setPolicy: (p: 'Prioridade' | 'FCFS' | 'SJF' | 'RoundRobin') => void
  quantum: number
  setQuantum: (q: number) => void
}

const priorityOrder = { Alta: 0, Normal: 1, Baixa: 2 } as const
const priorityColor = { Alta: '#ef4444', Normal: '#2563eb', Baixa: '#16a34a' } as const

const Scheduler: React.FC<Props> = ({ processes, setProcesses, onDataChanged, policy, setPolicy, quantum, setQuantum }) => {
  const [timeline, setTimeline] = useState<{ pid: number; name: string; priority: Process['priority'] }[]>([])
  const [rrIndex, setRrIndex] = useState<number>(0)
  const [rrCounter, setRrCounter] = useState<number>(0)

  const queues = useMemo(() => {
    const byPriority: Record<Process['priority'], Process[]> = { Alta: [], Normal: [], Baixa: [] }
    for (const p of processes) if (p.status === 'Em Execução') byPriority[p.priority].push(p)
    for (const k of Object.keys(byPriority) as (keyof typeof byPriority)[]) byPriority[k].sort((a, b) => b.cpu - a.cpu)
    return byPriority
  }, [processes])

  function pickNext(): Process | null {
    if (policy === 'Prioridade') {
      for (const level of ['Alta', 'Normal', 'Baixa'] as Process['priority'][]) {
        if (queues[level].length) return queues[level][0]
      }
      return null
    }
    const ready = processes.filter(p => p.status === 'Em Execução')
    if (ready.length === 0) return null
    if (policy === 'FCFS') {
      const list = [...ready].sort((a, b) => a.pid - b.pid)
      return list[0] || null
    }
    if (policy === 'SJF') {
      const list = [...ready].sort((a, b) => a.cpu - b.cpu)
      return list[0] || null
    }
    const list = [...ready].sort((a, b) => a.pid - b.pid)
    const idx = list.length ? rrIndex % list.length : 0
    return list[idx] || null
  }

  function tick() {
    const next = pickNext()
    if (!next) return
    setTimeline(t => {
      const entry = { pid: next.pid, name: next.name, priority: next.priority }
      const updated = [...t, entry]
      return updated.slice(Math.max(0, updated.length - 24))
    })
  }

  function clearTimeline() {
    setTimeline([])
  }

  function simulateQuantum() {
    const next = pickNext()
    if (!next) return tick()
    const updated = processes.map(p => {
      if (p.pid === next.pid) return { ...p, cpu: Math.min(100, p.cpu + 0.2) }
      return { ...p, cpu: Math.max(0, p.cpu - 0.05) }
    })
    setProcesses(updated)
    onDataChanged()
    if (policy === 'RoundRobin') {
      if (rrCounter + 1 >= quantum) {
        setRrIndex(i => i + 1)
        setRrCounter(0)
      } else {
        setRrCounter(c => c + 1)
      }
    } else {
      setRrCounter(0)
    }
    tick()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Escalonador de Processos (Windows)</h2>
        <div className="flex items-center gap-2">
          <button onClick={simulateQuantum} className="px-3 py-1 rounded-md bg-blue-600 text-white">Executar Tick</button>
          <button onClick={clearTimeline} className="px-3 py-1 rounded-md bg-slate-700 text-white">Limpar Linha do Tempo</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">Política:</span>
          <select value={policy} onChange={e => setPolicy(e.target.value as any)} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option value="Prioridade">Prioridade</option>
            <option value="FCFS">FCFS</option>
            <option value="SJF">SJF</option>
            <option value="RoundRobin">Round Robin</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">Quantum:</span>
          <input type="number" min={1} value={quantum} onChange={e => setQuantum(Math.max(1, Number(e.target.value)))} disabled={policy !== 'RoundRobin'} className="px-2 py-1 rounded-md bg-slate-700 text-white w-20" />
        </div>
        {(['Alta','Normal','Baixa'] as Process['priority'][]).map(level => (
          <div key={`legend-${level}`} className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: priorityColor[level] }}>
            Prioridade {level}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['Alta','Normal','Baixa'] as Process['priority'][]).map(level => (
          <div key={level} className="p-3 rounded-lg bg-slate-700/50 border" style={{ borderColor: priorityColor[level] }}>
            <div className="mb-2">
              <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: priorityColor[level] }}>Fila {level}</span>
            </div>
            <div className="flex flex-col gap-2">
              {queues[level].length === 0 && <div className="text-sm text-slate-400">Sem processos</div>}
              {queues[level].map(p => (
                <div key={p.pid} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: priorityColor[level] }} />
                    <span className="text-sm text-white">{p.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">CPU {p.cpu}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
        <div className="text-sm text-slate-300 mb-2">Linha do Tempo (últimos 24 agendamentos)</div>
        <div className="flex flex-wrap gap-2">
          {timeline.length === 0 && <div className="text-sm text-slate-400">Nenhum evento ainda</div>}
          {timeline.map((e, i) => (
            <div
              key={`${e.pid}-${i}`}
              className="px-2 py-1 rounded-md text-xs font-semibold border"
              style={{ backgroundColor: priorityColor[e.priority], color: '#fff', borderColor: '#ffffff22' }}
            >
              {e.name} • PID {e.pid}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Scheduler