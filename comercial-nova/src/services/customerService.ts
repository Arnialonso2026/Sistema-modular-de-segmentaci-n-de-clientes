
import type { Customer, CustomerInput } from "../types/customer";

const STORAGE_KEY = "comercial-nova:customers:v1";

export class CustomerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

export interface CustomerService {
  getAll(): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(input: CustomerInput): Promise<Customer>;
  update(id: string, input: CustomerInput): Promise<Customer>;
  remove(id: string): Promise<void>;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateInput(input: CustomerInput): void {
  if (!input.id.trim()) {
    throw new CustomerServiceError(
      "El código del cliente es obligatorio.",
    );
  }

  if (!input.nombre.trim()) {
    throw new CustomerServiceError(
      "El nombre del cliente es obligatorio.",
    );
  }

  if (input.id.trim().length > 20) {
    throw new CustomerServiceError(
      "El código no puede superar los 20 caracteres.",
    );
  }

  if (input.nombre.trim().length > 100) {
    throw new CustomerServiceError(
      "El nombre no puede superar los 100 caracteres.",
    );
  }

  if (
    !Number.isFinite(input.gastoAcumulado) ||
    input.gastoAcumulado < 0
  ) {
    throw new CustomerServiceError(
      "El gasto acumulado debe ser un número válido no negativo.",
    );
  }

  if (
    !Number.isSafeInteger(input.visitas6Meses) ||
    input.visitas6Meses < 0
  ) {
    throw new CustomerServiceError(
      "Las visitas deben ser un entero no negativo.",
    );
  }

  if (
    !Number.isSafeInteger(input.antiguedadMeses) ||
    input.antiguedadMeses < 0
  ) {
    throw new CustomerServiceError(
      "La antigüedad debe ser un entero no negativo.",
    );
  }
}

function isCustomer(value: unknown): value is Customer {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const customer = value as Record<string, unknown>;

  return (
    typeof customer.id === "string" &&
    customer.id.trim().length > 0 &&
    typeof customer.nombre === "string" &&
    customer.nombre.trim().length > 0 &&
    typeof customer.gastoAcumulado === "number" &&
    Number.isFinite(customer.gastoAcumulado) &&
    customer.gastoAcumulado >= 0 &&
    typeof customer.visitas6Meses === "number" &&
    Number.isSafeInteger(customer.visitas6Meses) &&
    customer.visitas6Meses >= 0 &&
    typeof customer.antiguedadMeses === "number" &&
    Number.isSafeInteger(customer.antiguedadMeses) &&
    customer.antiguedadMeses >= 0 &&
    (
      customer.segmento === undefined ||
      (
        typeof customer.segmento === "number" &&
        Number.isSafeInteger(customer.segmento) &&
        customer.segmento >= 0
      )
    )
  );
}

function readStorage(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (
      !Array.isArray(parsed) ||
      !parsed.every(isCustomer)
    ) {
      throw new CustomerServiceError(
        "Los datos guardados tienen un formato inválido. No se modificaron.",
      );
    }

    const codes = parsed.map((customer) =>
      normalizeCode(customer.id),
    );

    if (new Set(codes).size !== codes.length) {
      throw new CustomerServiceError(
        "Los datos guardados contienen códigos duplicados.",
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof CustomerServiceError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new CustomerServiceError(
        "No se pudieron interpretar los datos guardados.",
      );
    }

    throw new CustomerServiceError(
      "No se pudo acceder al almacenamiento local del navegador.",
    );
  }
}

function writeStorage(customers: Customer[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(customers),
    );
  } catch {
    throw new CustomerServiceError(
      "No se pudieron guardar los datos. Comprueba el almacenamiento disponible del navegador.",
    );
  }
}

export const customerService: CustomerService = {
  async getAll() {
    return readStorage().sort((a, b) =>
      a.id.localeCompare(b.id, "es", {
        numeric: true,
        sensitivity: "base",
      }),
    );
  },

  async getById(id) {
    const code = normalizeCode(id);

    return (
      readStorage().find(
        (customer) => normalizeCode(customer.id) === code,
      ) ?? null
    );
  },

  async create(input) {
    validateInput(input);

    const customers = readStorage();
    const code = normalizeCode(input.id);

    if (
      customers.some(
        (customer) => normalizeCode(customer.id) === code,
      )
    ) {
      throw new CustomerServiceError(
        `El código ${code} ya está registrado.`,
      );
    }

    const customer: Customer = {
      id: code,
      nombre: normalizeName(input.nombre),
      gastoAcumulado: input.gastoAcumulado,
      visitas6Meses: input.visitas6Meses,
      antiguedadMeses: input.antiguedadMeses,
    };

    writeStorage([...customers, customer]);

    return customer;
  },

  async update(id, input) {
    validateInput(input);

    const customers = readStorage();
    const originalCode = normalizeCode(id);
    const newCode = normalizeCode(input.id);

    const index = customers.findIndex(
      (customer) =>
        normalizeCode(customer.id) === originalCode,
    );

    if (index === -1) {
      throw new CustomerServiceError(
        "El cliente que intentas editar ya no existe.",
      );
    }

    const duplicate = customers.some(
      (customer, customerIndex) =>
        customerIndex !== index &&
        normalizeCode(customer.id) === newCode,
    );

    if (duplicate) {
      throw new CustomerServiceError(
        `El código ${newCode} ya pertenece a otro cliente.`,
      );
    }

    const updated: Customer = {
      ...customers[index],
      id: newCode,
      nombre: normalizeName(input.nombre),
      gastoAcumulado: input.gastoAcumulado,
      visitas6Meses: input.visitas6Meses,
      antiguedadMeses: input.antiguedadMeses,
    };

    const nextCustomers = [...customers];
    nextCustomers[index] = updated;

    writeStorage(nextCustomers);

    return updated;
  },

  async remove(id) {
    const customers = readStorage();
    const code = normalizeCode(id);

    if (
      !customers.some(
        (customer) => normalizeCode(customer.id) === code,
      )
    ) {
      throw new CustomerServiceError(
        "El cliente que intentas eliminar no existe.",
      );
    }

    writeStorage(
      customers.filter(
        (customer) => normalizeCode(customer.id) !== code,
      ),
    );
  },
};
