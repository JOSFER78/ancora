# ⚓ 07 · Handoff Final para el Desarrollador — Áncora Clinical Engine

**Ubicación:** `docs/architecture/07_handoff.md`  
**Estado:** Listo para Desarrollo y Despliegue  
**Destinatario:** Ingenieros Full-Stack, Desarrolladores Mobile (Capacitor) y Especialistas en IA Clínica

---

## 1. Resumen de la Arquitectura Entregada

La suite de arquitectura desacoplada de Áncora queda completamente especificada, validada y documentada en los siguientes 6 archivos canónicos:

```
docs/architecture/
│
├── 01_spec.md                 <-- Definición del problema, diagnóstico de Capacitor/Firebase y 4 capas.
├── 02_research.md             <-- Firestore Bundles, Vector Search nativo, Cloud Functions v2 y costes.
├── 03_adr.md                  <-- Architectural Decision Records (SQLite Outbox, Budgeting, XML Sandwich).
├── 04_contracts.md            <-- Contratos TypeScript/Zod para las 4 capas y Firestore Security Rules.
├── 05_implementation_plan.md   <-- Hoja de ruta técnica de 14 fases (Fase 0 a 13) con validación Zero-Mocks.
└── 07_handoff.md              <-- Guía de inicio rápido, variables de entorno y comandos para el desarrollador.
```

---

## 2. Variables de Entorno Requeridas (`.env`)

```env
# Configuración del Motor de Memoria Cognitiva Áncora
VITE_COGNITIVE_MEMORY_ENGINE_VERSION=3.1.0
VITE_MEMORY_ENGINE_ENABLED=true
VITE_SEMANTIC_CONSOLIDATION_ENABLED=true
VITE_CLINICAL_DIRECTIVES_ENABLED=true
VITE_FIREBASE_PERSISTENCE_ENABLED=true

# Seguridad y Cero Persistencia
VITE_ZERO_RAW_AUDIO_ENFORCED=true
VITE_CIRCUIT_BREAKER_024_ENABLED=true
VITE_EMERGENCY_PHONE_SPAIN=024

# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=ancora-mind.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ancora-mind
VITE_FIREBASE_STORAGE_BUCKET=ancora-mind.appspot.com

# Endpoint del Servidor de Inferencia / Backend
VITE_CLINICAL_API_GATEWAY=https://europe-west1-ancora-mind.cloudfunctions.net
```

---

## 3. Comandos de Verificación y Testing

Para validar que el motor de memoria cognitiva cumple con todas las garantías matemáticas y criptográficas:

```bash
# 1. Ejecutar test suite del motor de memoria bi-temporal (19/19 tests)
node test_memory_engine_real.cjs

# 2. Validar reglas de seguridad de Firestore
firebase emulators:start --only firestore,auth

# 3. Compilar y comprobar tipos de TypeScript en Capacitor
npm run build
npx cap sync
```

---

## 4. Reglas de Oro Inviolables para Desarrolladores

1. **PROHIBICIÓN DE MOCKS:** Queda terminantemente prohibido reintroducir datos ficticios o arrays hardcodeados. Todo test debe usar el dataset real de `docs/04_dataset_pruebas_emilio/`.
2. **CERO DIAGNÓSTICO AUTÓNOMO:** La IA (Walter) jamás emite diagnósticos al paciente; solo recopila evidencias con citas textuales y asiste en contención somática autorizada.
3. **CIRCUIT BREAKER 024:** Ante cualquier indicio de ideación autolítica, el sistema debe suspender inmediatamente el diálogo ordinario y mostrar el panel de emergencia oficial con llamada al 024.
4. **INTEGRIDAD SHA-256:** Todo documento o nota de voz procesada debe registrar su huella criptográfica SHA-256 en la cadena inmutable de auditoría.
