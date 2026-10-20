import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";

import { PageHeader } from "../../components/ui/PageHeader";
import { CustomerForm } from "../../components/ui/CustomerForm";
import { CustomerTable } from "../../components/ui/CustomerTable";
import { customerService } from "../../services/customerService";

import type { Customer, CustomerInput } from "../../types/customer";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los clientes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");

    if (!query) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.id.toLocaleLowerCase("es").includes(query) ||
        customer.nombre.toLocaleLowerCase("es").includes(query),
    );
  }, [customers, search]);

  function openCreateModal() {
    setSelectedCustomer(null);
    setSuccessMessage("");
    setModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setSelectedCustomer(customer);
    setSuccessMessage("");
    setModalOpen(true);
  }

  async function handleSave(input: CustomerInput) {
    if (selectedCustomer) {
      await customerService.update(selectedCustomer.id, input);
      setSuccessMessage(
        `El cliente ${input.id.toUpperCase()} se actualizó correctamente.`,
      );
    } else {
      await customerService.create(input);
      setSuccessMessage(
        `El cliente ${input.id.toUpperCase()} se registró correctamente.`,
      );
    }

    setModalOpen(false);
    setSelectedCustomer(null);
    await loadCustomers();
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar a ${customer.nombre} (${customer.id})?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setPageError("");
    setSuccessMessage("");

    try {
      await customerService.remove(customer.id);
      setSuccessMessage(
        `El cliente ${customer.nombre} fue eliminado correctamente.`,
      );
      await loadCustomers();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el cliente.",
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="GESTIÓN COMERCIAL"
        title="Clientes"
        description="Administra los registros que servirán como base para el análisis del comportamiento comercial."
        action={
          <button
            type="button"
            className="button button--primary"
            onClick={openCreateModal}
          >
            <Plus size={17} aria-hidden="true" />
            Nuevo cliente
          </button>
        }
      />

      <section className="customer-summary" aria-label="Resumen de clientes">
        <div className="customer-summary__icon">
          <Users size={22} aria-hidden="true" />
        </div>

        <div>
          <span className="customer-summary__label">
            Clientes registrados
          </span>
          <strong className="customer-summary__value">
            {loading ? "…" : customers.length}
          </strong>
        </div>

        <div className="customer-summary__note">
          {customers.length === 1
            ? "Registro disponible para análisis"
            : "Registros disponibles para análisis"}
        </div>
      </section>

      {successMessage && (
        <div className="page-feedback page-feedback--success" role="status">
          <span>{successMessage}</span>
          <button
            type="button"
            aria-label="Cerrar mensaje"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {pageError && (
        <div className="page-feedback page-feedback--error" role="alert">
          <span>{pageError}</span>
          <button
            type="button"
            aria-label="Cerrar mensaje de error"
            onClick={() => setPageError("")}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <section className="panel loading-state" aria-live="polite">
          <div className="loading-indicator" />
          <p>Cargando registros de clientes...</p>
        </section>
      ) : (
        <CustomerTable
          customers={filteredCustomers}
          search={search}
          onSearchChange={setSearch}
          onEdit={openEditModal}
          onDelete={(customer) => void handleDelete(customer)}
          onCreate={openCreateModal}
        />
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
              setSelectedCustomer(null);
            }
          }}
        >
          <section
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
          >
            <header className="customer-modal__header">
              <div>
                <p className="eyebrow">GESTIÓN DE REGISTROS</p>
                <h2 id="customer-modal-title">
                  {selectedCustomer
                    ? "Editar cliente"
                    : "Registrar cliente"}
                </h2>
                <p>
                  Introduce los datos comerciales del cliente.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Cerrar formulario"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                ×
              </button>
            </header>

            <CustomerForm
              key={selectedCustomer ? selectedCustomer.id : "new-customer"}
              initialCustomer={selectedCustomer}
              onSubmit={handleSave}
              onCancel={() => {
                setModalOpen(false);
                setSelectedCustomer(null);
              }}
            />
          </section>
        </div>
      )}
    </>
  );
}