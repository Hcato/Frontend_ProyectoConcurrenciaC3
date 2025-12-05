import React from 'react'

export default function Notification({ type = 'info', text = '' }) {
  return (
    <div className={`notification ${type}`} role="alert">
      {text}
    </div>
  )
}
