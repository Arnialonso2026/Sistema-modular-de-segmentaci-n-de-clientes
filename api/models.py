from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CustomerInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    nombre: str = Field(min_length=1)
    gastoAcumulado: float = Field(ge=0, allow_inf_nan=False)
    visitas6Meses: float = Field(ge=0, allow_inf_nan=False)
    antiguedadMeses: float = Field(ge=0, allow_inf_nan=False)


class SegmentationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    k: int = Field(ge=2, le=5)
    customers: list[CustomerInput] = Field(min_length=1)

    @field_validator("customers")
    @classmethod
    def require_unique_customer_ids(cls, customers: list[CustomerInput]) -> list[CustomerInput]:
        ids = [customer.id for customer in customers]
        if len(ids) != len(set(ids)):
            raise ValueError("Los identificadores de clientes deben ser únicos.")
        return customers

    @model_validator(mode="after")
    def require_enough_customers(self) -> "SegmentationRequest":
        if len(self.customers) < self.k:
            raise ValueError(f"Se necesitan al menos {self.k} clientes válidos para ejecutar la segmentación.")
        return self


class SegmentLabel(BaseModel):
    id: str
    segmento: int


class StandardizedFeature(BaseModel):
    id: str
    values: list[float]


class CustomerDistance(BaseModel):
    id: str
    distance: float


class SegmentResult(BaseModel):
    id: int
    cantidad: int
    gastoPromedio: float
    visitasPromedio: float
    antiguedadPromedio: float
    centroid: dict[str, float]
    standardizedCentroid: list[float]
    averageDistance: float
    inertia: float


class SegmentationResponse(BaseModel):
    k: int
    fechaEjecucion: str
    cantidadProcesada: int
    inertia: float
    globalAverage: dict[str, float]
    labels: list[SegmentLabel]
    standardizedFeatures: list[StandardizedFeature]
    distances: list[CustomerDistance]
    groups: list[SegmentResult]