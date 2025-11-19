import React, { useEffect, useMemo, useState } from 'react'
import { AppMode, FileItem } from '../types'
import Toast from './Toast'
import Modal from './Modal'

type Props = {
  mode: AppMode
  setMode: (m: AppMode) => void
}

const api = 'http://localhost:3001'

const FileManager: React.FC<Props> = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'type'>('name')
  const [filterType, setFilterType] = useState<'todos' | FileItem['type']>('todos')
  const [confirmClean, setConfirmClean] = useState(false)

  async function fetchFiles() {
    const res = await fetch(`${api}/api/files`)
    const data = await res.json()
    setFiles(data)
  }

  async function clean() {
    const res = await fetch(`${api}/api/files/clean`, { method: 'POST' })
    const data = await res.json()
    setFiles(data)
    setToast({ message: 'Arquivos inúteis removidos', type: 'success' })
  }

  async function remove(id: string) {
    const res = await fetch(`${api}/api/files/${id}`, { method: 'DELETE' })
    if (res.status === 204) {
      setToast({ message: 'Arquivo excluído', type: 'success' })
      fetchFiles()
    } else if (res.status === 403) {
      setToast({ message: 'Proibido excluir arquivo de sistema', type: 'error' })
    } else {
      setToast({ message: 'Falha ao excluir arquivo', type: 'error' })
    }
  }

  const displayed = useMemo(() => {
    let list = [...files]
    if (filterType !== 'todos') list = list.filter(f => f.type === filterType)
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'type') return a.type.localeCompare(b.type)
      return b.size - a.size
    })
    return list
  }, [files, sortBy, filterType])

  const typeCounts = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const f of files) acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, [files])

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gerenciador de Arquivos</h2>
        <div className="flex gap-2">
          <button onClick={fetchFiles} className="px-3 py-1 rounded-md bg-slate-700 text-white">Atualizar</button>
          <button onClick={() => setConfirmClean(true)} className="px-3 py-1 rounded-md bg-blue-600 text-white">Limpar</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-base text-slate-300">Ordenar:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option value="name">Nome</option>
            <option value="size">Tamanho</option>
            <option value="type">Tipo</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-base text-slate-300">Tipo:</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-2 py-1 rounded-md bg-slate-700 text-white">
            <option value="todos">Todos</option>
            <option value="app">app</option>
            <option value="folder">folder</option>
            <option value="temp">temp</option>
            <option value="log">log</option>
            <option value="system">system</option>
          </select>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(typeCounts).map(([type, count]) => (
          <div key={type} className="px-2 py-1 rounded-md bg-slate-700 text-white text-xs">{type}: {count}</div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayed.map(f => (
          <div key={f.id} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white text-lg">{f.name}</div>
              <div className="text-sm text-slate-400">{f.type}</div>
            </div>
            <div className="mt-2 text-base text-slate-300">Tam {f.size} • Mod {f.modified}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setConfirmDelete(f)} className="px-2 py-1 rounded-md bg-red-600 text-white">Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Modal
        open={!!confirmDelete}
        title="Confirmar exclusão"
        description={confirmDelete ? `Excluir ${confirmDelete.name} (${confirmDelete.type})` : ''}
        confirmText="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) remove(confirmDelete.id)
          setConfirmDelete(null)
        }}
      />
      <Modal
        open={confirmClean}
        title="Confirmar limpeza"
        description="Remover arquivos inúteis"
        confirmText="Limpar"
        onCancel={() => setConfirmClean(false)}
        onConfirm={() => {
          setConfirmClean(false)
          clean()
        }}
      />
    </div>
  )
}

export default FileManager