# ⚓ 01 · Especificación Arquitectónica del Motor Clínico Áncora (Human-in-the-Loop AI)

**Ubicación:** `docs/architecture/01_spec.md`  
**Estado:** Aprobado / Fase de Diseño y Planificación  
**Autor:** Antigravity 2.0 Master Architect & Clinical Systems Engineer  
**Dataset de Validación:** Emilio Real Dataset (`docs/04_dataset_pruebas_emilio/`) — Cero Mocks

---

## 1. Definición del Problema Clínico y Técnico

La psicoterapia contemporánea adolece de un punto ciego crítico: **la pérdida de contexto, adherencia y contención emocional en el intervalo de 7 a 15 días que transcurre entre sesiones presenciales**. 
- El paciente sufre picos de ansiedad, parálisis ejecutiva, distorsiones cognitivas o conductas impulsivas en soledad.
- Cuando acude a la siguiente sesión, el sesgo de retrospección (*recall bias*) y la vergüenza provocan que el 70% de los incidentes somáticos y conductuales no se relaten con fidelidad.
- El psicólogo carece de datos objetivos para monitorizar la evolución real del paciente.

### 🔴 Los 3 Peligros de la "IA como Terapeuta" Tradicional:
1. **Intrusismo y Falta de Responsabilidad Sanitaria:** La IA no es médico ni psicólogo colegiado; no puede emitir diagnósticos ni asumir responsabilidad legal.
2. **Complacencia Artificial (*Sycophancy*):** Los LLMs genéricos tienden a dar la razón al paciente o validar conductas impulsivas destructivas (ej. justificar una recaída o apostar en bolsa).
3. **Amnesia Catastrófica y Pérdida de Antecedentes:** Los sistemas RAG tradicionales olvidan traumas infantiles o antecedentes farmacológicos debido a curvas de decaimiento destructivas.

---

## 2. La Solución Áncora: Arquitectura Desacoplada en 4 Capas

Áncora redefine la relación Paciente-IA-Psicólogo estructurándola en **4 capas estrictamente desacopladas**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│               CAPA 4: SUPERVISIÓN HUMANA (PSICÓLOGO - PACIENTE)             │
│   - Aprobación/Rechazo HITL de diagnósticos e hipótesis clínicas.           │
│   - Nivel de Autoridad N1 (Máxima precedencia clínica).                     │
│   - Firma de notas SOAP y envío de Video-Briefings asíncronos.              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Directivas Clínicas N1)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│             CAPA 3: INTERFAZ TERAPÉUTICA (IA - PSICÓLOGO CLÍNICO)           │
│   - Smart SOAP Drafts automatizados basados en evidencia verbatim.          │
│   - Dashboard Patient 360 y Árbol Vital con valencia y prominencia.         │
│   - Circuit Breakers y Alertas Rojas de Riesgo (024 / 112).                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Extracción Semántica & Cuarentena N4)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│           CAPA 2: SINCRONIZACIÓN DE ARCHIVOS (FILE-BASED CONTEXT)           │
│   - Almacenamiento estructurado Markdown/JSON con Hashes SHA-256.           │
│   - Protocolo TUS Resumable Uploads en Capacitor + SQLite Outbox Pattern.    │
│   - Persistencia inmutable en Google Cloud Firestore y RGPD Art. 9.         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Working Memory Buffer & Ingesta)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│               CAPA 1: INGESTA Y CONTEXTO (PACIENTE - IA / WALTER)           │
│   - Escucha activa, contención somática y registro diario guiado.           │
│   - Dynamic Context Budgeting elástico (4.096 tokens).                      │
│   - Nivel de Autoridad N3 (Expresión subjetiva fenoménica).                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Diagnóstico Riguroso de la Base de Código Actual (`ancora_repo`)

### A. Configuración de Build y Plataformas Nativas (Capacitor v8)
- **`capacitor.config.json`:** `appId: "com.ayudatra.app"`, `appName: "WebAyudaTra"`, `webDir: "dist"`.  
  *Acción requerida:* Unificar `appId` a `"com.ancora.health"` y `appName` a `"Áncora"` para sincronizar con los builds de producción Android/iOS.
- **`android/app/build.gradle`:** SDK target 36, AndroidX Activity 1.11.0. Configuración preparada para `google-services.json`.

### B. Inventario y Brecha de Plugins de Capacitor

| Plugin | Estado | Diagnóstico Técnico | Solución de Arquitectura |
| :--- | :---: | :--- | :--- |
| **`@capacitor/app`** | 🟢 Instalado | Manejo de evento `backButton` en Android en `src/App.jsx`. | Mantenido para control de navegación. |
| **`@capacitor/filesystem`** | 🔴 Ausente | Carga de archivos solo en RAM vía FileReader Web. | **Instalar** para soporte de chunks locales TUS. |
| **`@capacitor/preferences`** | 🔴 Ausente | Persistencia basada en `localStorage` (vulnerable a purga por OS). | **Instalar** para reemplazo por SharedPreferences / UserDefaults. |
| **`@capacitor-community/sqlite`**| 🔴 Ausente | No existe cola de sincronización transaccional local. | **Instalar** para implementar el **SQLite Outbox Pattern**. |
| **`@capacitor/network`** | 🔴 Ausente | Sin detección reactiva de transiciones `online`/`offline`. | **Instalar** para reanudación automática de sync. |

### C. Persistencia y Capa de Abstracción de Almacenamiento (SAL)
El repositorio ya cuenta con una arquitectura de persistencia limpia desacoplada:
- **`IMemoryRepository.js`:** Contrato formal de métodos CRUD y búsqueda bi-temporal.
- **`SupabaseMemoryAdapter.js`:** Adaptador para PostgreSQL / Edge Functions (`chat-terapeuta`, `clinical-synthesize`).
- **`FirestoreMemoryAdapter.js`:** Adaptador preparado para Google Cloud Firestore v9 modular multitenant (`patients/{id}/semanticProfile/current`, `directives`, `auditLogs`).

---

## 4. Jerarquía de Autoridad Epistemológica (N1 a N4)

Ningún dato entra a la base de datos sin un sello de autoridad explícito:

1. **Nivel 1 (N1) — Validado por Psicólogo Colegiado:** 100% de confianza. Diagnósticos formales, pautas de intervención y directivas clínicas activas.
2. **Nivel 2 (N2) — Documentado en Informes Médicos:** 90-95% de confianza. Informes psiquiátricos previos, pruebas psicométricas y analíticas con hash SHA-256.
3. **Nivel 3 (N3) — Declarado por el Paciente:** Expresión subjetiva en el chat diario o diario emocional. No constituye prueba diagnóstica.
4. **Nivel 4 (N4) — Inferencia IA (Cuarentena):** Borrador exploratorio de hipótesis generado por el LLM. Requiere validación del psicólogo para elevarse a N1.
