import React from 'react'
import ApiTester from './components/ApiTester'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Gestión Académica</h1>
        <p>Proyecto Concurrencia con Moodle</p>
      </header>

      <main>
        <ApiTester />
      </main>

      <footer>
        <small>Desarrollado para pruebas — usa <code>http://localhost:8080</code> como backend</small>
        <p>Desarrollado por Fabricio,Ameth,Joaquin,Milton y Cato</p>
      </footer>
    </div>
  )
}
