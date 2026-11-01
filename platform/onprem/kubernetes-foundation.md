# Fundación De Kubernetes On-Premise Y Edge

Define la arquitectura, componentes de red CNI, almacenamiento distribuido y gobernanza para clústeres Kubernetes desplegados en centros de datos locales (On-Premise) y entornos Edge.

## Arquitectura Base On-Premise

Para entornos corporativos donde no se cuenta con servicios gestionados como AWS EKS, la arquitectura de plataforma implementa componentes estandarizados y auditados:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes On-Premise                    │
├──────────────────────────────┬──────────────────────────────┤
│ Control Plane (etcd + API)   │ Distribución: K3s / RKE2      │
├──────────────────────────────┼──────────────────────────────┤
│ Red y CNI                    │ Cilium con eBPF (sin kube-pr)│
├──────────────────────────────┼──────────────────────────────┤
│ Balanceo de Carga L4/L7      │ MetalLB (BGP/L2) + Ingress   │
├──────────────────────────────┼──────────────────────────────┤
│ Almacenamiento CSI           │ Longhorn / Rook-Ceph         │
├──────────────────────────────┼──────────────────────────────┤
│ Gestión de Certificados      │ cert-manager con CA interna  │
├──────────────────────────────┼──────────────────────────────┤
│ Seguridad en Runtime         │ Tetragon (eBPF) + Kyverno    │
└──────────────────────────────┴──────────────────────────────┘
```

## Componentes Esenciales De Infraestructura

1. **CNI Basado en eBPF con Cilium:** Reemplazo integral de `kube-proxy` mediante eBPF para balanceo de alto rendimiento, cifrado transparente WireGuard entre nodos y aplicación estricta de NetworkPolicies L3/L4/L7.
2. **Exposición L4 con MetalLB:** Provisión de direcciones IP virtuales (VIPs) en subredes locales para servicios tipo `LoadBalancer`, operando en modo BGP con los switches core del datacenter o en modo Layer 2.
3. **Almacenamiento Persistente Confiable:** Uso de drivers CSI como Longhorn o Rook-Ceph para replicación de bloques sincronizada entre nodos físicos, garantizando alta disponibilidad ante caídas de hardware.
4. **Gobierno de Certificados con cert-manager:** Emisión y renovación automática de certificados TLS internos mediante HashiCorp Vault o la CA institucional.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Emplear Cilium con modo eBPF nativo para obtener visibilidad profunda de tráfico y aislamiento granular entre namespaces.
- ❌ **Incorrecto:** Utilizar configuraciones por defecto de `kube-proxy` con tablas iptables gigantestas que degradan el rendimiento bajo alta concurrencia.
- ✅ **Correcto:** Replicar volúmenes persistentes en al menos 3 nodos físicos distintos para soportar fallos de hipervisor sin pérdida de datos.
- ❌ **Incorrecto:** Confiar en `hostPath` o volúmenes locales no replicados para bases de datos transaccionales en producción on-premise.
