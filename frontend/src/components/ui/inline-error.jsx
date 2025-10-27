import React from 'react'

export default function InlineError({ message, onRetry }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-start justify-between gap-4">
      <div className="text-sm">{message}</div>
      {onRetry ? (
        <button onClick={onRetry} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Yeniden Dene</button>
      ) : null}
    </div>
  )
}
import React from 'react'

export default function InlineError({ message, onRetry }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-start justify-between gap-4">
      <div className="text-sm">{message}</div>
      {onRetry ? (
        <button onClick={onRetry} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Yeniden Dene</button>
      ) : null}
    </div>
  )
}
