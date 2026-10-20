# Nova | Sistema modular de segmentación de clientes

Aplicación para Comercial Nova: permite mantener una base de clientes, descubrir grupos mediante K-Means y explorar ideas comerciales a partir de sus promedios. La interfaz está hecha con React + TypeScript y la segmentación se ejecuta obligatoriamente en una API Python con FastAPI y scikit-learn. Los datos se guardan en el navegador.

## Avance del proyecto

| Fase | Resultado | Estado |
|---|---|---|
| 1. Preparación | Proyecto Vite, React, TypeScript y estructura modular | Completa |
| 2. Datos y K-Means | Datos de ejemplo, validación, persistencia y servicio de clustering | Completa |
| 3. Aplicación inicial | Panel, clientes, segmentación y recomendaciones | Completa |
| 4. Evaluación del modelo | Silhouette, método del codo, comparación de K y recomendación | Completa |
| 5. Exploración e interpretación | PCA, perfiles, comparación y distancias por segmento | Completa |
| 6. Pruebas y documentación | Pruebas automatizadas, compilación y guía de uso | Completa |

## Requisitos y ejecución

- Node.js 20 o posterior y npm.
- Python 3.10 o posterior.

Inicia el backend en una terminal:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r api/requirements.txt
python -m uvicorn api.main:app --reload --port 8000
```

En otra terminal, inicia la interfaz:

```bash
npm install
npm run dev
```

Vite mostrará una URL local para abrir la aplicación. Los datos de clientes y el último resultado se conservan en `localStorage` de ese navegador.
La interfaz reenvía las llamadas `/api` al backend. La documentación interactiva de la API está disponible en `http://127.0.0.1:8000/docs`.

## Comandos disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo
npm run typecheck  # Revisa tipos TypeScript
npm test           # Ejecuta pruebas automatizadas
npm run build      # Genera la aplicación para producción
python -m unittest discover -s api/tests -v  # Pruebas del backend (con .venv activado)
```

## Guía fase por fase

### Fase 1: Preparar la aplicación

Vite sirve la aplicación y React presenta la interfaz. TypeScript define contratos para clientes, grupos y resultados. La navegación y el estado compartido viven en `src/app/`; cada pantalla tiene su propio módulo.

Para estudiar esta fase, empieza por `src/main.tsx`, que monta React, y continúa por `src/app/App.tsx`, que reúne navegación, estado y módulos.

### Fase 2: Gestionar datos y ejecutar K-Means

`src/data/sampleCustomers.ts` carga los 12 registros ficticios del enunciado. `src/services/customerService.ts` valida, crea, actualiza y guarda clientes. El código debe ser único; gasto, visitas y antigüedad deben ser finitos y no negativos.

`src/services/segmentationService.ts` valida el rango de K y envía los clientes válidos a `POST /api/segmentation/run`. El endpoint está implementado en `api/main.py`; valida la entrada con Pydantic y delega el cálculo en `api/segmentation.py`:

1. Recibe gasto acumulado, visitas de los últimos seis meses y antigüedad; el nombre e identificador no se usan como variables del modelo.
2. Estandariza las tres variables con `StandardScaler` para que la escala monetaria no domine las distancias.
3. Ejecuta `KMeans` de scikit-learn con diez semillas reproducibles y conserva el resultado con menor inercia.
4. Devuelve asignaciones, centroides estandarizados, distancias y promedios en las unidades originales.
5. La interfaz completa perfiles comerciales, PCA y umbrales de posibles valores atípicos con esos resultados.

K se puede elegir entre 2 y 5. La API es un requisito para ejecutar la segmentación; si no está disponible, la interfaz informa el error y no calcula K-Means localmente.

### Fase 3: Explorar el sistema

- **Panel principal:** total de clientes, gasto promedio, visitas promedio y estado del último análisis.
- **Clientes:** alta, edición, búsqueda y eliminación con confirmación. Si existe un análisis, los cambios recalculan automáticamente los grupos con el mismo K; si el recálculo no es posible, se limpian las asignaciones antiguas.
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

### Fase 5: Explorar e interpretar segmentos

Después de ejecutar **Segmentación**, abre **Explorador de segmentos**. Esta pantalla utiliza las asignaciones, centroides y datos PCA conservados por esa misma ejecución. Si se cambia algún cliente, el resumen y los datos derivados se recalculan automáticamente con el mismo K. Los análisis guardados antes de esta fase no contienen PCA; el explorador pide recalcularlos en vez de fabricar coordenadas.

#### PCA 2D para visualización

PCA recibe la misma matriz estandarizada que recibió K-Means. Calcula la matriz de covarianza, obtiene sus vectores propios con Jacobi y proyecta clientes y centroides sobre los dos componentes con mayor varianza:

```text
PCj = (x estandarizado - media) · vector propio j
Varianza explicada PCj = autovalor j / suma de autovalores · 100
```

Los ejes del scatter muestran el porcentaje explicado. El PCA solo reduce dimensiones para visualizar: el algoritmo, las asignaciones y las distancias siguen calculándose en las variables estandarizadas originales. En datos constantes o sin varianza útil la pantalla lo indica, no sugiere una separación visual inexistente.

#### Perfiles y diferencias

Para cada grupo se calcula la media original de gasto, visitas y antigüedad, su cantidad de clientes, el promedio global y la diferencia relativa:

```text
Diferencia porcentual = (media del grupo / media global - 1) · 100
```

Si la media global vale cero, la diferencia no aplica. Los niveles alto/medio/bajo usan bandas orientativas de 15% por encima/debajo de la media; los nombres de perfil son resúmenes estadísticos, no etiquetas individuales. La tabla permite ordenar por perfil, tamaño, medias o diferencias.

#### Distancias y posibles atípicos

La distancia de cada cliente se obtiene de la misma solución K-Means:

```text
distancia(i) = sqrt(Σⱼ (xᵢⱼ estandarizado - centroideⱼ del grupo)²)
```

El percentil se calcula frente a las distancias de clientes del mismo grupo. Un registro se presenta como **Posible comportamiento atípico** cuando está en la cola superior al percentil 95 y el segmento tiene al menos cinco clientes. En grupos más pequeños se muestra que la muestra no basta para aplicar ese umbral. Es una señal para revisar, no una conclusión de fraude ni una anomalía real.

El detalle de segmento incluye su perfil, porcentaje de la base procesada, medias/centroide en unidades originales, diferencias, distancias, dispersión cuadrática y clientes del grupo. Se puede abrir el detalle de un cliente desde la lista de atípicos o desde los puntos del gráfico, y saltar a recomendaciones comerciales.

Los datos de clientes se guardan en el navegador, por lo que no se comparten entre dispositivos. La segmentación principal se calcula en la API Python. La pantalla de evaluación compara configuraciones de K localmente con el núcleo TypeScript compartido; no sustituye el resultado de la API usado por la segmentación y el explorador.

### Fase 6: Verificar y entregar

Las pruebas del frontend cubren reglas de clientes, integración HTTP, Silhouette, codo, PCA, perfiles, distancias y recomendaciones personalizadas por grupo. Las pruebas Python cubren validación del contrato, asignaciones y reproducibilidad. Para repetir la verificación, activa primero el entorno virtual del backend y ejecuta:

```bash
npm test
npm run typecheck
npm run build
python -m unittest discover -s api/tests -v
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
	modules/segment-explorer/             # PCA, perfiles, detalle y atípicos
		SegmentExplorer.tsx
		SegmentDetail.tsx
		components/
			PcaScatterChart.tsx
			SegmentComparisonTable.tsx
			SegmentProfileCard.tsx
			PotentialOutliers.tsx
			CustomerDetailDialog.tsx
	modules/recommendations/Recommendations.tsx
	services/customerService.ts         # Validación y persistencia
	services/clusteringCore.ts          # Núcleo TypeScript para evaluación del modelo
	services/segmentationService.ts     # Cliente HTTP y resultados derivados de la API
	services/modelEvaluationService.ts  # Inercia, Silhouette y estimación del codo
	services/pcaService.ts              # Proyección PCA y varianza explicada
	services/segmentProfileService.ts   # Diferencias y nombres interpretativos
	services/outlierService.ts          # Percentiles de distancias intragrupo
	services/recommendationService.ts   # Acciones personalizadas por segmento
	types/evaluation.ts                 # Contratos de la evaluación
	types/index.ts                      # Modelos compartidos
