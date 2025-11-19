
export interface Process {
  pid: number;
  name: string;
  cpu: number;
  originalCpu?: number; // Store CPU usage before suspension
  memory: number; // in MB
  status: 'Em Execução' | 'Suspenso';
  priority: 'Alta' | 'Normal' | 'Baixa';
  programCounter: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'app' | 'folder' | 'temp' | 'log' | 'system';
  size: number; // in KB
  modified: string;
}

export type Tab = 'processes' | 'memory' | 'files' | 'scheduler' | 'learning';

export type AppMode = 'laboratory' | 'learning';