import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
createRoot(container).render(<App />)