api/
	main.py                             # Endpoints FastAPI y documentación OpenAPI
	models.py                           # Validación y contratos de entrada/salida
	segmentation.py                     # Estandarización y K-Means con scikit-learn
	requirements.txt                    # Dependencias obligatorias del backend
	tests/test_segmentation.py          # Pruebas del servicio Python
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
| 10 | Cambiar clientes después de segmentar | Se recalculan automáticamente las asignaciones, los perfiles y las recomendaciones |
| 11 | Ejecutar K-Means y abrir Explorador de segmentos | Aparecen puntos coloreados, centroides y porcentajes PCA |
| 12 | Seleccionar otra fila de comparación | Cambia el detalle y resalta el perfil correspondiente |
| 13 | Ordenar por diferencia de gasto, visitas o antigüedad | Los segmentos se reordenan por la métrica seleccionada |
| 14 | Abrir un cliente marcado como posible atípico | Se muestra su distancia, percentil y ficha individual |
| 15 | Editar un cliente después de segmentar | Se limpian las asignaciones, distancias y resumen previo |

## Conceptos para interpretar los resultados

- Es aprendizaje no supervisado: los registros no tienen una etiqueta previa de segmento.
- K-Means forma grupos por proximidad; no predice categorías conocidas como lo haría un clasificador supervisado.
- Las etiquetas `Grupo 1`, `Grupo 2`, etc. son identificadores técnicos. La interpretación se hace después observando cantidad y promedios.
- K cambia el nivel de detalle: un K menor produce grupos más amplios; uno mayor divide más la base y puede dificultar la interpretación.
- **Segmentación** ejecuta K-Means; **Evaluación del modelo** compara K estadísticamente; **Explorador de segmentos** ayuda a interpretar una ejecución ya realizada.
- PCA es una proyección 2D con pérdida de información; la distancia visual entre puntos no sustituye la distancia al centroide original.
- Las posibles observaciones atípicas se basan en distancia relativa dentro del grupo y no son etiquetas de fraude.
- La tarjeta de calidad clasifica Silhouette en rangos visuales orientativos: bajo 0,25 débil; 0,25–0,50 limitado; 0,50–0,70 razonable; sobre 0,70 marcado. No son garantías de calidad para todos los dominios.
- El análisis usa solo tres variables de compra. No representa todas las preferencias, contexto ni comportamiento de cada cliente.

## Decisiones y límites

- La segmentación principal requiere FastAPI y scikit-learn; Vite reenvía `/api` al backend local. La evaluación comparativa de K conserva un núcleo TypeScript separado.
- Se usa Recharts en un chunk cargado al abrir **Evaluación del modelo**, para mantener más ligero el arranque del resto de la aplicación.
- `localStorage` es apropiado para una práctica local, pero no para datos comerciales reales ni para colaboración entre usuarios.
- Las recomendaciones son reglas sencillas basadas en valores relativos; deben probarse con resultados de campañas antes de tomar decisiones de negocio.
- El proyecto no incluye importación CSV, autenticación ni base de datos compartida.
