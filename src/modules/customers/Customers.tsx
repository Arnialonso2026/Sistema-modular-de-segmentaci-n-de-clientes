import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { createCustomer, updateCustomer, validateCustomer } from '../../services/customerService'
import type { Customer, CustomerInput } from '../../types'

interface CustomersProps {
  customers: Customer[]
  onChange: (customers: Customer[]) => void
  onNotice: (message: string, kind?: 'success' | 'error') => void
}

const emptyForm: CustomerInput = { id: '', nombre: '', gastoAcumulado: 0, visitas6Meses: 0, antiguedadMeses: 0 }
const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })

export default function Customers({ customers, onChange, onNotice }: CustomersProps) {
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<CustomerInput>(emptyForm)
  const [formError, setFormError] = useState('')
  const visibleCustomers = customers.filter((customer) =>
    `${customer.id} ${customer.nombre}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')),
  )

  function openCreate() {
    setEditingId(null)
    setIsFormOpen(true)
    setForm(emptyForm)
    setFormError('')
  }

  function openEdit(customer: Customer) {
    setEditingId(customer.id)
    setIsFormOpen(true)
    setForm({ id: customer.id, nombre: customer.nombre, gastoAcumulado: customer.gastoAcumulado, visitas6Meses: customer.visitas6Meses, antiguedadMeses: customer.antiguedadMeses })
    setFormError('')
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const error = validateCustomer(form, customers, editingId ?? undefined)
    if (error) {
      setFormError(error)
      return
    }
    const next = editingId ? updateCustomer(form, customers, editingId) : createCustomer(form, customers)
    onChange(next)
    onNotice(editingId ? 'Los datos del cliente se actualizaron.' : 'El cliente se agregó correctamente.')
    setIsFormOpen(false)
  }

  function remove(customer: Customer) {
    if (!window.confirm(`¿Eliminar a ${customer.nombre} (${customer.id})? Esta acción no se puede deshacer.`)) return
    onChange(customers.filter((item) => item.id !== customer.id))
    onNotice('El cliente se eliminó.')
  }

  function setNumber(field: 'gastoAcumulado' | 'visitas6Meses' | 'antiguedadMeses', value: string) {
    setForm((current) => ({ ...current, [field]: value === '' ? Number.NaN : Number(value) }))
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div><span className="eyebrow">BASE DE CLIENTES</span><h2>Clientes</h2><p>Administra los registros que alimentan el análisis.</p></div>
        <button className="button button-primary" onClick={openCreate}><Plus size={17} /> Nuevo cliente</button>
      </div>

      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="table-count"><strong>{customers.length}</strong> registros</div>
          <label className="search-field"><Search size={16} /><span className="sr-only">Buscar por nombre o código</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre o código" /></label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Cliente</th><th>Gasto acumulado</th><th>Visitas / 6 meses</th><th>Antigüedad</th><th>Segmento</th><th><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {visibleCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td><div className="customer-cell"><span className="avatar">{customer.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{customer.nombre}</strong><small>{customer.id}</small></span></div></td>
                  <td>{money.format(customer.gastoAcumulado)}</td>
                  <td>{customer.visitas6Meses}</td>
                  <td>{customer.antiguedadMeses} meses</td>
                  <td>{customer.segmento === undefined ? <span className="muted-dash">Sin analizar</span> : <span className={`segment-badge group-color-${customer.segmento % 5}`}>Grupo {customer.segmento + 1}</span>}</td>
                  <td><div className="row-actions"><button className="icon-button" aria-label={`Editar ${customer.nombre}`} title="Editar" onClick={() => openEdit(customer)}><Pencil size={16} /></button><button className="icon-button danger-action" aria-label={`Eliminar ${customer.nombre}`} title="Eliminar" onClick={() => remove(customer)}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleCustomers.length === 0 && <div className="empty-state table-empty"><div className="empty-icon"><Users size={20} /></div><strong>{customers.length ? 'No hay coincidencias' : 'Aún no hay clientes'}</strong><p>{customers.length ? 'Prueba con otro nombre o código.' : 'Agrega el primer registro para comenzar.'}</p></div>}
        </div>
        <div className="table-footer">Los códigos identifican registros; no son variables del algoritmo.</div>
      </section>

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false) }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
            <div className="modal-heading"><div><span className="eyebrow">REGISTRO DE CLIENTE</span><h3 id="customer-modal-title">{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h3></div><button className="icon-button" aria-label="Cerrar" onClick={() => setIsFormOpen(false)}><X size={18} /></button></div>
            <form onSubmit={save}>
              <div className="form-grid">
                <label className="form-field"><span>Código</span><input required value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value.toUpperCase() })} placeholder="C013" maxLength={12} /></label>
                <label className="form-field"><span>Nombre completo</span><input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Nombre y apellido" /></label>
                <label className="form-field"><span>Gasto acumulado (S/)</span><input required type="number" min="0" step="0.01" value={Number.isNaN(form.gastoAcumulado) ? '' : form.gastoAcumulado} onChange={(event) => setNumber('gastoAcumulado', event.target.value)} /></label>
                <label className="form-field"><span>Visitas en 6 meses</span><input required type="number" min="0" step="1" value={Number.isNaN(form.visitas6Meses) ? '' : form.visitas6Meses} onChange={(event) => setNumber('visitas6Meses', event.target.value)} /></label>
                <label className="form-field"><span>Antigüedad (meses)</span><input required type="number" min="0" step="1" value={Number.isNaN(form.antiguedadMeses) ? '' : form.antiguedadMeses} onChange={(event) => setNumber('antiguedadMeses', event.target.value)} /></label>
              </div>
              {formError && <p className="inline-error" role="alert">{formError}</p>}
              <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setIsFormOpen(false)}>Cancelar</button><button type="submit" className="button button-primary">Guardar cliente</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}