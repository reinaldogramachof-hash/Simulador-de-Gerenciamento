import React from 'react'

export const ProcessorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className || ''}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" strokeWidth="2" />
    <rect x="8" y="8" width="8" height="8" rx="1" ry="1" strokeWidth="2" />
    <path d="M4 2v4 M20 2v4 M4 18v4 M20 18v4 M2 4h4 M2 20h4 M18 4h4 M18 20h4" strokeWidth="2" />
  </svg>
)

export const MemoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className || ''}>
    <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth="2" />
    <path d="M7 7v-3 M12 7v-3 M17 7v-3 M7 17v3 M12 17v3 M17 17v3" strokeWidth="2" />
  </svg>
)

export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className || ''}>
    <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeWidth="2" />
  </svg>
)

export const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className || ''}>
    <path d="M6 3h12M9 3v5l-4 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-4-9V3" strokeWidth="2" />
  </svg>
)

export const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className || ''}>
    <path d="M12 4v16 M21 4a6 6 0 0 0-6 3.5V20a6 6 0 0 1 6-3.5 M3 4a6 6 0 0 1 6 3.5V20A6 6 0 0 0 3 16.5" strokeWidth="2" />
  </svg>
)

export const SchedulerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className || ''}>
    <circle cx="6" cy="6" r="2" strokeWidth="2" />
    <circle cx="18" cy="12" r="2" strokeWidth="2" />
    <circle cx="6" cy="18" r="2" strokeWidth="2" />
    <path d="M8 6h8 M6 8v8 M8 18h8" strokeWidth="2" />
  </svg>
)