import React from 'react'
import AppContextProvider from './components/AppContextProvider'
import { Start } from './components/Start'

export default function App() {
  return (
    <AppContextProvider>
        <Start />
    </AppContextProvider>
  )
}

