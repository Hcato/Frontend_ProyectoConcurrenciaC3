import React, { useState, useEffect } from 'react'
import Notification from './Notification'

const API_BASE = 'http://localhost:8080'


function prettyOutput(data) {
  if (!data) return "";

  // Si es lista
  if (Array.isArray(data)) {
    return data
      .map(item =>
        Object.entries(item)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      )
      .join("\n--------------------\n\n");
  }

  // Si es objeto con listas (por ejemplo: { total: X, programas: [...] })
  if (typeof data === "object") {
    let text = "";

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        text += `${key.toUpperCase()}: ${value.length}\n\n`;
        text += value
          .map(item =>
            Object.entries(item)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n")
          )
          .join("\n--------------------\n\n");
      } else {
        text += `${key}: ${value}\n`;
      }
    }

    return text;
  }

  return String(data);
}


async function request(endpoint, options = {}) {
  const res = await fetch(API_BASE + endpoint, options)
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch (e) { return { ok: res.ok, status: res.status, data: text } }
}

function toArray(res) {
  if (!res || !res.data) return []
  const d = res.data
  if (Array.isArray(d)) return d
  // common wrappers from README
  if (d.alumnos) return d.alumnos
  if (d.grupos) return d.grupos
  if (d.asignaturas) return d.asignaturas
  if (d.docentes) return d.docentes
  if (d.programas) return d.programas
  // fallback: try to extract values
  if (typeof d === 'object') return Object.values(d)
  return []
}

