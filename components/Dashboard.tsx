import React, { useEffect, useMemo, useState } from 'react'
import { Process, FileItem, Tab } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Tooltip, Legend } from 'recharts'

type Props = { processes: Process[]; onNavigate: (tab: Tab) => void; refreshTick?: number }

const api = 'http://localhost:3001'

const Dashboard: React.FC<Props> = ({ processes, onNavigate, refreshTick }) => {
  const [summary, setSummary] = useState<{ totalMemory: number; usedMemory: number; freeMemory: number } | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(0)
  const [memoryHistory, setMemoryHistory] = useState<{ t: number; used: number }[]>([])

  async function fetchSummary() {
    const res = await fetch(`${api}/api/memory/summary`)
    const data = await res.json()
    setSummary(data)
    const now = Date.now()
    setMemoryHistory(prev => {
      const next = [...prev, { t: now, used: data.usedMemory }]
      return next.slice(Math.max(0, next.length - 20))
    })
  }

  async function fetchFiles() {
    const res = await fetch(`${api}/api/files`)
    const data = await res.json()
    setFiles(data)
  }

  useEffect(() => {
    fetchSummary()
    fetchFiles()
  }, [])

  useEffect(() => {
    if (refreshTick === undefined) return
    fetchSummary()
    fetchFiles()
  }, [refreshTick])

  useEffect(() => {
    if (!refreshIntervalSec) return
    const id = setInterval(() => {
      fetchSummary()
      fetchFiles()
    }, refreshIntervalSec * 1000)
    return () => clearInterval(id)
  }, [refreshIntervalSec])

  const runningCount = useMemo(() => processes.filter(p => p.status === 'Em Execução').length, [processes])
  const totalCount = processes.length
  const cpuTotal = useMemo(() => processes.reduce((sum, p) => sum + p.cpu, 0), [processes])
  const used = summary?.usedMemory ?? 0
  const free = summary?.freeMemory ?? 0
  const fileTypeCounts = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const f of files) acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, [files])

  const pieData = useMemo(() => [
    { name: 'Usada', value: used },
    { name: 'Livre', value: free },
  ], [used, free])

  const colors = ['#2563eb', '#16a34a']

  const delta = memoryHistory.length > 1 ? memoryHistory[memoryHistory.length - 1].used - memoryHistory[memoryHistory.length - 2].used : 0
  const trendColor = delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#2563eb'
  const lastUpdatedAgoSec = memoryHistory.length ? Math.max(0, Math.round((Date.now() - memoryHistory[memoryHistory.length - 1].t) / 1000)) : 0

  const renderLastDot = (props: any) => {
    const { cx, cy, index } = props
    if (index !== memoryHistory.length - 1) return null
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill={trendColor} />
        <circle cx={cx} cy={cy} r={10} className="animate-ping" fill={trendColor} fillOpacity={0.35} />
      </g>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 mb-6">
        <div className="flex flex-col gap-5 md:gap-6">
          <button onClick={() => onNavigate('processes')} className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors">
          <div className="text-sm md:text-base text-slate-400">Processos</div>
          <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{totalCount}</div>
          <div className="mt-1 text-base leading-relaxed text-slate-300">Em Execução: {runningCount}</div>
          </button>
          <button onClick={() => onNavigate('memory')} className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors">
          <div className="text-sm md:text-base text-slate-400">Memória</div>
          <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{used} / {summary?.totalMemory ?? 0} MB</div>
            <div className="mt-3 h-2 w-full bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${summary ? Math.round((used / summary.totalMemory) * 100) : 0}%` }} />
            </div>
          </button>
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">CPU Total</div>
          <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{cpuTotal.toFixed(1)}%</div>
          <div className="mt-1 text-base leading-relaxed text-slate-300">Média {totalCount ? (cpuTotal / totalCount).toFixed(1) : '0.0'}%</div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="text-sm md:text-base text-slate-400">Distribuição de Memória</div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{lastUpdatedAgoSec}s atrás</span>
          </div>
        </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={2} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
                <Legend payload={pieData.map((entry, index) => ({ value: entry.name, type: 'circle', id: entry.name, color: colors[index % colors.length] }))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="p-5 md:p-6 rounded-lg bg-slate-800 border border-slate-700">
        <div className="text-sm md:text-base text-slate-400">Arquivos por Tipo</div>
        <div className="mt-4 md:mt-6 flex flex-wrap gap-3">
          {Object.entries(fileTypeCounts).map(([type, count]) => (
            <div key={type} className="px-3 py-1 rounded-md bg-slate-700 text-white text-sm">{type}: {count}</div>
          ))}
        </div>
        <div className="mt-6 md:mt-8 flex items-center gap-3">
          <div className="text-sm text-slate-400">Atualização automática</div>
          <select value={refreshIntervalSec} onChange={e => setRefreshIntervalSec(Number(e.target.value))} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option value={0}>Desligada</option>
            <option value={5}>5s</option>
            <option value={15}>15s</option>
          </select>
        </div>
        <div className="mt-6 md:mt-8">
          <div className="text-sm text-slate-400 mb-2">Tendência de Memória</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={memoryHistory.map((d, i) => ({ i, used: d.used }))}>
                      <Line type="monotone" name="Memória Usada (MB)" dataKey="used" stroke={trendColor} strokeWidth={2} dot={renderLastDot} isAnimationActive animationDuration={500} animationEasing="ease-out" />
                      <Tooltip formatter={(v) => `${v} MB`} labelFormatter={(i) => `#${i}`} />
                      <Legend />
                    </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard