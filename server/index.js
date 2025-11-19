import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const totalMemory = 16384

const processes = [
  { pid: 101, name: 'Processo Ocioso do Sistema', cpu: 98.5, originalCpu: null, memory: 8, status: 'Em Execução', priority: 'Baixa', programCounter: '0x00007FF68B17C340' },
  { pid: 504, name: 'svchost.exe', cpu: 0.1, originalCpu: null, memory: 128, status: 'Em Execução', priority: 'Normal', programCounter: '0x00007FF68B1E8A10' },
  { pid: 812, name: 'chrome.exe', cpu: 0.8, originalCpu: null, memory: 256, status: 'Em Execução', priority: 'Normal', programCounter: '0x00007FF68C45B220' },
  { pid: 940, name: 'explorer.exe', cpu: 0.2, originalCpu: null, memory: 150, status: 'Em Execução', priority: 'Alta', programCounter: '0x00007FF68B18D5F0' },
  { pid: 1230, name: 'Code.exe', cpu: 0.5, originalCpu: null, memory: 350, status: 'Em Execução', priority: 'Normal', programCounter: '0x00007FF68D01A1B0' },
  { pid: 1455, name: 'spotify.exe', cpu: 0.3, originalCpu: null, memory: 180, status: 'Suspenso', priority: 'Normal', programCounter: '0x00007FF68C88C940' },
  { pid: 1688, name: 'kernel_task', cpu: 0.1, originalCpu: null, memory: 64, status: 'Em Execução', priority: 'Alta', programCounter: '0x00007FF68B17A000' }
]

const files = [
  { id: '1', name: 'Windows', type: 'folder', size: 18000000, modified: '2023-10-26' },
  { id: '2', name: 'Arquivos de Programas', type: 'folder', size: 5400000, modified: '2023-10-27' },
  { id: '3', name: 'Usuários', type: 'folder', size: 12000000, modified: '2023-10-27' },
  { id: '4', name: 'boot.ini', type: 'system', size: 1, modified: '2023-01-15' },
  { id: '5', name: 'install.log', type: 'log', size: 512, modified: '2023-10-20' },
  { id: '6', name: 'chrome_installer.exe', type: 'app', size: 85000, modified: '2023-09-01' },
  { id: '7', name: 'temp_data.tmp', type: 'temp', size: 12000, modified: '2023-10-25' },
  { id: '8', name: 'relatorio.docx', type: 'app', size: 2300, modified: '2023-10-27' }
]

function randomPid() {
  return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
}

function randomName() {
  const names = ['chrome.exe', 'svchost.exe', 'render.exe', 'node.exe']
  return names[Math.floor(Math.random() * names.length)]
}

function randomCpu() {
  return Math.round((Math.random() * (5.0 - 0.1) + 0.1) * 10) / 10
}

function randomMemory() {
  return Math.floor(Math.random() * (450 - 50 + 1)) + 50
}

function randomStatus() {
  const statuses = ['Em Execução', 'Suspenso']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

function randomPriority() {
  const priorities = ['Alta', 'Normal', 'Baixa']
  return priorities[Math.floor(Math.random() * priorities.length)]
}

function randomProgramCounter() {
  const hex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()
  return `0x${hex}`
}

app.get('/api/processes', (req, res) => {
  res.status(200).json(processes)
})

app.post('/api/processes/simulate', (req, res) => {
  let created = 0
  function createOne() {
    const p = {
      pid: randomPid(),
      name: randomName(),
      cpu: randomCpu(),
      originalCpu: null,
      memory: randomMemory(),
      status: randomStatus(),
      priority: randomPriority(),
      programCounter: randomProgramCounter()
    }
    processes.push(p)
    created += 1
  }
  createOne()
  const interval = setInterval(() => {
    if (created >= 5) {
      clearInterval(interval)
      return
    }
    createOne()
  }, 700)
  res.status(202).json({ message: 'Simulação de processos iniciada.' })
})

app.patch('/api/processes/:pid', (req, res) => {
  const pid = Number(req.params.pid)
  const { status } = req.body || {}
  const idx = processes.findIndex(p => p.pid === pid)
  if (idx === -1) return res.status(404).json({ error: 'Processo não encontrado' })
  const proc = processes[idx]
  if (status === 'Suspenso') {
    proc.originalCpu = proc.cpu
    proc.cpu = 0
    proc.status = 'Suspenso'
  } else if (status === 'Em Execução') {
    if (proc.originalCpu !== null) {
      proc.cpu = proc.originalCpu
      proc.originalCpu = null
    }
    proc.status = 'Em Execução'
  } else {
    return res.status(400).json({ error: 'Status inválido' })
  }
  res.status(200).json(proc)
})

app.delete('/api/processes/:pid', (req, res) => {
  const pid = Number(req.params.pid)
  const idx = processes.findIndex(p => p.pid === pid)
  if (idx === -1) return res.status(404).json({ error: 'Processo não encontrado' })
  processes.splice(idx, 1)
  res.status(204).send()
})

app.get('/api/memory/summary', (req, res) => {
  const usedMemory = processes.reduce((sum, p) => sum + p.memory, 0)
  const freeMemory = totalMemory - usedMemory
  res.status(200).json({ totalMemory, usedMemory, freeMemory })
})

app.post('/api/memory/clear', (req, res) => {
  const toClear = new Set(['chrome.exe', 'spotify.exe', 'Code.exe'])
  for (let i = processes.length - 1; i >= 0; i--) {
    if (toClear.has(processes[i].name)) processes.splice(i, 1)
  }
  res.status(200).json(processes)
})

app.get('/api/files', (req, res) => {
  res.status(200).json(files)
})

app.post('/api/files/clean', (req, res) => {
  for (let i = files.length - 1; i >= 0; i--) {
    if (files[i].type === 'temp' || files[i].type === 'log') files.splice(i, 1)
  }
  res.status(200).json(files)
})

app.delete('/api/files/:id', (req, res) => {
  const id = String(req.params.id)
  const idx = files.findIndex(f => f.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Arquivo não encontrado' })
  if (files[idx].type === 'system') return res.status(403).json({ error: 'Proibido excluir arquivo de sistema' })
  files.splice(idx, 1)
  res.status(204).send()
})

const port = 3001
app.listen(port, () => {
  console.log(`Servidor em http://localhost:${port}/`)
})