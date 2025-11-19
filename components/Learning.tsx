import React, { useEffect, useMemo, useState } from 'react'
import { Tab, AppMode, Process, FileItem } from '../types'

type Props = { onNavigate: (tab: Tab) => void; mode: AppMode; setMode: (m: AppMode) => void; processes: Process[]; policy: 'Prioridade' | 'FCFS' | 'SJF' | 'RoundRobin'; quantum: number }

const api = 'http://localhost:3001'

const Learning: React.FC<Props> = ({ onNavigate, mode, setMode, processes, policy, quantum }) => {
  const [summary, setSummary] = useState<{ totalMemory: number; usedMemory: number; freeMemory: number } | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])

  async function fetchSummary() {
    const res = await fetch(`${api}/api/memory/summary`)
    const data = await res.json()
    setSummary(data)
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

  const runningCount = useMemo(() => processes.filter(p => p.status === 'Em Execução').length, [processes])
  const suspendedCount = useMemo(() => processes.filter(p => p.status === 'Suspenso').length, [processes])
  const totalCount = processes.length
  const byPriority = useMemo(() => {
    const acc: Record<Process['priority'], number> = { Alta: 0, Normal: 0, Baixa: 0 }
    for (const p of processes) acc[p.priority] += 1
    return acc
  }, [processes])
  const used = summary?.usedMemory ?? 0
  const totalMem = summary?.totalMemory ?? 0
  const percent = useMemo(() => summary ? Math.max(0, Math.min(100, Math.round((summary.usedMemory / summary.totalMemory) * 100))) : 0, [summary])
  const fileTypeCounts = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const f of files) acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, [files])
  const topNames = useMemo(() => processes.slice(0, 6).map(p => `${p.name} (${p.status})`), [processes])

  type TopicKey = 'processes' | 'memory' | 'files' | 'scheduler'
  const topics: { key: TopicKey; label: string }[] = [
    { key: 'processes', label: 'Processos' },
    { key: 'memory', label: 'Memória' },
    { key: 'files', label: 'Arquivos' },
    { key: 'scheduler', label: 'Escalonador' }
  ]
  const quizByTopic: Record<TopicKey, { question: string; options: string[]; answer: number }[]> = {
    processes: [
      { question: 'O que é um processo?', options: ['Um arquivo armazenado no disco', 'Um programa em execução com estado', 'Um thread dentro do kernel', 'Um pacote de rede'], answer: 1 },
      { question: 'Ao suspender um processo, o que ocorre com a CPU?', options: ['Aumenta', 'Zera e preserva valor para retomada', 'Continua igual', 'Diminui pela metade'], answer: 1 },
      { question: 'Quais são os estados principais nesta simulação?', options: ['Novo e Finalizado', 'Em Execução e Suspenso', 'Pronto e Bloqueado', 'Dormindo e Acordado'], answer: 1 },
      { question: 'Quais processos são críticos e não podem ser encerrados?', options: ['chrome.exe e spotify.exe', 'svchost.exe e explorer.exe', 'Ocioso do sistema e kernel', 'Todos podem ser encerrados'], answer: 2 },
      { question: 'O que indica a prioridade?', options: ['Uso de memória', 'Urgência relativa (Alta, Normal, Baixa)', 'PID', 'Tamanho do arquivo'], answer: 1 },
    ],
    memory: [
      { question: 'Onde aparece o percentual de memória usada?', options: ['Na linha do tempo', 'No donut e na barra', 'Apenas na aba Arquivos', 'Não aparece'], answer: 1 },
      { question: 'Limpar memória faz o quê nesta simulação?', options: ['Remove arquivos temporários', 'Reinicia o sistema', 'Remove processos de usuário pré-selecionados', 'Muda a política de escalonamento'], answer: 2 },
      { question: 'Total, usada e livre são atualizadas onde?', options: ['Apenas no Dashboard', 'Apenas na aba Memória', 'No Dashboard e na aba Memória', 'Somente por logs'], answer: 2 },
      { question: 'O que influencia principalmente o uso de memória?', options: ['Número de arquivos', 'Processos ativos', 'Política de escalonamento', 'Tamanho do disco'], answer: 1 },
      { question: 'Memória livre é calculada como:', options: ['Usada menos total', 'Total menos usada', 'Total mais usada', 'Total vezes usada'], answer: 1 },
    ],
    files: [
      { question: 'Quais tipos de arquivos existem?', options: ['app, folder, temp, log, system', 'bin, obj, tmp, sys', 'doc, xls, pdf, png', 'exe, dll, sys'], answer: 0 },
      { question: 'Arquivos de sistema podem ser excluídos?', options: ['Sim', 'Não', 'Apenas com confirmação', 'Apenas logs'], answer: 1 },
      { question: 'Limpar arquivos remove principalmente:', options: ['app e folder', 'temp e log', 'system e app', 'folder e system'], answer: 1 },
      { question: 'Os contadores por tipo mostram:', options: ['Tamanho total em MB', 'Quantidade por tipo', 'PID por arquivo', 'Prioridade por arquivo'], answer: 1 },
      { question: 'Ordenar e filtrar permite:', options: ['Explorar o impacto por tipo e tamanho', 'Mudar a política de CPU', 'Suspender processos', 'Alterar o quantum'], answer: 0 },
    ],
    scheduler: [
      { question: 'Quais políticas estão disponíveis?', options: ['Prioridade, FCFS, SJF e Round Robin', 'FIFO e LIFO', 'RR e EDF', 'SJF apenas'], answer: 0 },
      { question: 'Round Robin alterna processos por:', options: ['PID', 'Tamanho do arquivo', 'Quantum', 'Uso de memória'], answer: 2 },
      { question: 'A política de Prioridade seleciona na ordem:', options: ['Baixa, Normal, Alta', 'Alta, Normal, Baixa', 'Normal, Baixa, Alta', 'Aleatória'], answer: 1 },
      { question: 'FCFS e SJF ordenam por:', options: ['PID ou menor CPU nesta simulação', 'Prioridade', 'Tamanho de arquivo', 'Uso de memória'], answer: 0 },
      { question: 'A linha do tempo mostra:', options: ['Logs de arquivos', 'Últimos agendamentos com cor por prioridade', 'Dados de rede', 'Memória livre'], answer: 1 },
    ],
  }
  const [topic, setTopic] = useState<TopicKey>('processes')
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [qScoreMap, setQScoreMap] = useState<Record<TopicKey, number>>({ processes: 0, memory: 0, files: 0, scheduler: 0 })
  const [finishedMap, setFinishedMap] = useState<Record<TopicKey, boolean>>({ processes: false, memory: false, files: false, scheduler: false })


  function selectOption(i: number) {
    if (selected !== null || finishedMap[topic]) return
    setSelected(i)
    const q = quizByTopic[topic][qIndex]
    if (i === q.answer) setQScoreMap(s => ({ ...s, [topic]: s[topic] + 1 }))
  }
  function nextQuestion() {
    if (finishedMap[topic]) return
    const total = quizByTopic[topic].length
    if (qIndex + 1 < total) {
      setQIndex(qIndex + 1)
      setSelected(null)
    } else {
      setFinishedMap(s => ({ ...s, [topic]: true }))
    }
  }
  function restartQuiz() {
    setQIndex(0)
    setSelected(null)
    setQScoreMap(s => ({ ...s, [topic]: 0 }))
    setFinishedMap(s => ({ ...s, [topic]: false }))
  }
  function changeTopic(t: TopicKey) {
    setTopic(t)
    setQIndex(0)
    setSelected(null)
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Aprendizado</h2>
        <div className="flex items-center bg-slate-850 border border-slate-700 rounded-lg p-1">
          <button 
            onClick={() => setMode('laboratory')}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'laboratory' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >Laboratório</button>
          <button 
            onClick={() => setMode('learning')}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'learning' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >Aprendizado</button>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">Visão Geral</div>
          <div className="mt-2 text-base text-slate-300">Este simulador apresenta conceitos de Sistemas Operacionais com foco em processos, memória, arquivos e escalonamento. Use os cartões abaixo para navegar e realizar experimentos guiados.</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => onNavigate('processes')} className="px-2 py-1 rounded-md bg-slate-700 text-white">Ir para Processos</button>
            <button onClick={() => onNavigate('memory')} className="px-2 py-1 rounded-md bg-slate-700 text-white">Ir para Memória</button>
            <button onClick={() => onNavigate('files')} className="px-2 py-1 rounded-md bg-slate-700 text-white">Ir para Arquivos</button>
            <button onClick={() => onNavigate('scheduler')} className="px-2 py-1 rounded-md bg-slate-700 text-white">Ir para Escalonador</button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">Como usar</div>
          <ul className="mt-2 text-base text-slate-300 space-y-2">
            <li>Escolha o modo no topo: Laboratório foca em ações; Aprendizado reforça conceitos.</li>
            <li>Os indicadores do Dashboard mostram memória usada, CPU total e arquivos por tipo.</li>
            <li>As abas detalham cada tema com ações seguras e feedback imediato.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="text-sm md:text-base text-slate-400">Caixas de legenda</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="text-sm md:text-base text-slate-400">Processos</div>
            <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{totalCount}</div>
            <div className="mt-1 text-base leading-relaxed text-slate-300">Em Execução: {runningCount} • Suspensos: {suspendedCount}</div>
            <div className="mt-2 text-sm text-slate-400">Alta {byPriority.Alta} • Normal {byPriority.Normal} • Baixa {byPriority.Baixa}</div>
            <div className="mt-3 text-sm text-slate-300">Temos {totalCount} processos em aberto, por exemplo: {topNames.join(', ')}.</div>
          </div>
          <div className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="text-sm md:text-base text-slate-400">Memória</div>
            <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{percent}%</div>
            <div className="mt-1 text-base leading-relaxed text-slate-300">Usada: {used} MB • Total: {totalMem} MB</div>
            <div className="mt-3 h-2 w-full bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-2 text-sm text-slate-300">Este percentual reflete os processos ativos e é atualizado pela API.</div>
          </div>
          <div className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="text-sm md:text-base text-slate-400">Arquivos</div>
            <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{files.length}</div>
            <div className="mt-1 text-base leading-relaxed text-slate-300">Tipos: {Object.entries(fileTypeCounts).map(([t,c]) => `${t} ${c}`).join(' • ') || '—'}</div>
            <div className="mt-2 text-sm text-slate-300">Remoções seguras: limpeza remove temp e logs; sistema é protegido.</div>
          </div>
          <div className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="text-sm md:text-base text-slate-400">Política de Escalonamento</div>
            <div className="mt-1 text-3xl md:text-4xl leading-tight md:leading-snug font-bold text-white">{policy}</div>
            <div className="mt-1 text-base leading-relaxed text-slate-300">Quantum: {policy === 'RoundRobin' ? quantum : '—'}</div>
            <div className="mt-2 text-sm text-slate-300">A seleção de processos varia por política. Round Robin alterna por quantum.</div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">Gerenciamento de Processos</div>
          <ul className="mt-2 text-base text-slate-300 space-y-2">
            <li>Processo é um programa em execução, com uso de CPU, memória e estado.</li>
            <li>Estados principais: Em Execução e Suspenso. Suspender zera a CPU e preserva o valor original para retomada.</li>
            <li>Prioridade indica urgência relativa: Alta, Normal, Baixa.</li>
            <li>Processos críticos não podem ser encerrados: ocioso do sistema e kernel.</li>
          </ul>
          <div className="mt-3 text-sm text-slate-400">Experimente</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => onNavigate('processes')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Suspender e Retomar processos</button>
            <button onClick={() => onNavigate('processes')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Selecionar por estado e Encerrar selecionados</button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">Memória</div>
          <ul className="mt-2 text-base text-slate-300 space-y-2">
            <li>Memória total, usada e livre são atualizadas em tempo real no Dashboard e na aba Memória.</li>
            <li>O percentual usado aparece no donut e na barra de progresso.</li>
            <li>Limpar memória remove processos de usuário pré-selecionados, reduzindo o uso.</li>
          </ul>
          <div className="mt-3 text-sm text-slate-400">Experimente</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => onNavigate('memory')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Atualizar e Limpar memória</button>
            <button onClick={() => onNavigate('processes')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Criar processos e observar o percentual</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">Arquivos</div>
          <ul className="mt-2 text-base text-slate-300 space-y-2">
            <li>Tipos: app, folder, temp, log, system. Arquivos de sistema não podem ser excluídos.</li>
            <li>Limpar remove arquivos temporários e logs, com confirmação para segurança.</li>
            <li>Ordene e filtre para explorar o impacto por tipo e tamanho.</li>
          </ul>
          <div className="mt-3 text-sm text-slate-400">Experimente</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => onNavigate('files')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Limpar arquivos inúteis</button>
            <button onClick={() => onNavigate('files')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Excluir item não crítico</button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-sm md:text-base text-slate-400">Escalonamento</div>
          <ul className="mt-2 text-base text-slate-300 space-y-2">
            <li>Políticas: Prioridade, FCFS, SJF e Round Robin.</li>
            <li>Prioridade escolhe primeiro Alta, depois Normal, depois Baixa.</li>
            <li>FCFS e SJF ordenam por PID ou menor CPU (nesta simulação); Round Robin alterna por quantum.</li>
            <li>A linha do tempo mostra os últimos agendamentos com cor por prioridade.</li>
          </ul>
          <div className="mt-3 text-sm text-slate-400">Experimente</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => onNavigate('scheduler')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Trocar política e ajustar quantum</button>
            <button onClick={() => onNavigate('scheduler')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Executar ticks e observar a linha do tempo</button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
        <div className="text-sm md:text-base text-slate-400">Atividades Guiadas</div>
        <ol className="mt-2 text-base text-slate-300 space-y-2 list-decimal pl-5">
          <li>Crie processos, suspenda e retome. Compare CPU total no Dashboard.</li>
          <li>Limpe memória e verifique o efeito no donut e na barra.</li>
          <li>Remova arquivos temporários e observe os contadores por tipo.</li>
          <li>Teste políticas de escalonamento e explique a diferença de seleção.</li>
          <li>Discuta por que processos críticos são protegidos e como isso garante estabilidade.</li>
        </ol>
      </div>

      <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="text-sm md:text-base text-slate-400">Quiz de Aprendizado</div>
          <div className="text-sm text-slate-400">{finishedMap[topic] ? `Pontuação: ${qScoreMap[topic]}/${quizByTopic[topic].length}` : `Pergunta ${qIndex + 1} de ${quizByTopic[topic].length}`}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map(t => (
            <button key={t.key} onClick={() => changeTopic(t.key)} className={`px-2 py-1 rounded-md border ${topic === t.key ? 'bg-slate-700 text-white border-blue-500' : 'bg-slate-750 text-slate-200 border-slate-600'}`}>{t.label}</button>
          ))}
        </div>
        {!finishedMap[topic] && (
          <div className="mt-3">
            <div className="text-base md:text-lg text-white font-semibold">{quizByTopic[topic][qIndex].question}</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {quizByTopic[topic][qIndex].options.map((opt, i) => {
                const isSelected = selected === i
                const isCorrect = i === quizByTopic[topic][qIndex].answer
                const base = 'w-full text-left px-3 py-2 rounded-md border'
                const idle = 'bg-slate-700 text-white border-slate-700 hover:bg-slate-800'
                const correct = 'bg-green-600 text-white border-slate-700'
                const wrong = 'bg-red-600 text-white border-slate-700'
                const reveal = selected !== null && !isSelected && isCorrect ? 'bg-slate-700 text-white border-slate-700' : ''
                const cls = isSelected ? (isCorrect ? correct : wrong) : (selected !== null ? reveal : idle)
                return (
                  <button key={i} onClick={() => selectOption(i)} disabled={selected !== null} className={`${base} ${cls}`}>{opt}</button>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={nextQuestion} disabled={selected === null} className={`px-3 py-1 rounded-md ${selected === null ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 text-white'}`}>{qIndex + 1 < quizByTopic[topic].length ? 'Próxima' : 'Finalizar'}</button>
              <button onClick={restartQuiz} className="px-3 py-1 rounded-md bg-slate-700 text-white">Recomeçar</button>
            </div>
          </div>
        )}
        {finishedMap[topic] && (
          <div className="mt-3">
            <div className="text-base md:text-lg text-white font-semibold">Resultados</div>
            <div className="mt-2 text-slate-300">Você acertou {qScoreMap[topic]} de {quizByTopic[topic].length}.</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <button onClick={() => onNavigate('processes')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Rever Processos</button>
              <button onClick={() => onNavigate('memory')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Rever Memória</button>
              <button onClick={() => onNavigate('files')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Rever Arquivos</button>
              <button onClick={() => onNavigate('scheduler')} className="px-2 py-1 rounded-md bg-blue-600 text-white">Rever Escalonador</button>
            </div>
            <div className="mt-4">
              <button onClick={restartQuiz} className="px-3 py-1 rounded-md bg-slate-700 text-white">Refazer quiz</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Learning