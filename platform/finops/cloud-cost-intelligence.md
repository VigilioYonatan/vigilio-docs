# Inteligencia De Costos Cloud Y Prácticas FinOps

Establece las directrices de gobernanza financiera, asignación de costos, optimización de recursos y monitoreo continuo de gasto en la nube.

## Principios De Gobernanza FinOps

1. **Atribución Precisa del Gasto:** Cada recurso provisionado en AWS, Azure o Kubernetes debe incluir etiquetas obligatorias de metadatos:
   - `Owner`: Equipo responsable del recurso.
   - `Environment`: `dev`, `staging`, `prod` o `review`.
   - `CostCenter`: Código contable de la unidad de negocio.
   - `Project` o `Service`: Nombre canónico del microservicio.
2. **Visibilidad a Nivel de Pod con OpenCost:**
   En clústeres Kubernetes, se despliega OpenCost para calcular en tiempo real el costo exacto por namespace, deployment y solicitud de recursos (CPU, memoria, storage).

## Palancas Principales De Optimización

- **Adopción de Arquitectura ARM64 (AWS Graviton):** Las cargas de trabajo de NestJS, workers y microservicios se compilan para arquitecturas `linux/arm64`, obteniendo hasta un 20% de reducción de costes y un 40% de mejora en rendimiento frente a x86.
- **Orquestación de Nodos con Karpenter:** Consolidación automática de pods en menos instancias físicas y aprovechamiento inteligente de instancias Spot para workers asíncronos y cargas no críticas.
- **Optimización de Transferencia de Red y NAT Gateways:** El tráfico hacia S3, DynamoDB y servicios internos se enruta a través de VPC Gateway Endpoints gratuitos, eliminando el coste de procesamiento de datos por gigabyte en NAT Gateways.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Implementar políticas OPA en el pipeline de Terraform que rechacen la creación de recursos que carezcan de las etiquetas obligatorias de FinOps.
- ❌ **Incorrecto:** Dejar recursos en la nube sin etiquetar o aprovisionar instancias sobredimensionadas con baja utilización sostenida (< 10% CPU).
- ✅ **Correcto:** Establecer alertas de detección de anomalías de costos mediante AWS Cost Anomaly Detection con notificación automática a los leads técnicos.
- ❌ **Incorrecto:** Enterarse de un gasto imprevisto o fuga de recursos semanas después al recibir la factura mensual consolidada.
