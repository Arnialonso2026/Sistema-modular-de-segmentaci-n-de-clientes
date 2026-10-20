
import { Pencil, Search, Trash2, Users } from "lucide-react";

import type { Customer } from "../../types/customer";
import { EmptyState } from "./EmptyState";

interface CustomerTableProps {
  customers: Customer[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCreate: () => void;
}

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function CustomerTable({
  customers,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onCreate,
}: CustomerTableProps) {
  return (
    <section className="panel customer-panel">
      <div className="customer-toolbar">
        <div className="customer-toolbar__title">
          <h2>Directorio de clientes</h2>
          <p>
            {customers.length === 1
              ? "1 registro encontrado"
              : `${customers.length} registros encontrados`}
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={onCreate}
        >
          <Users size={17} aria-hidden="true" />
          Nuevo cliente
        </button>
      </div>

      <div className="customer-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por código o nombre..."
          aria-label="Buscar clientes por código o nombre"
        />
        {search && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onSearchChange("")}
          >
            Limpiar
          </button>
        )}
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No hay coincidencias" : "No hay clientes registrados"}
          description={
            search
              ? "Prueba con otro código o nombre."
              : "Registra el primer cliente para comenzar a construir tu conjunto de datos."
          }
        />
      ) : (
        <div className="table-scroll">
          <table className="customer-table">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Gasto acumulado</th>
                <th scope="col">Visitas (6 meses)</th>
                <th scope="col">Antigüedad</th>
                <th scope="col">Segmento</th>
                <th scope="col" className="table-actions-heading">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-identity">
                      <span className="customer-initial">
                        {customer.nombre.trim().charAt(0).toUpperCase()}
                      </span>

                      <span className="customer-identity__text">
                        <strong>{customer.nombre}</strong>
                        <small>{customer.id}</small>
                      </span>
                    </div>
                  </td>

                  <td className="numeric-cell">
                    {currencyFormatter.format(customer.gastoAcumulado)}
                  </td>

                  <td className="numeric-cell">
                    {customer.visitas6Meses}
                  </td>

                  <td className="numeric-cell">
                    {customer.antiguedadMeses} meses
                  </td>

                  <td>
                    {customer.segmento === undefined ? (
                      <span className="segment-unassigned">
                        Sin asignar
                      </span>
                    ) : (
                      <span className="segment-assigned">
                        Grupo {customer.segmento}
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action"
                        aria-label={`Editar a ${customer.nombre}`}
                        title="Editar cliente"
                        onClick={() => onEdit(customer)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="table-action table-action--danger"
                        aria-label={`Eliminar a ${customer.nombre}`}
                        title="Eliminar cliente"
                        onClick={() => onDelete(customer)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
