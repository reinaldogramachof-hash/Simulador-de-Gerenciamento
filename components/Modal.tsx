import React from 'react'

type ModalProps = { open: boolean; title: string; description?: string; confirmText?: string; cancelText?: string; onConfirm: () => void; onCancel: () => void }

const Modal: React.FC<ModalProps> = ({ open, title, description, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-slate-800 border border-slate-600 p-4">
          <div className="text-lg font-semibold text-white">{title}</div>
          {description && <div className="mt-2 text-sm text-slate-300">{description}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="px-3 py-1 rounded-md bg-slate-700 text-white">{cancelText}</button>
            <button onClick={onConfirm} className="px-3 py-1 rounded-md bg-red-600 text-white">{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal