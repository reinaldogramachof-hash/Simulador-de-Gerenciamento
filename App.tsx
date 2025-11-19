
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Process, Tab, AppMode } from './types';
import { ProcessorIcon, MemoryIcon, FolderIcon, BeakerIcon, BookOpenIcon, SchedulerIcon, BookIcon } from './components/Icons';
import ProcessManager from './components/ProcessManager';
import MemoryManager from './components/MemoryManager.tsx';

import FileManager from './components/FileManager';
import Dashboard from './components/Dashboard';
import Scheduler from './components/Scheduler';
import Learning from './components/Learning.tsx';

const INITIAL_PROCESSES: Process[] = [
  { pid: 101, name: 'Processo Ocioso do Sistema', cpu: 98.5, memory: 8, status: 'Em Execução', priority: 'Baixa', programCounter: '0x00007FF68B17C340' },
  { pid: 504, name: 'svchost.exe', cpu: 0.1, memory: 128, status: 'Em Execução', priority: 'Normal', programCounter: '0x00007FF68B1E8A10' },
  { pid: 812, name: 'chrome.exe', cpu: 0.8, memory: 256, status: 'Em Execução', priority: 'Normal', programCounter: '0x00007FF68C45B220' },
  { pid: 940, name: 'explorer.exe', cpu: 0.2, memory: 150, status: 'Em Execução', priority: 'Alta', programCounter: '0x00007FF68B18D5F0' },
  { pid: 1230, name: 'Code.exe', cpu: 0.5, memory: 350, status: 'Em Execução', priority: 'Normal', programCounter: '0x00007FF68D01A1B0' },
  { pid: 1455, name: 'spotify.exe', cpu: 0.3, memory: 180, status: 'Suspenso', priority: 'Normal', programCounter: '0x00007FF68C88C940' },
  { pid: 1688, name: 'kernel_task', cpu: 0.1, memory: 64, status: 'Em Execução', priority: 'Alta', programCounter: '0x00007FF68B17A000' },
];

const TOTAL_MEMORY_MB = 16384; // 16GB

export const PageHeader: React.FC<{ title: string; mode: AppMode; setMode: (mode: AppMode) => void; children?: React.ReactNode }> = ({ title, mode, setMode, children }) => (
  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
    <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
    <div className="flex items-center gap-4">
      <div className="flex-grow md:flex-grow-0">{children}</div>
      <div className="flex items-center bg-slate-850 border border-slate-700 rounded-lg p-1">
        <button 
          onClick={() => setMode('laboratory')}
          className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'laboratory' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <BeakerIcon />
          <span className="hidden sm:inline">Laboratório</span>
        </button>
        <button 
          onClick={() => setMode('learning')}
          className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'learning' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <BookOpenIcon />
          <span className="hidden sm:inline">Aprendizado</span>
        </button>
      </div>
    </div>
  </div>
);


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('processes');
  const [processes, setProcesses] = useState<Process[]>(INITIAL_PROCESSES);
  const [usedMemory, setUsedMemory] = useState(0);
  const [mode, setMode] = useState<AppMode>('laboratory');
  const [refreshTick, setRefreshTick] = useState(0);
  const [schedPolicy, setSchedPolicy] = useState<'Prioridade' | 'FCFS' | 'SJF' | 'RoundRobin'>('Prioridade');
  const [schedQuantum, setSchedQuantum] = useState<number>(3);
  const onDataChanged = useCallback(() => setRefreshTick(t => t + 1), []);

  useEffect(() => {
    const totalUsed = processes.reduce((acc, p) => acc + p.memory, 0);
    setUsedMemory(totalUsed);
  }, [processes]);

  const clearMemory = useCallback(() => {
    setProcesses(prev => prev.filter(p => !['chrome.exe', 'spotify.exe', 'Code.exe'].includes(p.name) || p.memory < 100));
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'processes':
        return <ProcessManager processes={processes} setProcesses={setProcesses} mode={mode} setMode={setMode} onDataChanged={onDataChanged} />;
      case 'memory':
        return <MemoryManager totalMemory={TOTAL_MEMORY_MB} usedMemory={usedMemory} onClearMemory={clearMemory} mode={mode} setMode={setMode} processes={processes} onDataChanged={onDataChanged} />;
      case 'files':
        return <FileManager mode={mode} setMode={setMode} />;
      case 'scheduler':
        return <Scheduler processes={processes} setProcesses={setProcesses} onDataChanged={onDataChanged} policy={schedPolicy} setPolicy={setSchedPolicy} quantum={schedQuantum} setQuantum={setSchedQuantum} />;
      case 'learning':
        return <Learning onNavigate={(tab) => setActiveTab(tab)} mode={mode} setMode={setMode} processes={processes} policy={schedPolicy} quantum={schedQuantum} />;
      default:
        return null;
    }
  };

  const NavItem: React.FC<{ tab: Tab; icon: React.ReactElement; label: string }> = ({ tab, icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col md:flex-row items-center justify-center md:justify-start text-center md:text-left space-y-1 md:space-y-0 md:space-x-3 w-full p-2.5 md:p-3 md:my-1 rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
      aria-current={activeTab === tab}
    >
      {React.cloneElement(icon, { className: `h-6 w-6 ${activeTab === tab ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}` })}
      <span className="font-medium text-sm md:text-lg">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="w-full min-h-screen bg-slate-800 flex flex-col md:flex-row overflow-hidden border border-slate-700">
        <aside className="w-full md:w-64 md:min-w-[256px] bg-slate-850/50 md:bg-slate-850 md:p-5 border-t md:border-t-0 md:border-r border-slate-700/50 flex flex-col order-last md:order-first">
          <h1 className="text-xl font-bold text-white mb-8 hidden md:block px-2">Otimizador de Sistema</h1>
          <nav className="flex md:flex-col justify-around md:justify-start flex-1">
            <NavItem tab="processes" icon={<ProcessorIcon />} label="Processos" />
            <NavItem tab="memory" icon={<MemoryIcon />} label="Memória" />
            <NavItem tab="files" icon={<FolderIcon />} label="Arquivos" />
            <NavItem tab="scheduler" icon={<SchedulerIcon />} label="Escalonador" />
            <NavItem tab="learning" icon={<BookIcon />} label="Aprendizado" />
          </nav>
          <div className="mt-auto md:mt-6 border-t border-slate-700 pt-4 px-3 text-slate-300">
            <div className="text-xs md:text-sm font-semibold text-white">Informações</div>
            <ul className="mt-2 text-xs md:text-sm list-disc pl-4 space-y-1">
              <li>Desenvolvido por: Reinaldo Gramacho, Nivaldo Nunes, Raíke Vinícius, Lucas Gabriel</li>
              <li>Matéria: Sistemas Operacionais</li>
              <li>Professor: Daniel Dos Santos</li>
            </ul>
          </div>
        </aside>
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto pb-24 md:pb-8 flex flex-col min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-grow flex flex-col"
            >
              <Dashboard processes={processes} onNavigate={(tab) => setActiveTab(tab)} refreshTick={refreshTick} />
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
