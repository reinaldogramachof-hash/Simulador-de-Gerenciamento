import React from 'react'

type ToastProps = { message: string; type?: 'success' | 'error'; onClose: () => void }

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => (
  <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
    </div>
  </div>
)

export default Toast