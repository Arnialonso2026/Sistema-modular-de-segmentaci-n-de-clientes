# Nova | Sistema modular de segmentación de clientes

Aplicación para Comercial Nova: permite mantener una base de clientes, descubrir grupos mediante K-Means y explorar ideas comerciales a partir de sus promedios. La interfaz está hecha con React + TypeScript; los datos se guardan en el navegador.

## Avance del proyecto

| Fase | Resultado | Estado |
|---|---|---|
| 1. Preparación | Proyecto Vite, React, TypeScript y estructura modular | Completa |
| 2. Datos y K-Means | Datos de ejemplo, validación, persistencia y servicio de clustering | Completa |
| 3. Aplicación inicial | Panel, clientes, segmentación y recomendaciones | Completa |
| 4. Evaluación del modelo | Silhouette, método del codo, comparación de K y recomendación | Completa |
| 5. Pruebas y documentación | Pruebas automatizadas, compilación y guía de uso | Completa |

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
- **Segmentación:** selector manual K de 2 a 5, ejecución, fecha, promedios por grupo y tabla filtrable/ordenable.
- **Recomendaciones:** cada grupo muestra una recomendación comercial y una propuesta de campaña orientativa.

### Fase 4: Evaluar K-Means

Abre **Evaluación del modelo** desde el menú lateral. La pantalla vuelve a evaluar la base actual para cada K desde 2 hasta `min(8, clientes válidos - 1)`. La evaluación reutiliza el núcleo de `clusteringCore.ts`; no mantiene una segunda versión de K-Means. Para cada K conserva la mejor inercia de diez inicializaciones reproducibles.

La vista incluye una tabla comparativa con K, inercia, Silhouette Score y cantidad de clientes; una curva de inercia para el método del codo; otra curva de Silhouette; y una tarjeta que presenta una recomendación estadística y su lectura de calidad. El selector manual de K de la pantalla **Segmentación** se conserva sin cambios.

La recomendación prioriza el K con el mayor Silhouette Score. El codo se muestra como señal complementaria: si su estimación no coincide con Silhouette, la pantalla informa el desacuerdo. No existe un K universalmente correcto; también importa que los grupos sean interpretables y útiles para el negocio.

#### Fórmulas e interpretación

La inercia para un K dado es:

```text
Inercia(K) = Σᵢ ||xᵢ - μgrupo(i)||²
```

`xᵢ` es cada cliente después de estandarizar las variables y `μgrupo(i)` es el centroide al que fue asignado. Una inercia menor indica menor dispersión interna para ese K, pero la inercia siempre baja o se mantiene al aumentar K. Por eso se observa el **codo**: el punto a partir del cual añadir grupos reduce la inercia cada vez menos. La implementación normaliza K e inercia y elige el punto interior con mayor distancia perpendicular a la línea entre los extremos; si la desviación no es clara, no señala un codo.

El Silhouette de cada cliente es:

```text
s(i) = (b(i) - a(i)) / max(a(i), b(i))
```

`a(i)` es la distancia media a los clientes del mismo grupo y `b(i)` es la menor distancia media a otro grupo. El promedio está entre −1 y 1: valores cercanos a 1 suelen indicar grupos compactos y separados; cerca de 0, solapamiento; negativos, posibles asignaciones inadecuadas. Son orientaciones, no umbrales universales. Los clientes que forman un grupo unitario aportan 0.

Con hasta 600 clientes válidos, Silhouette se calcula con todos los registros. Con más de 600, se toman hasta 600 índices distribuidos de manera determinista y cada uno se compara con todos los clientes; la interfaz indica que el valor es estimado por muestreo.

La recomendación estadística requiere al menos dos K evaluables. Con tres clientes solo se evalúa K=2; se muestra su métrica, pero no se recomienda entre alternativas. Si hay menos de tres clientes válidos, no se puede evaluar Silhouette.

Los datos se guardan en el navegador, por lo que no se comparten entre dispositivos. La capa de cálculo está separada y puede sustituirse por una API Python más adelante; esta entrega calcula K-Means localmente en TypeScript y no incluye backend.

### Fase 5: Verificar y entregar

La suite automatizada cubre reglas de clientes, asignación de grupos, reproducibilidad, Silhouette, codo, rango de K y exclusión de datos inválidos. Para repetir la verificación:

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
	modules/evaluation/ModelEvaluation.tsx # Comparación y calidad estadística
	modules/recommendations/Recommendations.tsx
	services/customerService.ts         # Validación y persistencia
	services/clusteringCore.ts          # Núcleo K-Means y distancias compartidas
	services/segmentationService.ts     # Servicio compatible para segmentación manual
	services/modelEvaluationService.ts  # Inercia, Silhouette y estimación del codo
	types/evaluation.ts                 # Contratos de la evaluación
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
- La tarjeta de calidad clasifica Silhouette en rangos visuales orientativos: bajo 0,25 débil; 0,25–0,50 limitado; 0,50–0,70 razonable; sobre 0,70 marcado. No son garantías de calidad para todos los dominios.
- El análisis usa solo tres variables de compra. No representa todas las preferencias, contexto ni comportamiento de cada cliente.

## Decisiones y límites

- Se seleccionó cálculo local en TypeScript para que la práctica funcione sin configurar otro servidor. `segmentationService` concentra la lógica para facilitar su reemplazo por una API con scikit-learn.
- Se usa Recharts en un chunk cargado al abrir **Evaluación del modelo**, para mantener más ligero el arranque del resto de la aplicación.
- `localStorage` es apropiado para una práctica local, pero no para datos comerciales reales ni para colaboración entre usuarios.
- Las recomendaciones son reglas sencillas basadas en valores relativos; deben probarse con resultados de campañas antes de tomar decisiones de negocio.
- El proyecto no incluye importación CSV, autenticación, base de datos compartida ni API Python.
