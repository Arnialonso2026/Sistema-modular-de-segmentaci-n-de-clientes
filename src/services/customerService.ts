import { sampleCustomers } from '../data/sampleCustomers'
import type { Customer, CustomerInput } from '../types'

const STORAGE_KEY = 'nova-customers-v1'

export function getCustomers(): Customer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      saveCustomers(sampleCustomers)
      return sampleCustomers
    }
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as Customer[] : sampleCustomers
  } catch {
    return sampleCustomers
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

export function validateCustomer(input: CustomerInput, customers: Customer[], originalId?: string): string | null {
  if (!input.id.trim() || !input.nombre.trim()) return 'Completa el código y el nombre del cliente.'
  if ([input.gastoAcumulado, input.visitas6Meses, input.antiguedadMeses].some((value) => !Number.isFinite(value) || value < 0)) {
    return 'Gasto, visitas y antigüedad deben ser números válidos y no negativos.'
  }
  if (customers.some((customer) => customer.id.toLowerCase() === input.id.trim().toLowerCase() && customer.id !== originalId)) {
    return 'Ese código ya está asignado a otro cliente.'
  }
  return null
}

export function createCustomer(input: CustomerInput, customers: Customer[]): Customer[] {
  return [...customers, { ...input, id: input.id.trim().toUpperCase(), nombre: input.nombre.trim() }]
}

export function updateCustomer(input: CustomerInput, customers: Customer[], originalId: string): Customer[] {
  return customers.map((customer) => customer.id === originalId
    ? { ...input, id: input.id.trim().toUpperCase(), nombre: input.nombre.trim() }
    : customer)
}