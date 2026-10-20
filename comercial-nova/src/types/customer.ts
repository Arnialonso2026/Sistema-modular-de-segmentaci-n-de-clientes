

export interface Customer {
  id: string;
  nombre: string;
  gastoAcumulado: number;
  visitas6Meses: number;
  antiguedadMeses: number;
  segmento?: number;
}

export interface CustomerInput {
  id: string;
  nombre: string;
  gastoAcumulado: number;
  visitas6Meses: number;
  antiguedadMeses: number;
}

export interface CustomerFilters {
  search: string;
  segmento: number | "todos";
}

export type CustomerField =
  | "id"
  | "nombre"
  | "gastoAcumulado"
  | "visitas6Meses"
  | "antiguedadMeses";

export type CustomerValidationErrors = Partial<
  Record<CustomerField, string>
>;