export default function ApiTester() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const [newAlumno, setNewAlumno] = useState({ nombre: '', apellido: '', matricula: '', cuatrimestre: 1, email: '', programaId: '' })
  const [updateAlumnoId, setUpdateAlumnoId] = useState('')
  const [updateAlumno, setUpdateAlumno] = useState({ nombre: '', apellido: '', matricula: '', cuatrimestre: 1, email: '', programaId: '' })

  const [newGrupo, setNewGrupo] = useState({ nombre: '', asignaturaId: '', docenteId: '', cuatrimestre: 1, capacidadMaxima: 25 })
  const [enrol, setEnrol] = useState({ alumnoId: '', courseId: '' })

  const [alumnosList, setAlumnosList] = useState([])
  const [docentesList, setDocentesList] = useState([])
  const [asignaturasList, setAsignaturasList] = useState([])
  const [programasList, setProgramasList] = useState([])
  const [deleteAlumnoId, setDeleteAlumnoId] = useState('')
  const [deleteDocenteId, setDeleteDocenteId] = useState('')
  const [deleteAsignaturaId, setDeleteAsignaturaId] = useState('')
  const [deleteProgramaId, setDeleteProgramaId] = useState('')

  const [newPrograma, setNewPrograma] = useState({ nombre: '', numCuatrimestres: 4 })
  const [updateProgramaId, setUpdateProgramaId] = useState('')
  const [updatePrograma, setUpdatePrograma] = useState({ nombre: '', numCuatrimestres: 4 })

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  async function loadAlumnoForUpdate(id) {
    setUpdateAlumnoId(id)
    if (!id) { setUpdateAlumno({ nombre: '', apellido: '', matricula: '', cuatrimestre: 1, email: '', programaId: '' }); return }
    try {
      const res = await request(`/api/alumnos/${id}`)
      if (res.ok && res.data) {
        const a = res.data
        setUpdateAlumno({
          nombre: a.nombre || '',
          apellido: a.apellido || '',
          matricula: a.matricula || '',
          cuatrimestre: a.cuatrimestre || 1,
          email: a.email || '',
          programaId: a.programaId || ''
        })
      }
    } catch (e) { }
  }

  function validateUpdateAlumno() {
    if (!updateAlumnoId) return 'ID de alumno requerido'
    if (!updateAlumno.nombre?.trim()) return 'Nombre es obligatorio'
    if (!updateAlumno.apellido?.trim()) return 'Apellido es obligatorio'
    if (!updateAlumno.matricula?.trim()) return 'Matrícula es obligatoria'
    if (!updateAlumno.email?.trim()) return 'Email es obligatorio'
    if (!updateAlumno.email?.match(/^[A-Za-z0-9+_.-]+@(.+)$/)) return 'Email no válido'
    if (!updateAlumno.cuatrimestre || updateAlumno.cuatrimestre < 1 || updateAlumno.cuatrimestre > 10) return 'Cuatrimestre debe estar entre 1 y 10'
    if (!updateAlumno.programaId) return 'Programa es obligatorio'
    return null
  }

  async function call(endpoint, options = {}, successMessage) {
    setLoading(true); setOutput('')
    try {
      const res = await request(endpoint, options)
      setOutput(prettyOutput(res.data))
      if (res.ok) {
        if (successMessage) setNotice({ type: 'success', text: successMessage })
        else setNotice({ type: 'success', text: `HTTP ${res.status} OK` })
      } else {
        setNotice({ type: 'error', text: `Error ${res.status}` })
      }
      return res
    } catch (err) {
      setOutput('Error: ' + err.message)
      setNotice({ type: 'error', text: err.message })
      return { ok: false, status: 0 }
    } finally { setLoading(false) }
  }

  // Load lists for selects, with flexible parsing
  async function loadLists() {
    const endpoints = ['/api/alumnos', '/api/docentes', '/api/asignaturas', '/api/programas']
    try {
      const results = await Promise.all(endpoints.map(e => request(e)))
      const [a,d,s,p] = results
      setAlumnosList(toArray(a))
      setDocentesList(toArray(d))
      setAsignaturasList(toArray(s))
      setProgramasList(toArray(p))
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { loadLists() }, [])

  async function handleCreateAlumno(e) {
    e.preventDefault()
    const body = JSON.stringify(newAlumno)
    await call('/api/alumnos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }, 'Alumno creado')
    await loadLists()
  }

  async function handleUpdateAlumno(e) {
    e.preventDefault()
    const err = validateUpdateAlumno()
    if (err) return setNotice({ type: 'error', text: err })
    const body = JSON.stringify(updateAlumno)
    await call(`/api/alumnos/${updateAlumnoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }, 'Alumno actualizado')
    await loadLists()
  }

  async function handleDeleteAlumno(id) {
    if (!confirm(`Eliminar alumno ${id}?`)) return
    await call(`/api/alumnos/${id}`, { method: 'DELETE' }, 'Alumno eliminado')
    await loadLists()
  }

  async function handleCreateGrupo(e) { e.preventDefault(); const body = JSON.stringify(newGrupo); await call('/api/grupos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }, 'Grupo creado'); await loadLists() }
  async function handleEnrol(e) { e.preventDefault(); if (!enrol.alumnoId || !enrol.courseId) return setNotice({ type: 'error', text: 'Alumno y course required' }); await call(`/api/moodle/enrol/alumno/${enrol.alumnoId}/course/${enrol.courseId}`, { method: 'POST' }, 'Matriculado correctamente') }

  // Docentes CRUD
  async function handleDeleteDocente(id) { if (!confirm(`Eliminar docente ${id}?`)) return; await call(`/api/docentes/${id}`, { method: 'DELETE' }, 'Docente eliminado'); await loadLists() }
  async function handleUpdateDocente(id, payload) { await call(`/api/docentes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 'Docente actualizado'); await loadLists() }

  // Asignaturas CRUD
  async function handleDeleteAsignatura(id) { if (!confirm(`Eliminar asignatura ${id}?`)) return; await call(`/api/asignaturas/${id}`, { method: 'DELETE' }, 'Asignatura eliminada'); await loadLists() }

  // Programas CRUD
  async function handleCreatePrograma(e) {
    e.preventDefault()
    if (!newPrograma.nombre?.trim()) return setNotice({ type: 'error', text: 'Nombre del programa es obligatorio' })
    if (!newPrograma.numCuatrimestres || newPrograma.numCuatrimestres < 1 || newPrograma.numCuatrimestres > 15) return setNotice({ type: 'error', text: 'Cuatrimestres debe estar entre 1 y 15' })
    await call('/api/programas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPrograma) }, 'Programa creado')
    setNewPrograma({ nombre: '', numCuatrimestres: 4 })
    await loadLists()
  }

  async function loadProgramaForUpdate(id) {
    setUpdateProgramaId(id)
    if (!id) { setUpdatePrograma({ nombre: '', numCuatrimestres: 4 }); return }
    try {
      const res = await request(`/api/programas/${id}`)
      if (res.ok && res.data) {
        const p = res.data
        setUpdatePrograma({ nombre: p.nombre || '', numCuatrimestres: p.numCuatrimestres || 4 })
      }
    } catch (e) { }
  }

  async function handleUpdatePrograma(e) {
    e.preventDefault()
    if (!updateProgramaId) return setNotice({ type: 'error', text: 'Selecciona un programa' })
    if (!updatePrograma.nombre?.trim()) return setNotice({ type: 'error', text: 'Nombre es obligatorio' })
    if (!updatePrograma.numCuatrimestres || updatePrograma.numCuatrimestres < 1 || updatePrograma.numCuatrimestres > 15) return setNotice({ type: 'error', text: 'Cuatrimestres debe estar entre 1 y 15' })
    await call(`/api/programas/${updateProgramaId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePrograma) }, 'Programa actualizado')
    await loadLists()
  }

  async function handleDeletePrograma(id) { if (!confirm(`Eliminar programa ${id}?`)) return; await call(`/api/programas/${id}`, { method: 'DELETE' }, 'Programa eliminado'); await loadLists() }

  return (
    <div className="api-tester">
      {notice && <Notification type={notice.type} text={notice.text} />}

      <section className="controls">
        <div className="row">
          <button onClick={() => call('/api/moodle/config')}>Traer Config Moodle</button>
          <button onClick={() => call('/api/moodle/test')}>Probar Moodle</button>
          <button onClick={() => call('/api/moodle/sync/alumnos/all', { method: 'POST' })}>Sincronizar Alumnos</button>
        </div>

        <div className="row">
          <button onClick={() => call('/api/alumnos')}>Traer Alumnos</button>
          <button onClick={() => call('/api/grupos')}>Traer Grupos</button>
          <button onClick={() => call('/api/programas')}>Traer Programas</button>
          <button onClick={() => call('/api/asignaturas')}>Traer Asignaturas</button>
          <button onClick={() => call('/api/docentes')}>Traer Docentes</button>
        </div>

        <div className="row">
          <input id="alumnoId" placeholder="ID" />
          <button onClick={() => { const id = document.getElementById('alumnoId').value || '1'; call(`/api/alumnos/${id}`) }}>Traer Alumno por ID</button>
          <input id="matricula" placeholder="Matrícula" />
          <button onClick={() => { const m = document.getElementById('matricula').value || 'A000001'; call(`/api/alumnos/matricula/${m}`) }}>Traer Alumno por Matrícula</button>
        </div>

        <div className="row">
          <input id="docenteId" placeholder="ID" />
          <button onClick={() => { const id = document.getElementById('docenteId').value || '1'; call(`/api/docentes/${id}`) }}>Traer Docente por ID</button>
          <input id="docenteSearch" placeholder="Buscar" />
          <button onClick={() => { const q = document.getElementById('docenteSearch').value || 'garcia'; call(`/api/docentes/search?q=${encodeURIComponent(q)}`) }}>Buscar Docentes</button>
        </div>

      </section>

      <section className="forms">
        <div className="card">
          <h3>Crear Alumno</h3>
          <form onSubmit={handleCreateAlumno}>
            <input placeholder="Nombre" value={newAlumno.nombre} onChange={e => setNewAlumno({ ...newAlumno, nombre: e.target.value })} required />
            <input placeholder="Apellido" value={newAlumno.apellido} onChange={e => setNewAlumno({ ...newAlumno, apellido: e.target.value })} required />
            <input placeholder="Matrícula" value={newAlumno.matricula} onChange={e => setNewAlumno({ ...newAlumno, matricula: e.target.value })} required />
            <input placeholder="Email" value={newAlumno.email} onChange={e => setNewAlumno({ ...newAlumno, email: e.target.value })} />
            <select value={newAlumno.programaId} onChange={e => setNewAlumno({ ...newAlumno, programaId: Number(e.target.value) })} required>
              <option value="">Selecciona programa</option>
              {programasList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Programa académico (obligatorio)</small>
            <input type="number" min="1" max="10" placeholder="Cuatrimestre" value={newAlumno.cuatrimestre} onChange={e => setNewAlumno({ ...newAlumno, cuatrimestre: Number(e.target.value) })} required />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Período actual de estudio (1-10)</small>
            <button type="submit">Crear alumno</button>
          </form>
        </div>

        <div className="card">
          <h3>Actualizar Alumno (PUT)</h3>
          <form onSubmit={handleUpdateAlumno}>
            <select value={updateAlumnoId} onChange={e => loadAlumnoForUpdate(e.target.value)} required>
              <option value="">Selecciona alumno</option>
              {alumnosList.map(a => <option key={a.id} value={a.id}>{a.nombre_completo || (a.nombre + ' ' + a.apellido)} ({a.matricula})</option>)}
            </select>
            <input placeholder="Nombre" value={updateAlumno.nombre} onChange={e => setUpdateAlumno({ ...updateAlumno, nombre: e.target.value })} required />
            <input placeholder="Apellido" value={updateAlumno.apellido} onChange={e => setUpdateAlumno({ ...updateAlumno, apellido: e.target.value })} required />
            <input placeholder="Matrícula" value={updateAlumno.matricula} onChange={e => setUpdateAlumno({ ...updateAlumno, matricula: e.target.value })} required />
            <input placeholder="Email" value={updateAlumno.email} onChange={e => setUpdateAlumno({ ...updateAlumno, email: e.target.value })} required />
            <select value={updateAlumno.programaId} onChange={e => setUpdateAlumno({ ...updateAlumno, programaId: Number(e.target.value) })} required>
              <option value="">Selecciona programa (obligatorio)</option>
              {programasList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="number" min="1" max="10" placeholder="Cuatrimestre" value={updateAlumno.cuatrimestre} onChange={e => setUpdateAlumno({ ...updateAlumno, cuatrimestre: Number(e.target.value) })} required />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Período de estudio (1-10)</small>
            <div style={{display:'flex',gap:8}}>
              <button type="submit">Actualizar alumno</button>
            </div>
          </form>
        </div>        <div className="card">
          <h3>Crear Grupo</h3>
          <form onSubmit={handleCreateGrupo}>
            <input placeholder="Nombre" value={newGrupo.nombre} onChange={e => setNewGrupo({ ...newGrupo, nombre: e.target.value })} required />
            <select value={newGrupo.asignaturaId} onChange={e => setNewGrupo({ ...newGrupo, asignaturaId: Number(e.target.value) })} required>
              <option value="">Selecciona asignatura</option>
              {asignaturasList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <select value={newGrupo.docenteId} onChange={e => setNewGrupo({ ...newGrupo, docenteId: Number(e.target.value) })}>
              <option value="">Selecciona docente</option>
              {docentesList.map(d => <option key={d.id} value={d.id}>{d.nombre_completo || (d.nombre + ' ' + d.apellido)}</option>)}
            </select>
            <input type="number" min="1" max="10" placeholder="Cuatrimestre" value={newGrupo.cuatrimestre} onChange={e => setNewGrupo({ ...newGrupo, cuatrimestre: Number(e.target.value) })} />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Período del grupo (1-10)</small>
            <input type="number" min="1" placeholder="Capacidad" value={newGrupo.capacidadMaxima} onChange={e => setNewGrupo({ ...newGrupo, capacidadMaxima: Number(e.target.value) })} />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Máximo de alumnos por grupo</small>
            <button type="submit">Crear grupo</button>
          </form>
        </div>

        <div className="card">
          <h3>Matricular alumno en curso (Moodle)</h3>
          <form onSubmit={handleEnrol}>
            <select value={enrol.alumnoId} onChange={e => setEnrol({ ...enrol, alumnoId: Number(e.target.value) })} required>
              <option value="">Selecciona alumno</option>
              {alumnosList.map(a => <option key={a.id} value={a.id}>{a.nombre_completo || (a.nombre + ' ' + a.apellido)} ({a.matricula})</option>)}
            </select>
            <select value={enrol.courseId} onChange={e => setEnrol({ ...enrol, courseId: e.target.value })} required>
              <option value="">Selecciona asignatura/curso</option>
              {asignaturasList.map(s => <option key={s.id} value={s.id}>{s.nombre} (ID:{s.id})</option>)}
            </select>
            <button type="submit">Matricular</button>
          </form>
        </div>

        <div className="card">
          <h3>Crear Docente</h3>
          <form onSubmit={async (e) => {
            e.preventDefault(); const form = e.target; const payload = { nombre: form.nombre.value, apellido: form.apellido.value, email: form.email.value, telefono: form.telefono.value }
            await call('/api/docentes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 'Docente creado'); await loadLists()
          }}>
            <input name="nombre" placeholder="Nombre" required />
            <input name="apellido" placeholder="Apellido" required />
            <input name="email" placeholder="Email" />
            <input name="telefono" placeholder="Teléfono" />
            <button type="submit">Crear docente</button>
          </form>
        </div>

        <div className="card">
          <h3>Crear Asignatura</h3>
          <form onSubmit={async (e) => {
            e.preventDefault(); const form = e.target; const payload = { nombre: form.nombre.value, cuatrimestre: Number(form.cuatrimestre.value), programaId: Number(form.programaId.value || 0), creditos: Number(form.creditos.value || 6) }
            await call('/api/asignaturas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 'Asignatura creada'); await loadLists()
          }}>
            <input name="nombre" placeholder="Nombre" required />
            <input name="cuatrimestre" type="number" min="1" max="10" placeholder="Cuatrimestre" defaultValue={1} />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Período del plan de estudios (1-10)</small>
            <select name="programaId" required>
              <option value="">Selecciona programa</option>
              {programasList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Programa académico (obligatorio)</small>
            <input name="creditos" type="number" min="1" max="12" placeholder="Créditos" defaultValue={6} />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Valor académico de la asignatura (1-12)</small>
            <div style={{display:'flex',gap:8}}>
              <button type="submit">Crear asignatura</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Crear Programa</h3>
          <form onSubmit={handleCreatePrograma}>
            <input placeholder="Nombre" value={newPrograma.nombre} onChange={e => setNewPrograma({ ...newPrograma, nombre: e.target.value })} required />
            <input type="number" min="1" max="15" placeholder="Cuatrimestres" value={newPrograma.numCuatrimestres} onChange={e => setNewPrograma({ ...newPrograma, numCuatrimestres: Number(e.target.value) })} required />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Duración del programa (1-15 períodos)</small>
            <button type="submit">Crear programa</button>
          </form>
        </div>

        <div className="card">
          <h3>Actualizar Programa</h3>
          <form onSubmit={handleUpdatePrograma}>
            <select value={updateProgramaId} onChange={e => loadProgramaForUpdate(e.target.value)} required>
              <option value="">Selecciona programa</option>
              {programasList.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.numCuatrimestres} cuatrimestres)</option>)}
            </select>
            <input placeholder="Nombre" value={updatePrograma.nombre} onChange={e => setUpdatePrograma({ ...updatePrograma, nombre: e.target.value })} required />
            <input type="number" min="1" max="15" placeholder="Cuatrimestres" value={updatePrograma.numCuatrimestres} onChange={e => setUpdatePrograma({ ...updatePrograma, numCuatrimestres: Number(e.target.value) })} required />
            <small style={{fontSize:'0.85em',color:'#666',marginTop:'-8px'}}>Duración del programa (1-15 períodos)</small>
            <button type="submit">Actualizar programa</button>
          </form>
        </div>

        <div className="card">
          <h3>Eliminar Alumno</h3>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select value={deleteAlumnoId} onChange={e => setDeleteAlumnoId(e.target.value)} style={{flex:1}}>
              <option value="">Selecciona alumno</option>
              {alumnosList.map(a => <option key={a.id} value={a.id}>{a.nombre_completo || (a.nombre + ' ' + a.apellido)} ({a.matricula})</option>)}
            </select>
            <button onClick={() => { if (!deleteAlumnoId) return setNotice({ type: 'error', text: 'Selecciona un alumno' }); handleDeleteAlumno(deleteAlumnoId) }}>Eliminar</button>
          </div>
        </div>

        <div className="card">
          <h3>Eliminar Docente</h3>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select value={deleteDocenteId} onChange={e => setDeleteDocenteId(e.target.value)} style={{flex:1}}>
              <option value="">Selecciona docente</option>
              {docentesList.map(d => <option key={d.id} value={d.id}>{d.nombre_completo || (d.nombre + ' ' + d.apellido)}</option>)}
            </select>
            <button onClick={() => { if (!deleteDocenteId) return setNotice({ type: 'error', text: 'Selecciona un docente' }); handleDeleteDocente(deleteDocenteId) }}>Eliminar</button>
          </div>
        </div>

        <div className="card">
          <h3>Eliminar Asignatura</h3>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select value={deleteAsignaturaId} onChange={e => setDeleteAsignaturaId(e.target.value)} style={{flex:1}}>
              <option value="">Selecciona asignatura</option>
              {asignaturasList.map(s => <option key={s.id} value={s.id}>{s.nombre} (ID:{s.id})</option>)}
            </select>
            <button onClick={() => { if (!deleteAsignaturaId) return setNotice({ type: 'error', text: 'Selecciona una asignatura' }); handleDeleteAsignatura(deleteAsignaturaId) }}>Eliminar</button>
          </div>
        </div>

        <div className="card">
          <h3>Eliminar Programa</h3>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select value={deleteProgramaId} onChange={e => setDeleteProgramaId(e.target.value)} style={{flex:1}}>
              <option value="">Selecciona programa</option>
              {programasList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button onClick={() => { if (!deleteProgramaId) return setNotice({ type: 'error', text: 'Selecciona un programa' }); handleDeletePrograma(deleteProgramaId) }}>Eliminar</button>
          </div>
        </div>
      </section>

      <section className="output">
        <div className="meta">
          <span>{loading ? 'Cargando...' : 'Listo'}</span>
        </div>
        <pre>{output}</pre>
      </section>
    </div>
  )
}
