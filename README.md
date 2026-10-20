# Nova | Sistema modular de segmentación de clientes

Aplicación para Comercial Nova: permite mantener una base de clientes, descubrir grupos mediante K-Means y explorar ideas comerciales a partir de sus promedios. La interfaz está hecha con React + TypeScript; los datos se guardan en el navegador.

## Avance del proyecto

| Fase | Resultado | Estado |
|---|---|---|
| 1. Preparación | Proyecto Vite, React, TypeScript y estructura modular | Completa |
| 2. Datos y K-Means | Datos de ejemplo, validación, persistencia y servicio de clustering | Completa |
| 3. Aplicación | Panel, clientes, segmentación y recomendaciones | Completa |
| 4. Pruebas y documentación | Pruebas automatizadas, compilación y guía de uso | Completa |

## Requisitos y ejecución

- Node.js 20 o posterior y npm.

```bash
npm install
npm run dev
```

Vite mostrará una URL local para abrir la aplicación. Los datos de clientes y el último resultado se conservan en `localStorage` de ese navegador.

## Comandos disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo
npm run typecheck  # Revisa tipos TypeScript
npm test           # Ejecuta pruebas automatizadas
npm run build      # Genera la aplicación para producción
```

## Guía fase por fase

### Fase 1: Preparar la aplicación

Vite sirve la aplicación y React presenta la interfaz. TypeScript define contratos para clientes, grupos y resultados. La navegación y el estado compartido viven en `src/app/`; cada pantalla tiene su propio módulo.

Para estudiar esta fase, empieza por `src/main.tsx`, que monta React, y continúa por `src/app/App.tsx`, que reúne navegación, estado y módulos.

### Fase 2: Gestionar datos y ejecutar K-Means

`src/data/sampleCustomers.ts` carga los 12 registros ficticios del enunciado. `src/services/customerService.ts` valida, crea, actualiza y guarda clientes. El código debe ser único; gasto, visitas y antigüedad deben ser finitos y no negativos.

`src/services/segmentationService.ts` implementa el agrupamiento sin depender de la interfaz:

1. Recibe gasto acumulado, visitas de los últimos seis meses y antigüedad.
2. Excluye registros con variables inválidas y estandariza cada variable con su media y desviación estándar. Así evita que la escala monetaria domine las distancias.
3. Inicializa K centroides con una estrategia K-Means++ y asigna cada punto al centroide más cercano.
4. Recalcula los centroides como la media de sus puntos y repite hasta converger o llegar a 300 iteraciones.
5. Prueba diez inicializaciones reproducibles y conserva la de menor inercia (suma de distancias cuadráticas dentro de los grupos).
6. Devuelve la asignación y los promedios de cada grupo en las unidades originales.

K se puede elegir entre 2 y 5. El nombre y el código solo identifican al cliente: no se usan para calcular similitudes.

### Fase 3: Explorar el sistema

- **Panel principal:** total de clientes, gasto promedio, visitas promedio y estado del último análisis.
- **Clientes:** alta, edición, búsqueda y eliminación con confirmación. Los cambios invalidan el análisis anterior para evitar mostrar segmentos desactualizados.
- **Segmentación:** selector K, ejecución, cantidad procesada, fecha, promedios por grupo y tabla filtrable/ordenable.
- **Recomendaciones:** cada grupo muestra por separado una recomendación comercial y una propuesta de campaña concreta, construidas con promedios relativos. Son hipótesis para probar, no certezas sobre personas.

Los datos se guardan en el navegador, por lo que no se comparten entre dispositivos. La capa de cálculo está separada y puede sustituirse por una API Python más adelante; esta entrega calcula K-Means localmente en TypeScript y no incluye backend.

### Fase 4: Verificar y entregar

La suite automatizada cubre validación y creación de clientes, asignación de todos los registros, reproducibilidad, rango de K y exclusión de valores inválidos. Para repetir la verificación:

```bash
npm test
npm run typecheck
npm run build
```

## Estructura del código

```text
src/
	app/App.tsx                         # Navegación, estado y composición
	data/sampleCustomers.ts             # Datos iniciales del enunciado
	modules/dashboard/Dashboard.tsx     # Indicadores y panorama
	modules/customers/Customers.tsx     # CRUD y búsqueda
	modules/segmentation/Segmentation.tsx # Ejecución y resultados
	modules/recommendations/Recommendations.tsx
	services/customerService.ts         # Validación y persistencia
	services/segmentationService.ts     # Estandarización y K-Means
	types/index.ts                      # Modelos compartidos
```

## Casos de prueba manuales

| Caso | Acción | Resultado esperado |
|---|---|---|
| 1 | Registrar un cliente con datos válidos | Se agrega a la tabla y se conserva al recargar |
| 2 | Registrar un código repetido, ignorando mayúsculas | Se rechaza con un mensaje claro |
| 3 | Dejar código o nombre vacío | El formulario exige completar el campo |
| 4 | Ingresar gasto, visitas o antigüedad negativos | Se impide guardar |
| 5 | Editar un cliente | Se actualiza la fila y los indicadores |
| 6 | Buscar por código o nombre | La tabla muestra coincidencias |
| 7 | Cancelar la confirmación de eliminación | El cliente permanece en la tabla |
| 8 | Ejecutar K = 3 con los datos iniciales | Se muestran tres grupos y sus promedios |
| 9 | Elegir K mayor que los registros válidos | No se ejecuta y se explica el requisito |
| 10 | Cambiar clientes después de segmentar | Se limpian las etiquetas antiguas y se solicita recalcular |

## Conceptos para interpretar los resultados

- Es aprendizaje no supervisado: los registros no tienen una etiqueta previa de segmento.
- K-Means forma grupos por proximidad; no predice categorías conocidas como lo haría un clasificador supervisado.
- Las etiquetas `Grupo 1`, `Grupo 2`, etc. son identificadores técnicos. La interpretación se hace después observando cantidad y promedios.
- K cambia el nivel de detalle: un K menor produce grupos más amplios; uno mayor divide más la base y puede dificultar la interpretación.
- El análisis usa solo tres variables de compra. No representa todas las preferencias, contexto ni comportamiento de cada cliente.

## Decisiones y límites

- Se seleccionó cálculo local en TypeScript para que la práctica funcione sin configurar otro servidor. `segmentationService` concentra la lógica para facilitar su reemplazo por una API con scikit-learn.
- `localStorage` es apropiado para una práctica local, pero no para datos comerciales reales ni para colaboración entre usuarios.
- Las recomendaciones son reglas sencillas basadas en valores relativos; deben probarse con resultados de campañas antes de tomar decisiones de negocio.
- El proyecto no incluye importación CSV, autenticación, base de datos compartida ni API Python.
