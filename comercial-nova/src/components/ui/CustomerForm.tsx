import { useState } from "react";
import type {
  FormEvent,
  ChangeEvent,
} from "react";

import type {
  Customer,
  CustomerInput,
  CustomerValidationErrors,
} from "../../types/customer";

interface CustomerFormProps {
  initialCustomer?: Customer | null;
  onSubmit: (input: CustomerInput) => Promise<void>;
  onCancel: () => void;
}

type FormValues = {
  id: string;
  nombre: string;
  gastoAcumulado: string;
  visitas6Meses: string;
  antiguedadMeses: string;
};

const emptyValues: FormValues = {
  id: "",
  nombre: "",
  gastoAcumulado: "0",
  visitas6Meses: "0",
  antiguedadMeses: "0",
};

function toFormValues(customer?: Customer | null): FormValues {
  if (!customer) {
    return { ...emptyValues };
  }

  return {
    id: customer.id,
    nombre: customer.nombre,
    gastoAcumulado: String(customer.gastoAcumulado),
    visitas6Meses: String(customer.visitas6Meses),
    antiguedadMeses: String(customer.antiguedadMeses),
  };
}

function validate(values: FormValues): CustomerValidationErrors {
  const errors: CustomerValidationErrors = {};

  if (!values.id.trim()) {
    errors.id = "Introduce un código de cliente.";
  } else if (values.id.trim().length > 20) {
    errors.id = "Máximo 20 caracteres.";
  }

  if (!values.nombre.trim()) {
    errors.nombre = "Introduce el nombre del cliente.";
  } else if (values.nombre.trim().length > 100) {
    errors.nombre = "Máximo 100 caracteres.";
  }

  const gasto = Number(values.gastoAcumulado);
  const visitas = Number(values.visitas6Meses);
  const antiguedad = Number(values.antiguedadMeses);

  if (
    values.gastoAcumulado.trim() === "" ||
    !Number.isFinite(gasto) ||
    gasto < 0
  ) {
    errors.gastoAcumulado =
      "Introduce un gasto válido igual o mayor que cero.";
  }

  if (
    values.visitas6Meses.trim() === "" ||
    !Number.isSafeInteger(visitas) ||
    visitas < 0
  ) {
    errors.visitas6Meses =
      "Introduce un entero no negativo.";
  }

  if (
    values.antiguedadMeses.trim() === "" ||
    !Number.isSafeInteger(antiguedad) ||
    antiguedad < 0
  ) {
    errors.antiguedadMeses =
      "Introduce un entero no negativo.";
  }

  return errors;
}

export function CustomerForm({
  initialCustomer = null,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [values, setValues] = useState<FormValues>(
    () => toFormValues(initialCustomer),
  );

  const [errors, setErrors] =
    useState<CustomerValidationErrors>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const editing = initialCustomer !== null;

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;
    const field = name as keyof FormValues;

    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        id: values.id.trim().toUpperCase(),
        nombre: values.nombre.trim(),
        gastoAcumulado: Number(values.gastoAcumulado),
        visitas6Meses: Number(values.visitas6Meses),
        antiguedadMeses: Number(values.antiguedadMeses),
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(
    field: keyof CustomerValidationErrors,
  ) {
    return errors[field];
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit} noValidate>
      <div className="customer-form__intro">
        <p>
          {editing
            ? "Actualiza los datos del registro seleccionado."
            : "Completa los datos para incorporar un nuevo cliente."}
        </p>
        <span>Todos los campos son obligatorios.</span>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="customer-id">Código del cliente</label>
          <input
            id="customer-id"
            name="id"
            type="text"
            value={values.id}
            onChange={handleChange}
            placeholder="Ej. C013"
            maxLength={20}
            autoComplete="off"
            aria-invalid={Boolean(fieldError("id"))}
            aria-describedby={
              fieldError("id") ? "customer-id-error" : undefined
            }
            disabled={submitting}
          />
          {fieldError("id") && (
            <span id="customer-id-error" className="field-error">
              {fieldError("id")}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="customer-name">Nombre completo</label>
          <input
            id="customer-name"
            name="nombre"
            type="text"
            value={values.nombre}
            onChange={handleChange}
            placeholder="Nombre y apellidos"
            maxLength={100}
            autoComplete="name"
            aria-invalid={Boolean(fieldError("nombre"))}
            aria-describedby={
              fieldError("nombre")
                ? "customer-name-error"
                : undefined
            }
            disabled={submitting}
          />
          {fieldError("nombre") && (
            <span id="customer-name-error" className="field-error">
              {fieldError("nombre")}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="customer-spend">
            Gasto acumulado (S/)
          </label>
          <input
            id="customer-spend"
            name="gastoAcumulado"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.gastoAcumulado}
            onChange={handleChange}
            aria-invalid={Boolean(fieldError("gastoAcumulado"))}
            aria-describedby={
              fieldError("gastoAcumulado")
                ? "customer-spend-error"
                : undefined
            }
            disabled={submitting}
          />
          {fieldError("gastoAcumulado") && (
            <span id="customer-spend-error" className="field-error">
              {fieldError("gastoAcumulado")}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="customer-visits">
            Visitas en los últimos 6 meses
          </label>
          <input
            id="customer-visits"
            name="visitas6Meses"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.visitas6Meses}
            onChange={handleChange}
            aria-invalid={Boolean(fieldError("visitas6Meses"))}
            aria-describedby={
              fieldError("visitas6Meses")
                ? "customer-visits-error"
                : undefined
            }
            disabled={submitting}
          />
          {fieldError("visitas6Meses") && (
            <span id="customer-visits-error" className="field-error">
              {fieldError("visitas6Meses")}
            </span>
          )}
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="customer-age">
            Antigüedad como cliente (meses)
          </label>
          <input
            id="customer-age"
            name="antiguedadMeses"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={values.antiguedadMeses}
            onChange={handleChange}
            aria-invalid={Boolean(fieldError("antiguedadMeses"))}
            aria-describedby={
              fieldError("antiguedadMeses")
                ? "customer-age-error"
                : undefined
            }
            disabled={submitting}
          />
          {fieldError("antiguedadMeses") && (
            <span id="customer-age-error" className="field-error">
              {fieldError("antiguedadMeses")}
            </span>
          )}
        </div>
      </div>

      {submitError && (
        <div className="form-alert" role="alert">
          {submitError}
        </div>
      )}

      <div className="customer-form__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="button button--primary"
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : editing
              ? "Guardar cambios"
              : "Registrar cliente"}
        </button>
      </div>
    </form>
  );
}