# 13 · Auditoría funcional de la web actual y plan de mejora

## 1. Nota de alcance actualizada

En la v2 esta auditoría era funcional porque todavía no se había inspeccionado el repositorio. En la v4 se ha revisado el `.zip` subido (`ancora-main.zip`) y se confirma que la web existe como prototipo React/Vite/Firebase con pantallas reales, Edge Functions y migraciones clínicas, pero todavía no está organizada como producto sanitario robusto.

La conclusión es clara:

> El repo contiene muchas piezas prometedoras, pero no analiza ni estructura los datos clínicos con la profundidad, trazabilidad y seguridad necesarias para que Áncora sea diferencial.

## 2. Diagnóstico general

El producto actual parece una mezcla de:

- landing premium;
- portal paciente;
- portal psicólogo;
- consola admin;
- chat con IA;
- diario emocional;
- pruebas personales de terapia/trading;
- herramientas de agentes;
- Firebase real;
- funciones IA en Edge;
- documentos internos dentro del repo.

Esto provoca que la intención de Áncora se diluya. El usuario debe sentir que entra en una plataforma clínica de continuidad terapéutica. Hoy el repo todavía transmite demo, laboratorio y producto personal mezclados.

## 3. Lo que sí debe conservarse

- La visión de Áncora como plataforma Human-in-the-Loop.
- La landing con doble ruta paciente/psicólogo.
- La idea de marketplace/directorio de psicólogos.
- Los roles paciente, psicólogo y supervisor/admin.
- El módulo Patient 360 del psicólogo.
- `clinicalEngine.js` como primer SDK frontend de expediente clínico.
- `clinical-ingest` como primer pipeline de ingesta.
- `clinical-synthesize` como primer intento de memoria Hermes clínica.
- Las tablas `clinical_documents`, `document_extractions`, `clinical_proposals`, `clinical_facts`, `timeline_events`, `medications`, `risk_events`, `clinical_profiles`, `clinical_life_tree`, `patient_context_snapshots`.

## 4. Lo que debe cambiar radicalmente

### 4.1 Separar demo de producto real

El repo tiene datos mock y perfiles hardcodeados mezclados con Firebase real. Eso sirve para enseñar una demo, pero no para construir un producto sanitario. Deben existir tres modos separados:

1. `demo` con datos ficticios;
2. `staging` con usuarios de prueba y datos sintéticos;
3. `production` sin mocks, sin localStorage clínico y sin datos personales.

### 4.2 Eliminar o aislar módulos personales/no sanitarios

Aparecen módulos de trading, BingX, deudas, INSS, scripts personales, “Emilio”, “Walter” y componentes de viabilidad financiera. Aunque algunos tengan valor como caso de prueba psicológico, no deben estar dentro del producto sanitario general.

Recomendación:

- mover todo eso a `/archive/personal-lab` o a otro repo privado;
- conservar solo ejemplos sintéticos anonimizados;
- prohibir que el motor clínico estable consolide reglas financieras o material operativo como memoria clínica.

### 4.3 Corregir la contradicción privacidad-local vs OpenRouter

La narrativa dice IA local/servidores propios, pero las Edge Functions llaman a OpenRouter. Eso no es necesariamente malo para prototipo, pero contradice la promesa comercial.

Solución documental y técnica:

- MVP: `Model Gateway` agnóstico con proveedores intercambiables.
- Producción sanitaria: proveedor local/privado europeo o on-prem.
- UI/copy: no prometer “100% local” mientras el código use OpenRouter.
- Legal: consentimiento explícito si se usan terceros.

### 4.4 Corregir modelo de roles

La migración inicial restringe `profiles.role` a `emilio` y `supervisor`, pero la app usa `paciente`, `psicologo`, `admin` y `supervisor`. Esto es una inconsistencia crítica.

Roles target:

```sql
role in ('patient','psychologist','clinic_admin','platform_admin','dpo','support','superadmin')
```

En frontend puede mostrarse como `paciente`, `psicólogo`, `admin`, pero la base debe usar valores canónicos.

### 4.5 Rehacer Patient 360 alrededor de datos reales

`PsicologoDashboardView.jsx` contiene una buena dirección UX, pero mezcla mocks con datos reales. Hay que convertirlo en pantalla real conectada a endpoints:

- resumen 30 segundos;
- cambios desde última sesión;
- riesgos activos;
- citas literales;
- timeline;
- documentos;
- propuestas IA;
- validaciones;
- SOAP;
- tareas;
- medicación;
- consentimientos.

### 4.6 Convertir Edge Functions en backend serio

Las Edge Functions actuales son útiles como prototipo, pero deben dejar de ser scripts grandes. Hay que separar:

- `authz.ts`;
- `modelGateway.ts`;
- `documentParser.ts`;
- `clinicalExtractor.ts`;
- `riskDetector.ts`;
- `proposalService.ts`;
- `snapshotService.ts`;
- `auditLogger.ts`.

## 5. Fallos críticos por severidad

### P0 — Seguridad / credenciales / privacidad

- Firebase URL y anon key hardcodeadas en `src/firebaseClient.js` y scripts.
- `.env.example` incluye datos reales de proyecto.
- Uso de `Firebase_SERVICE_ROLE_KEY` en Edge Functions correcto solo si nunca llega al cliente, pero hay que auditar logs.
- CORS `*` en funciones clínicas.
- Promesa de IA local contradicha por OpenRouter.
- El repo contiene documentos y datos personales/sensibles de prueba.

### P1 — Arquitectura

- `App.jsx` funciona como router, auth manager, layout, permisos y estado global a la vez.
- Componentes de más de 4000 líneas.
- Estado clínico mezclado en localStorage, mocks y Firebase.
- RLS parcial y migraciones no alineadas.
- No hay separación clara `domain/application/infrastructure/ui`.

### P2 — Producto

- La web comunica muchas cosas, pero la promesa central todavía no manda: “memoria terapéutica viva”.
- El paciente ve chat y pantallas; debe ver “mi historia se ordena sola”.
- El psicólogo ve panel; debe ver “me ahorro 20 minutos antes de cada sesión”.
- Falta un flujo de validación paciente → psicólogo → memoria consolidada.

## 6. Nueva definición de éxito

El repo estará bien cuando pueda demostrarse este flujo completo con datos reales o sintéticos:

1. Paciente sube un informe.
2. Sistema extrae texto.
3. IA crea propuestas con citas literales.
4. Paciente puede confirmar o rectificar datos declarados.
5. Psicólogo valida datos clínicos.
6. Patient 360 se actualiza.
7. Chat recupera memoria correcta.
8. Antes de sesión, el psicólogo ve un briefing de dos minutos.
9. Después de sesión, se genera SOAP borrador.
10. Todo queda auditado y con niveles de autoridad.
