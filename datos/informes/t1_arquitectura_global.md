# T1 — ARQUITECTURA GLOBAL MULTI-PSICÓLOGO PARA ANCORA (ancora.clinic)

**Versión:** 1.0
**Fecha:** 2026-05-31
**Propósito:** Documento técnico de arquitectura para plataforma multi-tenant de telepsicología híbrida con IA local en GPU propia + psicólogos humanos en el loop.
**Base:** Informes previos en `anchora1.0.md`, `informe_ancora2.0.md`, `evolucion_tecnica_ancora.md`.

---

## ÍNDICE

1. [MODELO MULTI-TENANT](#1-modelo-multi-tenant)
2. [IMPORTACIÓN DE PACIENTES](#2-importación-de-pacientes)
3. [CANALIZACIÓN DE LEADS](#3-canalización-de-leads)
4. [VISTAS POR ROL](#4-vistas-por-rol)
5. [ARQUITECTURA BACKEND ESCALABLE](#5-arquitectura-backend-escalable)
6. [IA MULTI-TENANT](#6-ia-multi-tenant)

---

## 1. MODELO MULTI-TENANT

### 1.1 Comparativa de Estrategias de Aislamiento

| Estrategia | Aislamiento | Coste Operativo | Escalabilidad | Cumplimiento RGPD | Complejidad |
|---|---|---|---|---|---|
| **Base de datos separada** | Total (físico/lógico) | Alto (N servidores) | Baja (operaciones N instancias) | Maximo | Alta |
| **Schema-per-tenant** | Lógico (esquemas en misma DB) | Medio (1 cluster, N schemas) | Media (hasta ~5000 tenants) | Alto | Media |
| **Row-Level Security (RLS)** | Fila (políticas por tenant_id) | Bajo (1 DB, 1 schema) | Alta (millones de filas) | Medio-alto | Baja |

**Tabla comparativa detallada:**

```
+----------------------------------+-------------------+---------------------+-------------------+
| Aspecto                          | Schema-per-Tenant | RLS (1 schema)     | DB Separada       |
+----------------------------------+-------------------+---------------------+-------------------+
| Aislamiento físico               | NO                | NO                  | SI                |
| Aislamiento lógico               | FUERTE            | CONFIANZA EN RLS    | TOTAL             |
| Migraciones                      | N por tenant      | 1 global            | N por tenant      |
| Backup/Restore por tenant        | Schema-level      | Fila-level (complejo)| DB-level (simple) |
| Latencia cross-tenant queries    | NO (imposible)    | SI (filtrada)       | NO (imposible)    |
| Pool de conexiones eficiente     | SI (1 pool)       | SI (1 pool)         | NO (N pools)      |
| Coste infra para 100 tenants     | ~1 servidor       | ~1 servidor         | ~10 servidores    |
| Cifrado Zero-Knowledge           | Compatible        | Compatible          | Compatible        |
+----------------------------------+-------------------+---------------------+-------------------+
```

### 1.2 Recomendación para Ancora: Híbrido Schema-per-Tenant + RLS + ZK

Para Ancora, la arquitectura óptima es **híbrida**:

**Capa 1: Schema-per-tenant para datos clínicos sensibles.**
Cada psicólogo (tenant) tiene su propio esquema PostgreSQL: `tenant_<uuid>`. Dentro de cada esquema:
- `pacientes`, `sesiones`, `notas_soap`, `diarios`, `mensajes_chat`
- Cada tabla tiene `tenant_id` como columna (redundancia de seguridad).

**Capa 2: RLS como defensa en profundidad.**
Políticas RLS activadas en cada tabla que verifican `current_setting('app.tenant_id') = tenant_id`. Esto asegura que incluso en errores de código, una consulta no pueda filtrar datos entre tenants.

```sql
-- Política RLS genérica para tablas clínicas
CREATE POLICY tenant_isolation ON pacientes
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- La sesión de BD se configura así en cada request
SET app.tenant_id = '550e8400-e29b-41d4-a716-446655440000';
```

**Capa 3: Schema compartido para datos no sensibles.**
Un schema `public` compartido contiene:
- `usuarios_global` (login, roles, tenant_id)
- `psicologos_publicos` (directorio, perfil público)
- `facturacion` (pagos, Stripe Connect)

### 1.3 Cifrado Zero-Knowledge (ZK) Multi-Tenant

Cada tenant tiene un **Key Encryption Key (KEK)** propio, cifrado con una clave maestra del sistema (HSM). El flujo:

```
[Cliente]                             [Servidor PostgreSQL]
   |                                         |
   |-- Login con password ------------------>|
   |                                         |-- Deriva KEK con Argon2id
   |<-- Nonce + salt ------------------------|
   |                                         |
   |-- (Cliente) Deriva Data Key (DK)        |
   |   DK = HKDF(KEK, tenant_salt)           |
   |                                         |
   |-- Cifra mensaje con AES-256-GCM + DK -->|  Almacena BYTEA cifrado
   |                                         |  (no puede descifrar)
   |<-- BYTEA cifrado -----------------------|
```

**Claves por tenant almacenadas en tabla separada:**

```sql
CREATE TABLE tenant_keys (
  tenant_id UUID PRIMARY KEY,
  kek_encrypted BYTEA NOT NULL,     -- KEK cifrado con clave maestra HSM
  kek_salt BYTEA NOT NULL,
  kek_kdf_params JSONB,              -- Argon2id params (memoria, iteraciones)
  rotation_version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ
);
```

**La clave maestra del sistema** vive en un HSM (Azure Key Vault o HashiCorp Vault). Rotación automática cada 90 días con re-cifrado de KEKs.

### 1.4 Matriz de Aislamiento por Tipo de Dato

| Tipo de Dato | Schema | Cifrado | RLS | Backup |
|---|---|---|---|---|
| Diarios emocionales (chat IA) | Schema tenant | AES-256-GCM + DK | SI | Cifrado en reposo |
| Notas SOAP (validadas psicólogo) | Schema tenant | AES-256-GCM + DK | SI | Backup inmutable WORM |
| Mensajes chat grupal (Duo/Familiar) | Schema tenant | E2EE (clave grupo) | SI | Cifrado, no descifrable |
| Perfil público psicólogo | Schema public | Sin cifrado (datos públicos) | NO | Backup regular |
| Facturación / Stripe | Schema public | Tokenización Stripe | tenant_id | Backup con retención fiscal |
| Logs de auditoría | Schema public | Hash chain inmutable | NO | Append-only WORM |

---

## 2. IMPORTACIÓN DE PACIENTES

### 2.1 Flujo General de Incorporación de Pacientes

```
                    ┌─────────────────────────────────────┐
                    │     PSICÓLOGO EN PANEL ANCORA        │
                    │  (ya verificó credenciales + KYC)     │
                    └──────────┬──────────────────────────┘
                               │
              ┌────────────────┼────────────────────┐
              ▼                ▼                     ▼
     ┌────────────┐   ┌──────────────┐   ┌──────────────────┐
     │ Invitación │   │ Código QR    │   │ CSV/Excel masivo │
     │ Email/SMS  │   │ (presencial) │   │ (lote pacientes)  │
     └──────┬─────┘   └──────┬───────┘   └────────┬─────────┘
            │                │                     │
            ▼                ▼                     ▼
     ┌──────────────────────────────────────────────────────┐
     │           TOKEN DE INVITACIÓN (JWT cifrado)          │
     │         payload: tenant_id, paciente_id, exp         │
     │         cifrado con KEK del tenant                  │
     └──────────────────────┬───────────────────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  PACIENTE ACEPTA       │
               │  - Verifica identidad  │
               │  - Crea KEK personal   │
               │  - Firma consentimiento │
               │  - Onboarding guiado   │
               └────────────────────────┘
```

### 2.2 Invitación por Email/SMS con Enlace Mágico

**Token de invitación (backend):**

```javascript
// Generación del token mágico
const jwt = require('jsonwebtoken');

function generateMagicLink(tenantId, patientEmail) {
  const payload = {
    type: 'patient_invite',
    tenant_id: tenantId,
    email: patientEmail,
    nonce: crypto.randomBytes(16).toString('hex'),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 3600)  // 7 días
  };

  // Ciframos el payload con la KEK del tenant
  const encryptedToken = encryptWithTenantKEK(
    JSON.stringify(payload),
    tenantId
  );

  return Buffer.from(encryptedToken).toString('base64url');
}
```

**Email template:**

```
Asunto: [Psicólogo] te ha invitado a Ancora — Tu espacio de terapia

Hola [Nombre],

Tu psicólogo/a [NombrePsicólogo] te ha invitado a unirte a su espacio
en Ancora, la plataforma de terapia con seguimiento continuo.

Para aceptar la invitación y comenzar tu historia psicológica:

[ BOTÓN: ACEPTAR INVITACIÓN ]
https://ancora.clinic/invitacion?token=abc123...xyz

Este enlace es de uso único y expira en 7 días.

¿Qué incluye?
- Diario guiado para registrar tu semana
- Chat con IA de acompañamiento (cifrado extremo a extremo)
- Preparación estructurada para tus sesiones
- Historial portable que no se pierde

Tu privacidad está protegida: todos tus datos se procesan en servidores
locales cifrados. Ningún dato sale de España.
```

**Flujo de validación del token:**

```
1. Paciente hace clic en enlace
2. Frontend POST /api/invitations/validate { token }
3. Backend descifra token con KEK del tenant
4. Verifica:
   - Firma válida
   - No expirado
   - No revocado (check en tabla invitation_revocations)
   - Email coincide con sesión actual (si ya logueado)
5. Si ok: crea relación paciente-psicólogo en tenant schema
6. Redirige a onboarding
```

### 2.3 Código QR Único

**Generación desde panel del psicólogo:**

```javascript
// Endpoint: GET /api/psychologist/qr-code
async function generateQRCode(tenantId) {
  const sessionToken = await createTemporarySession({
    tenant_id: tenantId,
    type: 'qr_scan',
    expires_in: '15m',  // QR rota cada 15 minutos por seguridad
    max_uses: 1,
    uses: 0
  });

  const qrPayload = {
    v: 1,
    t: 'psych_invite',
    ts: tenantId.substring(0, 8),  // prefijo de tenant
    s: sessionToken.shortCode,
    h: sessionToken.hmac          // HMAC para verificación offline
  };

  // Codificar como URL: ancora://invite?data=base64(qrPayload)
  return `ancora://invite?d=${Buffer.from(JSON.stringify(qrPayload)).toString('base64')}`;
}
```

**Escenario de uso:**

1. Psicólogo abre panel -> "Invitar paciente" -> "Mostrar QR"
2. El QR se regenera cada 15 minutos automáticamente (rotación temporal)
3. Si el QR se escanea pero el paciente no completa el registro en 15 min, expira
4. Paciente escanea -> abre app/web -> vincula automáticamente al psicólogo
5. El QR contiene nonce + HMAC para prevenir escaneos fraudulentos

**API de verificación:**

```
POST /api/invitations/qr-verify
Body: { qr_data: "ancora://invite?d=..." }
Response: {
  psicologo: { nombre, foto_url, especialidad },
  invitacion: { id, expires_in_seconds },
  patient_token: "jwt..."  // pre-autenticado para onboarding
}
```

### 2.4 Subida CSV/Excel Masiva

**Formato del CSV:**

```csv
nombre,email,telefono,notas,enfoque_preferido
Ana García,ana@email.com,+34600111222,"Ansiedad social","TCC"
Carlos Ruiz,carlos@email.com,+34600333444,"Terapia de pareja","Sistémico"
Maria López,maria@email.com,+34600555666,"Depresión leve","ACT"
```

**Pipeline de procesamiento:**

```
1. Psicólogo sube CSV via POST /api/invitations/batch
2. Backend valida cabeceras y filas
3. Se procesa en lotes de 50 mediante BullMQ (cola batch-invitations)
4. Por cada fila:
   a. Validación de email/telefono (formato)
   b. Checksum contra pacientes existentes (evitar duplicados)
   c. Generación de token individual
   d. Enqueue para envío (email o SMS según disponibilidad)
5. Respuesta inmediata con resumen:
   {
     total: 150,
     validos: 148,
     duplicados: 2,
     errores: 0,
     batch_id: "uuid"
   }
6. Webhook en frontend cuando el batch se complete
```

**Worker de batch:**

```typescript
// cola: batch-invitations
// consumers: 4 workers concurrentes
async function processBatchInvitation(job: Job) {
  const { row, tenantId, batchId } = job.data;

  // 1. Validar
  const exists = await db.query(
    `SELECT id FROM ${tenantId}.pacientes WHERE email = $1`,
    [row.email]
  );
  if (exists) return { status: 'duplicate', email: row.email };

  // 2. Crear paciente pendiente
  const patientId = crypto.randomUUID();
  await db.query(
    `INSERT INTO ${tenantId}.pacientes_pendientes
     (id, nombre, email, telefono, notas, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [patientId, row.nombre, row.email, row.telefono, row.notas, tenantId]
  );

  // 3. Generar token
  const token = generateMagicLink(tenantId, row.email);

  // 4. Enviar según canal disponible
  if (row.email) {
    await emailQueue.add('send-invite', { to: row.email, token, tenantId });
  }
  if (row.telefono) {
    await smsQueue.add('send-invite', { to: row.telefono, token, tenantId });
  }

  return { status: 'queued', email: row.email, token_preview: token.substring(0, 8) + '...' };
}
```

### 2.5 Enlace Público para Autoregistro

**URL estructurada:** `https://ancora.clinic/psicologo/dr-garcia`

**Modelo de slug por psicólogo:**

```sql
CREATE TABLE public.psicologos_perfiles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  slug VARCHAR(100) UNIQUE NOT NULL,      -- "dr-garcia"
  nombre_publico VARCHAR(200) NOT NULL,    -- "Dr. Juan García"
  titulos VARCHAR(500),                    -- "Psicólogo General Sanitario (MPGS)"
  especialidades TEXT[],                   -- ["TCC", "Ansiedad", "Depresión"]
  experiencia_anos INT,
  precio_sesion DECIMAL(10,2),
  bio TEXT,
  foto_url VARCHAR(500),
  video_presentacion_url VARCHAR(500),
  disponibilidad JSONB,                    -- Horarios semanales
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_psicologos_slug ON public.psicologos_perfiles(slug);
```

**Flujo de autoregistro:**

```
Paciente visita: ancora.clinic/psicologo/dr-garcia
                    │
                    ▼
      ┌────────────────────────────┐
      │  LANDING PÚBLICA           │
      │  - Foto, bio, experiencia  │
      │  - Enfoques terapéuticos   │
      │  - Precios                 │
      │  - Testimonios (no clínicos)│
      │  - CTA: "Empezar terapia"  │
      └───────────┬────────────────┘
                  │
                  ▼
      ┌────────────────────────────┐
      │  REGISTRO EXPRESS          │
      │  - Nombre, email           │
      │  - Password (deriva KEK)   │
      │  - Consentimiento explícito│
      │  (Art. 9 RGPD)            │
      └───────────┬────────────────┘
                  │
                  ▼
      ┌────────────────────────────┐
      │  PRE-TRIAJE (PHQ-9 / GAD-7)│
      │  - Cribado automático      │
      │  - Si riesgo alto:         │
      │    pantalla de crisis +    │
      │    derivación a 024/112    │
      └───────────┬────────────────┘
                  │
                  ▼
      ┌────────────────────────────┐
      │  VINCULACIÓN CON           │
      │  PSICÓLOGO SELECCIONADO    │
      │  - Crea relación en schema │
      │  - Notifica al psicólogo   │
      │  - Activa plan de prueba   │
      │  (7 días diario IA +       │
      │   1 sesión de encuadre)    │
      └────────────────────────────┘
```

### 2.6 API REST para Integración con Clínicas

**Endpoints públicos (con API Key de clínica):**

```
POST   /api/v1/integration/patients          - Crear paciente y enviar invitación
GET    /api/v1/integration/patients/:id       - Estado de invitación
POST   /api/v1/integration/patients/batch     - Importación masiva
DELETE /api/v1/integration/patients/:id       - Revocar invitación
GET    /api/v1/integration/patients/report    - Reporte de adopción
```

**Autenticación:** API Key + HMAC firmado:

```typescript
// Firma de request
function signRequest(apiKey: string, secret: string, body: string, timestamp: string) {
  const message = `${timestamp}.${apiKey}.${body}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// Headers requeridos
Headers: {
  'X-API-Key': 'ancora_sk_live_xxxxxxxxx',
  'X-Timestamp': new Date().toISOString(),
  'X-Signature': 'hmac_sha256_hex'
}
```

**Ejemplo de integración (Python):**

```python
import requests, hmac, hashlib, json

API_KEY = "ancora_sk_live_clinica_xxx"
API_SECRET = b"supersecreto123"

def invite_patient(nombre, email, telefono=""):
    timestamp = datetime.utcnow().isoformat()
    body = json.dumps({
        "nombre": nombre,
        "email": email,
        "telefono": telefono,
        "invitacion_tipo": "email",  # email | sms | ambos
        "mensaje_personalizado": f"Tu psicóloga {nombre_psic} te espera en Ancora"
    })
    signature = hmac.new(API_SECRET, f"{timestamp}.{API_KEY}.{body}".encode(), hashlib.sha256).hexdigest()

    resp = requests.post(
        "https://api.ancora.clinic/v1/integration/patients",
        headers={
            "X-API-Key": API_KEY,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
            "Content-Type": "application/json"
        },
        data=body
    )
    return resp.json()

# Usar para integración con software de clínica (ej. Clinikae, Doctoralia API)
resultado = invite_patient("Ana García", "ana@clinica.com", "+34600111222")
```

---

## 3. CANALIZACIÓN DE LEADS

### 3.1 Directorio de Psicólogos con Filtros

**Modelo de datos del directorio público:**

```sql
-- Vista pública (solo psicólogos activos con perfil completo)
CREATE VIEW public.directorio_psicologos AS
SELECT
  pp.id,
  pp.slug,
  pp.nombre_publico,
  pp.foto_url,
  pp.titulos,
  pp.especialidades,
  pp.experiencia_anos,
  pp.bio,
  pp.precio_sesion,
  pp.disponibilidad,
  -- Métricas agregadas (sin datos clínicos)
  COALESCE(pr.puntuacion_media, 0) as puntuacion_media,
  COALESCE(pr.num_resenas, 0) as num_resenas,
  COALESCE(pr.tasa_respuesta, 0) as tasa_respuesta
FROM public.psicologos_perfiles pp
LEFT JOIN public.psicologos_reputacion pr ON pp.id = pr.psicologo_id
WHERE pp.activo = true;
```

**Endpoints de filtrado:**

```
GET /api/v1/directorio
  ?especialidad=TCC,Ansiedad
  &precio_min=40
  &precio_max=80
  &experiencia_min=5
  &genero=femenino
  &idioma=espanol,ingles
  &disponibilidad=lunes_manana,miercoles_tarde
  &orden=puntuacion
  &pagina=1
  &limite=20
```

**Respuesta paginada:**

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "dra-maria-lopez",
      "nombre": "Dra. Maria López",
      "foto": "https://cdn.ancora.clinic/psicologos/uuid_foto.webp",
      "titulos": "Psicóloga General Sanitaria (MPGS nº M-12345)",
      "especialidades": ["TCC", "Ansiedad", "Depresión"],
      "experiencia": 12,
      "precio": 60,
      "puntuacion": 4.8,
      "resenas": 34,
      "disponibilidad": { "lunes": ["09:00-13:00", "16:00-20:00"], "martes": [...] },
      "badges": ["Verificado COP", "Respuesta < 2h", "Enfoque TCC"]
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "filters_activos": {
    "especialidad": ["TCC", "Ansiedad"]
  }
}
```

### 3.2 Sistema de Matching (Algoritmo vs Libre Elección)

**Modelo híbrido con dos modos:**

#### Modo A: Libre Elección (recomendado, 80% de usuarios)

El paciente navega el directorio, filtra, y selecciona manualmente. La plataforma ofrece **recomendaciones inteligentes** basadas en:

- Especialidad declarada por el paciente en el triaje
- Preferencias de precio, género, y horario
- Experiencia en problemas similares
- Disponibilidad actual

**Algoritmo de ranking (sin ser caja negra):**

```
Score(paciente, psicologo) =
  w1 * match_especialidad(psicologo.especialidades, paciente.necesidades)
+ w2 * (1 - abs(psicologo.precio - paciente.precio_max) / paciente.precio_max)
+ w3 * match_disponibilidad(psicologo.disponibilidad, paciente.horarios)
+ w4 * match_genero(psicologo.genero, paciente.preferencia_genero)
+ w5 * psicologo.puntuacion / 5.0
+ w6 * (psicologo.experiencia / 30)  // normalizado a [0,1]
```

Donde `w1..w6 = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10]` (pesos configurables por psicólogo).

#### Modo B: Matching Asistido (opcional, para indecisos)

1. Paciente completa triaje extendido (PHQ-9 + GAD-7 + preferencias)
2. Algoritmo asigna top-3 psicólogos compatibles
3. Paciente revisa perfiles y elige
4. Matching no es vinculante: puede cambiar en cualquier momento

**Restricción regulatoria:** El paciente SIEMPRE tiene la última elección. No hay asignación automática sin consentimiento.

### 3.3 Flujo de Onboarding para Paciente Nuevo

```
FASE 1: REGISTRO
    │
    ├── Si viene por invitación (psicólogo conocido):
    │   - Valida token mágico / QR
    │   - Pre-vinculado al psicólogo
    │   - Solo necesita crear su KEK (Argon2id)
    │   - Firma consentimiento informado
    │
    ├── Si viene por autoregistro (slug público):
    │   - Ya seleccionó psicólogo en el directorio
    │   - Registro + KEK + vinculación directa
    │
    └── Si viene sin psicólogo definido:
        - Registro básico (email + password)
        - Deriva KEK del password
        - Pasa a Fase 2

FASE 2: TRIAJE (PHQ-9 + GAD-7)
    │
    ├── Cuestionario interactivo (IA guía)
    ├── 9 preguntas PHQ-9 (Depresión)
    ├── 7 preguntas GAD-7 (Ansiedad)
    │
    ├── Resultado RIESGO BAJO/LEVE:
    │   - Continua a Fase 3
    │
    ├── Resultado RIESGO MODERADO:
    │   - Continua a Fase 3
    │   - + Recomendación de sesión síncrona temprana
    │
    └── Resultado RIESGO GRAVE/CRÍTICO:
        - Pantalla de crisis (protocolo kill-switch)
        - Números de emergencia (024, 112)
        - Bloqueo de onboarding
        - Notificación a psicólogo (si está vinculado)
        - Derivación a recursos presenciales

FASE 3: SELECCIÓN DE PSICÓLOGO (si no tiene)
    │
    ├── Directorio filtrado por resultados de triaje
    ├── Recomendaciones IA (top 3)
    ├── Previsualización de perfiles
    └── Selección y vinculación

FASE 4: PLAN DE TRATAMIENTO INICIAL
    │
    ├── Configuración de plan (Esencial / Intermedio / Intensivo)
    ├── Stripe Connect: pago de matrícula (49€ promo)
    ├── Stripe Connect: suscripción recurrente
    ├── Split automático: psicólogo ↔ plataforma
    │
    └── PRIMERA SEMANA:
        - 7 días de diario guiado (chat IA)
        - 1 sesión de encuadre con psicólogo (60 min)
        - Generación de historia psicológica inicial
```

---

## 4. VISTAS POR ROL

### 4.1 Panel Psicólogo (Clinical Dashboard)

```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO]  ANCORA · Panel Clínico          [Notificaciones] ⏰ │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  RESUMEN DEL DÍA                                        ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   ││
│  │  │ 12   │ │ 3    │ │ 5    │ │ 2    │                   ││
│  │  │Pacien│ │Citas │ │Revis.│ │Alert.│                   ││
│  │  │activos│ │hoy   │ │pend. │ │crisis│                   ││
│  │  └──────┘ └──────┘ └──────┘ └──────┘                   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌───────────┬─────────────┬────────────┬──────────────────┐│
│  │ PACIENTE  │ ÚLTIMA      │ PRÓXIMA    │ ALERTAS          ││
│  │           │ ACTIVIDAD   │ CITA       │                  ││
│  ├───────────┼─────────────┼────────────┼──────────────────┤│
│  │ Ana G.    │ Hoy 09:15   │ Lun 16:00  │ 🔴 Crisis leve  ││
│  │           │ (diario)    │ (video)    │ detectada        ││
│  ├───────────┼─────────────┼────────────┼──────────────────┤│
│  │ Carlos R. │ Ayer 22:30  │ Mar 11:00  │ 🟡 Patrón de    ││
│  │           │ (audio 2min)│ (revisión) │ rumiación        ││
│  ├───────────┼─────────────┼────────────┼──────────────────┤│
│  │ Maria L.  │ Hoy 07:45   │ Mié 18:30  │ 🟢 Sin alertas   ││
│  │           │ (diario)    │ (video)    │                  ││
│  └───────────┴─────────────┴────────────┴──────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  CALENDARIO SEMANAL                                     ││
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐           ││
│  │  │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │           ││
│  │  │ 3c  │ 2c  │ 4c  │ 1c  │ 3c  │ —   │ —   │           ││
│  │  │1rev │2rev │1rev │3rev │1rev │     │     │           ││
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘           ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  VISTA RAW-FIRST (Paciente seleccionado: Ana G.)        ││
│  │                                                          ││
│  │  [NIVEL 1: DATOS CRUDOS — SIN SESGO IA]                 ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │ "Hoy me he sentido abrumada en el trabajo.          │ ││
│  │  │  No he podido concentrarme en nada."               │ ││
│  │  │  — Diario: 31/05/2026 09:15                        │ ││
│  │  │                                                     │ ││
│  │  │ Sueño: 5.2h (↓ 23% vs media semanal)               │ ││
│  │  │ Ánimo reportado: 3/10                              │ ││
│  │  │ Ejercicio: No                                      │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  [NIVEL 2: ANÁLISIS IA — BLOQUEADO]                    ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  [GLASSMORPHISM — Desbloquear para ver análisis]   │ ││
│  │  │  [ Desbloquear Análisis IA — Requiere revisar     │ ││
│  │  │    datos crudos primero (5min mínimo) ]           │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  [NIVEL 3: DISONANCIA]                                  ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │ Paciente reporta: "Estoy bien, sin novedades"      │ ││
│  │  │ Marcadores objetivos:                              │ ││
│  │  │   - Sueño: 4.1h (↓ 38%)                            │ ││
│  │  │   - HRV: 28ms (↓ 45%)                              │ ││
│  │  │   - Ánimo reportado: 3/10                          │ ││
│  │  │ ⚠ DISONANCIA DETECTADA                             │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  SOAP (Subjetivo, Objetivo, Análisis, Plan)             ││
│  │                                                          ││
│  │  S: [Pre-llenado por IA] "Paciente reporta ansiedad     ││
│  │     laboral, insomnio y falta de concentración..."      ││
│  │                                                          ││
│  │  O: [Pre-llenado por IA] PHQ-9: 14/27 (moderado).      ││
│  │     GAD-7: 12/21 (moderado). Sueño: 5.2h media.        ││
│  │                                                          ││
│  │  A: [Editable por psicólogo]                             ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  ________________________________________________  │ ││
│  │  │  ________________________________________________  │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  P: [Editable por psicólogo]                             ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  ________________________________________________  │ ││
│  │  │  ________________________________________________  │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  [ Firmar y Enviar ] con PIN de 4 dígitos               ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  FACTURACIÓN                                             ││
│  │  ┌──────┬──────────┬──────────┬──────────┬───────────┐  ││
│  │  │ Mes  │ Pacientes│ Ingresos │ Comisión │ Neto      │  ││
│  │  ├──────┼──────────┼──────────┼──────────┼───────────┤  ││
│  │  │ Mayo │ 12       │ 960€     │ 468€     │ 492€      │  ││
│  │  │ Abr  │ 10       │ 800€     │ 390€     │ 410€      │  ││
│  │  └──────┴──────────┴──────────┴──────────┴───────────┘  ││
│  │  Stripe Connect: [Ver Dashboard] [Exportar facturas]    ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Panel Paciente

```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO]  Bienvenida, Ana                        [🔔] [⚙️]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  MI HISTORIA PSICOLÓGICA                                ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  📅 Línea de Tiempo                                │ ││
│  │  │                                                     │ ││
│  │  │  ───●────●────●────●────●────●────●────●────      │ ││
│  │  │     Sem1 Sem2 Sem3 Sem4 Sem5 Sem6 Sem7 Sem8       │ ││
│  │  │      ↑                                      ↑      │ ││
│  │  │   Inicio terapia                     Última sesión │ ││
│  │  │                                                     │ ││
│  │  │  Progreso: ████████░░░░ 65%                        │ ││
│  │  │  Ánimo medio: 4.2/10 → 6.8/10 (+2.6)              │ ││
│  │  │  Sesiones completadas: 6 de 8                      │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  DIARIO EMOCIONAL (HOY)                                  ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  ¿Cómo te sientes hoy?                             │ ││
│  │  │                                                     │ ││
│  │  │  [😢] [🙁] [😐] [🙂] [😊]   → Seleccionado: 😐    │ ││
│  │  │                                                     │ ││
│  │  │  ¿Qué ha pasado hoy?                               │ ││
│  │  │  ┌────────────────────────────────────────────┐   │ ││
│  │  │  │ He tenido una discusión con mi pareja y    │   │ ││
│  │  │  │ me siento frustrada... no sé cómo          │   │ ││
│  │  │  │ manejar estas situaciones...               │   │ ││
│  │  │  └────────────────────────────────────────────┘   │ ││
│  │  │                                                     │ ││
│  │  │  [Enviar]   (Te quedan 12 min de IA hoy)          │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  RESPUESTA DE IA (vía DeepSeek-R1-70B en GPU local)│ ││
│  │  │                                                     │ ││
│  │  │  <thought>                                          │ ││
│  │  │  La paciente reporta frustración post-conflicto    │ ││
│  │  │  de pareja. Identifico posible patrón de           │ ││
│  │  │  comunicación no asertiva. La emoción base         │ ││
│  │  │  parece ser tristeza/impotencia más que ira.       │ ││
│  │  │  </thought>                                         │ ││
│  │  │                                                     │ ││
│  │  │  "Entiendo que te sientas frustrada. Las           │ ││
│  │  │  discusiones de pareja suelen activar patrones     │ ││
│  │  │  de comunicación que no siempre reflejan lo que    │ ││
│  │  │  realmente queremos expresar.                       │ ││
│  │  │                                                     │ ││
│  │  │  ¿Has notado alguna señal física antes de que       │ ││
│  │  │  comenzara la discusión? (tensión en hombros,      │ ││
│  │  │  respiración acelerada...)                          │ ││
│  │  │                                                     │ ││
│  │  │  📝 Nota para tu psicóloga: Esta entrada ha sido   │ ││
│  │  │  marcada para revisión en tu próxima sesión.      │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  PRÓXIMAS SESIONES                                       ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  📅 Lun 02 Jun — 16:00 — Videollamada (45 min)    │ ││
│  │  │     con Dra. María López                           │ ││
│  │  │     Temas: Comunicación asertiva                    │ ││
│  │  │     [Unirme] [Reprogramar]                         │ ││
│  │  │                                                     │ ││
│  │  │  📅 Vie 06 Jun — Revisión asíncrona                │ ││
│  │  │     Tu psicóloga revisará tu diario semanal        │ ││
│  │  │     y te dejará un video-briefing                  │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  PROGRESO Y RECURSOS                                     ││
│  │  ┌──────┬──────┬──────┐  ┌──────────────────────────┐   ││
│  │  │Ánimo │Sueño │Ejer. │  │  Recursos recomendados   │   ││
│  │  │ 6/10 │ 5.2h │ No   │  │  - Ejercicio respiración │   ││
│  │  │ ↗25% │ ↘23% │ —    │  │  - Hoja de comunicación  │   ││
│  │  └──────┴──────┴──────┘  │  asertiva (validado por  │   ││
│  │                           │  tu psicóloga)           │   ││
│  │                           └──────────────────────────┘   ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Panel Admin (Supervisión Global)

```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO]  ANCORA · Administración              [Advertencias] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  MÉTRICAS GLOBALES DEL SISTEMA                           ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       ││
│  │  │ 47      │ │ 1,234   │ │ 89.2%   │ │ 12.3%  │       ││
│  │  │Psicólog.│ │Pacientes│ │Retención│ │Churn   │       ││
│  │  │activos  │ │activos  │ │(30d)    │ │mensual │       ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  GPU CLUSTER STATUS                                      ││
│  │  ┌────────────┬──────┬────────┬────────┬───────────┐   ││
│  │  │ Servidor   │ GPU  │ VRAM   │ Temp   │ Slots     │   ││
│  │  ├────────────┼──────┼────────┼────────┼───────────┤   ││
│  │  │ ancora-gpu1│ 0    │ 89%    │ 72°C   │ 9/10 oc.  │   ││
│  │  │ ancora-gpu1│ 1    │ 92%    │ 68°C   │ 9/10 oc.  │   ││
│  │  │ ancora-gpu2│ 0    │ 45%    │ 55°C   │ 4/10 oc.  │   ││
│  │  │ ancora-gpu2│ 1    │ 41%    │ 53°C   │ 4/10 oc.  │   ││
│  │  └────────────┴──────┴────────┴────────┴───────────┘   ││
│  │  [Scale Up] [Balance Load] [View Logs]                  ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  PAGOS Y COMPLIANCE                                      ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  Ingresos del mes: 48,234€                        │ ││
│  │  │  Pending payouts: 23,890€ (49 psicólogos)        │ ││
│  │  │  Stripe Connect fees: 723€                        │ ││
│  │  │                                                     │ ││
│  │  │  ┌────────┬────────┬────────┬────────┬──────────┐ │ ││
│  │  │  │ ID     │Psicólogo│Pacientes│ Ingreso│ Payout  │ │ ││
│  │  │  ├────────┼────────┼────────┼────────┼──────────┤ │ ││
│  │  │  │ t-001  │Dra. L. │ 12     │ 960€   │ 468€     │ │ ││
│  │  │  │ t-002  │Dr. G.  │ 8      │ 640€   │ 312€     │ │ ││
│  │  │  │ t-003  │Dr. M.  │ 15     │ 1.200€ │ 585€     │ │ ││
│  │  │  └────────┴────────┴────────┴────────┴──────────┘ │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │  AUDITORÍA Y LOGS INMUTABLES                      │ ││
│  │  │  ┌──────┬───────────┬──────────┬────────────────┐ │ ││
│  │  │  │ Hora │ Usuario   │ Acción   │ Hash Check     │ │ ││
│  │  │  ├──────┼───────────┼──────────┼────────────────┤ │ ││
│  │  │  │09:15 │ p-ana-g   │ read     │ 0x7F3A...B1C2 │ │ ││
│  │  │  │      │           │ diario   │ ✓ Valido      │ │ ││
│  │  │  │09:17 │ p-ana-g   │ read     │ 0x9E12...D4F5 │ │ ││
│  │  │  │      │           │ sesiones │ ✓ Valido      │ │ ││
│  │  │  └──────┴───────────┴──────────┴────────────────┘ │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  ALERTAS Y COMPLIANCE                                    ││
│  │  ┌──────────────────────────────────────────────────────┐││
│  │  │  🟢 Todos los psicólogos tienen seguro RC activo    │││
│  │  │  🟢 Licencias COP verificadas (última: hoy 06:00)   │││
│  │  │  🟢 Backup WORM completado (03:12, 12.4GB)          │││
│  │  │  🟡 3 psicólogos sin Stripe Connect configurado     │││
│  │  │  🔴 1 psicólogo con licencia por expirar (<7 días)  │││
│  │  └──────────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 5. ARQUITECTURA BACKEND ESCALABLE

### 5.1 Diagrama General de Arquitectura

```
                              ┌─────────────┐
                              │  DNS/Cloudflare │
                              │  (DDoS, WAF, SSL)│
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │  Nginx (L7) │
                              │  (Rate limit, │
                              │   SSL term) │
                              └──────┬───────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   │                 │                  │
                   ▼                 ▼                  ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │ API REST     │  │ WebSocket    │  │ IA Gateway   │
           │ (Express/    │  │ (Socket.io)  │  │ (FastAPI/    │
           │  NestJS)     │  │ (Chat real)  │  │  vLLM proxy) │
           └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                  │                 │                  │
                  ▼                 ▼                  ▼
           ┌──────────────────────────────────────────────┐
           │              REDIS CLUSTER                   │
           │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
           │  │ Cache  │ │ BullMQ │ │ Session│ │Rate  │ │
           │  │ tenant │ │ queues │ │ Store  │ │Limit │ │
           │  │prefix  │ │  x3    │ │        │ │      │ │
           │  └────────┘ └────────┘ └────────┘ └──────┘ │
           └──────────────────────────────────────────────┘
                  │                 │
                  ▼                 ▼
           ┌──────────────────────────────────────────────┐
           │         POSTGRESQL CLUSTER (Patroni)         │
           │  ┌────────────────┐ ┌──────────────────────┐ │
           │  │ Schema Public  │ │ Schema per Tenant    │ │
           │  │ (global)       │ │ (tenant_<uuid>)      │ │
           │  │ - usuarios     │ │ - pacientes          │ │
           │  │ - tenants      │ │ - sesiones           │ │
           │  │ - perfiles pub │ │ - diarios            │ │
           │  │ - facturacion  │ │ - notas_soap         │ │
           │  │ - logs         │ │ - mensajes           │ │
           │  └────────────────┘ └──────────────────────┘ │
           │  + RLS policies + cifrado BYTEA             │
           └──────────────────────────────────────────────┘
                  │
                  ▼
           ┌──────────────────────────────────────────────┐
           │        OBJECT STORAGE (S3/MinIO)            │
           │  ┌────────────────┐ ┌──────────────────────┐ │
           │  │ Documentos     │ │ Backups WORM        │ │
           │  │ (cifrados AES) │ │ (inmutables, cifr.) │ │
           │  │ - grabaciones  │ │ - diarios (increm)  │ │
           │  │ - fotos        │ │ - semanales (full)  │ │
           │  │ - documentos   │ │ - retención 5 años  │ │
           │  └────────────────┘ └──────────────────────┘ │
           └──────────────────────────────────────────────┘
```

### 5.2 API: REST vs GraphQL

**Decisión: REST como principal, GraphQL solo para consultas complejas del dashboard.**

| Aspecto | REST | GraphQL |
|---|---|---|
| **Endpoints** | ~80 endpoints | ~15 queries + mutations |
| **Caching** | Nativo (HTTP cache, CDN) | Complejo (persistir queries) |
| **Complejidad server** | Baja | Alta (resolvers, dataloaders) |
| **Complejidad client** | Alta (múltiples requests) | Baja (1 query) |
| **Rate limiting** | Por endpoint | Por query (cost analysis) |
| **Seguridad** | Natural (cada endpoint) | Compleja (query depth) |
| **Recomendado para** | CRUD, auth, subidas | Dashboards dinámicos |

**Uso en Ancora:**
- **95% REST**: Autenticación, pacientes, sesiones, facturación, directorio.
- **5% GraphQL**: Dashboard del psicólogo (múltiples fuentes agregadas en 1 query).

### 5.3 Endpoints Clave REST

```
# AUTENTICACIÓN
POST   /api/v1/auth/register               - Registro paciente
POST   /api/v1/auth/login                  - Login (deriva KEK)
POST   /api/v1/auth/refresh                - Refresh JWT
POST   /api/v1/auth/logout                 - Invalida refresh token
POST   /api/v1/auth/forgot-password        - Reset (pierde KEK)
POST   /api/v1/auth/reset-password         - Nuevo KEK

# PSICÓLOGOS (multi-tenant)
POST   /api/v1/psychologists/register       - Alta psicólogo (KYC)
GET    /api/v1/psychologists/profile        - Perfil privado
PUT    /api/v1/psychologists/profile        - Actualizar perfil público
POST   /api/v1/psychologists/verify         - Verificar colegiación

# PACIENTES (dentro del tenant)
GET    /api/v1/patients                     - Listar pacientes
GET    /api/v1/patients/:id                 - Detalle paciente
POST   /api/v1/patients                     - Crear paciente
POST   /api/v1/patients/:id/invite          - Enviar invitación
POST   /api/v1/patients/batch/import        - CSV masivo

# SESIONES
GET    /api/v1/sessions                     - Calendario sesiones
POST   /api/v1/sessions                     - Crear sesión
PUT    /api/v1/sessions/:id                 - Reprogramar
DELETE /api/v1/sessions/:id                 - Cancelar
POST   /api/v1/sessions/:id/start-video     - Iniciar WebRTC

# DIARIO / CHAT IA
POST   /api/v1/diary/entry                 - Crear entrada diario
GET    /api/v1/diary/history                - Historial diario
POST   /api/v1/diary/send-to-ai            - Enviar al LLM local

# NOTAS SOAP
GET    /api/v1/soap/patients/:id/latest     - Última nota SOAP
POST   /api/v1/soap/patients/:id            - Generar borrador IA
PUT    /api/v1/soap/:id                     - Actualizar (firmar)

# DIRECTORIO PÚBLICO
GET    /api/v1/directory                    - Listar psicólogos
GET    /api/v1/directory/:slug              - Perfil público

# FACTURACIÓN
GET    /api/v1/billing/plans                - Planes disponibles
POST   /api/v1/billing/subscribe            - Stripe checkout
GET    /api/v1/billing/invoices             - Historial facturas
POST   /api/v1/billing/cancel               - Cancelar suscripción

# ADMIN
GET    /api/v1/admin/metrics                - Métricas globales
GET    /api/v1/admin/gpu-status             - Estado GPU cluster
GET    /api/v1/admin/audit-log              - Logs de auditoría
POST   /api/v1/admin/backup/trigger         - Backup manual
```

### 5.4 Autenticación JWT con Roles y Permisos

**Estructura del token JWT:**

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "role": "patient",
  "tenant_id": "660e8400-e29b-41d4-a716-446655440001",
  "psychologist_id": null,
  "permissions": [
    "diary:read",
    "diary:write",
    "session:read",
    "session:write_own"
  ],
  "kek_salt": "a1b2c3d4e5f6...",
  "iat": 1717119600,
  "exp": 1717123200
}
```

**Roles y permisos:**

| Rol | Permisos clave |
|---|---|
| `superadmin` | * (sistema, BD, GPU, todos los tenants) |
| `admin` | Métricas globales, pagos, compliance, suspender psicólogos |
| `psychologist` | Schema de su tenant: pacientes, sesiones, SOAP, facturación propia |
| `patient` | Su propio diario, sesiones, progreso. Solo lectura de su psicólogo |
| `support` | Lectura limitada de logs, tickets, estado del sistema |

**Middleware de autorización:**

```typescript
function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Seteado por middleware JWT

    // Superadmin bypass
    if (user.role === 'superadmin') return next();

    // Verificar tenant context
    if (user.tenant_id !== req.headers['x-tenant-id']) {
      return res.status(403).json({ error: 'cross_tenant_access_denied' });
    }

    // Verificar permisos
    const hasPermission = requiredPermissions.every(
      p => user.permissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'insufficient_permissions' });
    }

    next();
  };
}

// Uso en endpoints
router.get(
  '/api/v1/patients/:id',
  authenticate,
  authorize('patient:read'),
  patientController.getById
);
```

**Refresh token rotation:**

- Access token: 30 min (corto, mínimo riesgo)
- Refresh token: 7 días (rotación con familia de tokens)
- KEK derivado del password: hasta logout o cambio de password

### 5.5 PostgreSQL: Esquema por Tenant + RLS

**Arquitectura de schemas:**

```sql
-- Schema global
CREATE SCHEMA public;
  -- Tablas globales: usuarios, tenants, perfiles, facturación, logs

-- Schema por tenant (creado en onboarding del psicólogo)
CREATE SCHEMA tenant_660e8400_e29b_41d4_a716_446655440001;
  -- Tablas clínicas aisladas

-- Función para crear schema de tenant
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', 'tenant_' || tenant_id);

  EXECUTE format('
    CREATE TABLE %I.pacientes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(200) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      telefono VARCHAR(20),
      fecha_alta TIMESTAMPTZ DEFAULT NOW(),
      activo BOOLEAN DEFAULT true,
      notas_cifradas BYTEA,           -- AES-256-GCM cifrado con KEK del paciente
      tenant_id UUID NOT NULL DEFAULT $1
    )', 'tenant_' || tenant_id, tenant_id);

  EXECUTE format('
    CREATE TABLE %I.sesiones (...)
  ', 'tenant_' || tenant_id);

  EXECUTE format('
    CREATE TABLE %I.diario_entries (
      id UUID PRIMARY KEY,
      paciente_id UUID NOT NULL REFERENCES %I.pacientes(id),
      contenido_cifrado BYTEA NOT NULL,
      tipo VARCHAR(20) DEFAULT ''texto'',  -- texto | audio | mood
      mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      tenant_id UUID NOT NULL
    )', 'tenant_' || tenant_id, 'tenant_' || tenant_id);

  -- RLS policies
  EXECUTE format('
    ALTER TABLE %I.diario_entries ENABLE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON %I.diario_entries
      USING (tenant_id = current_setting(''app.tenant_id'')::UUID);
  ', 'tenant_' || tenant_id, 'tenant_' || tenant_id);
END;
$$ LANGUAGE plpgsql;
```

**Pool de conexiones con PgBouncer:**

```ini
[databases]
* = host=127.0.0.1 port=5432 dbname=ancora

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 50
reserve_pool_size = 10
reserve_pool_timeout = 5.0
server_reset_query = DISCARD ALL
```

### 5.6 Redis por Tenant para Caché y Colas

**Estrategia de namespacing (prefijo por tenant):**

```
Redis Keys (prefijadas por tenant):
  cache:<tenant_id>:paciente:<id>           → JSON perfil paciente (TTL 5min)
  cache:<tenant_id>:stats:dashboard         → Dashboard stats (TTL 1min)
  rate:<tenant_id>:ia_requests:<patient_id> → Rate limit diario IA
  session:<tenant_id>:<patient_id>          → Estado chat en curso

BullMQ Queue Names:
  bull:ia-high-priority:<tenant_id>         → Chat IA tiempo real (prioridad alta)
  bull:ia-batch:<tenant_id>                 → Procesamiento nocturno (SOAP, RAG)
  bull:email:<tenant_id>                    → Emails transaccionales
  bull:notifications:<tenant_id>            → Notificaciones push
  bull:batch-invitations:<tenant_id>        → Invitaciones masivas CSV
```

**Ejemplo de rate limiting por tenant para IA:**

```typescript
// Cada paciente tiene 15 min/día de chat IA
const RATE_LIMIT_KEY = `rate:${tenantId}:ia_requests:${patientId}`;

async function checkIaQuota(tenantId: string, patientId: string): Promise<{
  allowed: boolean;
  remainingMinutes: number;
}> {
  const dailyBudget = 15 * 60; // 15 minutos en segundos
  const key = `rate:${tenantId}:ia_requests:${patientId}`;

  // Usar campo TTL de Redis para expiry a medianoche
  const used = await redis.get(key);
  const secondsUsed = used ? parseInt(used) : 0;
  const remaining = Math.max(0, dailyBudget - secondsUsed);

  return {
    allowed: remaining > 0,
    remainingMinutes: Math.floor(remaining / 60)
  };
}

// Cada request de IA consume ~30 segundos de cuota
async function consumeIaQuota(tenantId: string, patientId: string, seconds: number = 30) {
  const key = `rate:${tenantId}:ia_requests:${patientId}`;
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const ttl = Math.floor((midnight.getTime() - Date.now()) / 1000);

  await redis.incrby(key, seconds);
  await redis.expire(key, ttl); // Expira a medianoche UTC+2
}
```

### 5.7 Almacenamiento Cifrado de Sesiones y Documentos

**Documentos almacenados:**

| Tipo | Almacenamiento | Cifrado | Retención |
|---|---|---|---|
| Grabaciones WebRTC | S3-compatible (MinIO) | AES-256-GCM (clave por paciente) | 5 años (Ley 41/2002) |
| Fotos perfil | S3-compatible (MinIO) | Sin cifrar (públicas) | Mientras activo |
| Documentos clínicos | S3-compatible (MinIO) | AES-256-GCM (KEK del paciente) | 5 años post-baja |
| Backups DB | S3 Glacier + MinIO | AES-256 (clave maestra HSM) | 5 años (WORM) |

**Cifrado de archivos en cliente (navegador):**

```javascript
// Cliente: cifrar antes de subir
async function encryptFile(file, patientKek) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    'raw', patientKek, { name: 'AES-GCM' }, false, ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    file
  );

  return {
    encryptedBlob: new Blob([iv, new Uint8Array(encrypted)]),
    metadata: {
      algorithm: 'AES-256-GCM',
      iv: Array.from(iv),
      originalType: file.type,
      size: file.size
    }
  };
}

// Servidor: almacena ciegamente
app.post('/api/v1/documents/upload', async (req, res) => {
  // req.file ya viene cifrado desde el cliente
  const s3Key = `${req.user.tenantId}/documents/${uuidv4()}.enc`;
  await s3.putObject({
    Bucket: 'ancora-clinical-docs',
    Key: s3Key,
    Body: req.file.buffer,
    Metadata: { tenantId: req.user.tenantId, patientId: req.params.patientId }
  });
  res.json({ s3Key });
});
```

### 5.8 Estrategia de Backups (Incrementales Diarios, WORM)

```
HORARIO DE BACKUPS
                   
  00:00 ─── Backup FULL semanal (domingo) ───→ S3 Glacier (WORM)
                   Retención: 12 semanas
                   Política: Object Lock en modo Compliance (5 años)
                   Inmutable: ni el admin root puede borrar

  03:00 ─── Backup INCREMENTAL diario ──────→ MinIO local + S3
                   Retención: 30 días
                   Archivos .sql.gz cifrados con AES-256

  04:00 ─── Backup WAL (cada 5 min) ────────→ S3 Standard
                   Retención: 7 días
                   Permite Point-In-Time Recovery

  05:00 ─── Backup DOCUMENTOS ──────────────→ S3 Glacier (WORM)
                   Retención: 5 años mínimo (cumplimiento LOPD)
```

**Configuración de WORM (Object Lock) con AWS S3:**

```bash
# Backup semanal con Object Lock Compliance Mode
aws s3api put-object-lock-configuration \
  --bucket ancora-backups-clinicos \
  --object-lock-configuration '{
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "COMPLIANCE",
        "Days": 1825  # 5 años
      }
    }
  }'

# Subir backup con retención explícita
aws s3 cp ancora_weekly_20260531.sql.gz.gpg \
  s3://ancora-backups-clinicos/weekly/ \
  --object-lock-mode COMPLIANCE \
  --object-lock-retain-until-date "2031-05-31T00:00:00Z"
```

**Script de backup con pg_dump por tenant:**

```bash
#!/bin/bash
# backup_diario.sh — Backup incremental por schema

BACKUP_DIR="/mnt/backups/incremental"
DATE=$(date +%Y%m%d_%H%M)
TENANTS=$(psql -t -c "SELECT schema_name FROM information_schema.schemata
                      WHERE schema_name LIKE 'tenant_%'")

for tenant in $TENANTS; do
  # Cifrar con clave del HSM
  pg_dump -n "$tenant" ancora | gzip | \
    gpg --encrypt --recipient BACKUP_MASTER_KEY \
    > "$BACKUP_DIR/${tenant}_${DATE}.sql.gz.gpg"
done

# Subir a S3 con WORM
aws s3 cp "$BACKUP_DIR/" "s3://ancora-backups-clinicos/incremental/" \
  --recursive \
  --object-lock-mode COMPLIANCE \
  --object-lock-retain-until-date $(date -d "+30 days" +%Y-%m-%dT%H:%M:%SZ)
```

**Crypto-shredding (baja definitiva de paciente):**

```sql
-- En lugar de borrar datos físicos, destruimos la clave
DELETE FROM tenant_keys WHERE tenant_id = $1 AND paciente_id = $2;
-- Todos los BYTEA cifrados pasan a ser indescifrables irreversiblemente
-- Los backups WORM aún existen, pero son ilegibles = cumplimiento legal
```

---

## 6. IA MULTI-TENANT

### 6.1 Arquitectura de Inferencia Compartida con Aislamiento

```
                      ┌─────────────────────────────────┐
                      │     CLUSTER GPU LOCAL            │
                      │  (Dual RTX 4090 — 48GB VRAM)     │
                      │  vLLM con Tensor Parallelism TP=2│
                      └──────────────┬──────────────────┘
                                     │
                    ┌────────────────┼──────────────────┐
                    │                │                   │
                    ▼                ▼                   ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │ tenant_001   │  │ tenant_002   │  │ tenant_003   │
           │ queue        │  │ queue        │  │ queue        │
           │ (BullMQ)     │  │ (BullMQ)     │  │ (BullMQ)     │
           └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                  │                 │                  │
                  └─────────────────┼──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │   IA Gateway     │
                          │   (FastAPI)      │
                          │                  │
                          │ 1. Descifrar     │
                          │    prompt (RAM)  │
                          │ 2. Formatear     │
                          │    system prompt │
                          │ 3. Enviar a vLLM │
                          │ 4. Cifrar resp.  │
                          │ 5. Zero memory   │
                          └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │   vLLM Server    │
                          │   (GPU 0 & 1)    │
                          │                  │
                          │ - No logging     │
                          │ - mlock RAM      │
                          │ - No swap        │
                          │ - Context per     │
                          │   tenant slot     │
                          └──────────────────┘
```

### 6.2 Cola de Inferencia por Tenant

**Estructura de colas BullMQ:**

```typescript
// Cada tenant tiene su propia cola de inferencia
const iaQueues = new Map<string, Queue>();

function getIaQueue(tenantId: string): Queue {
  if (!iaQueues.has(tenantId)) {
    iaQueues.set(tenantId, new Queue(
      `ia-${tenantId}`,
      {
        redis: { host: 'redis-cluster', port: 6379 },
        defaultJobOptions: {
          removeOnComplete: true,    // No persistir prompts procesados
          removeOnFail: 100,         // Solo últimos 100 fallos
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        }
      }
    ));
  }
  return iaQueues.get(tenantId)!;
}
```

**Priorización entre tenants:**

```typescript
// Policy de fairness: Round-robin ponderado por tamaño del tenant
class TenantFairnessScheduler {
  private tenantQuotas: Map<string, {
    patientsActivos: number;     // N de pacientes
    slotsAsignados: number;      // Slots de 15min/día total
    tokensConsumidosHoy: number; // Tracker de uso diario
    prioridad: number;           // 1-10 (calculado)
  }>;

  // Calcular prioridad cada 5 minutos
  async recalculatePriorities() {
    // Prioridad base = pacientes activos / max_pacientes * 10
    // Penalización si ha consumido mucho hoy
    // Bonus si es hora punta para su franja horaria
  }

  // Obtener próximo job de la cola más prioritaria
  async dequeueNext(): Promise<Job | null> {
    const sortedTenants = [...this.tenantQuotas.entries()]
      .sort((a, b) => b[1].prioridad - a[1].prioridad);

    for (const [tenantId] of sortedTenants) {
      const queue = getIaQueue(tenantId);
      const job = await queue.getNextJob();
      if (job) return job;
    }
    return null;
  }
}
```

### 6.3 Contexto Cifrado en RAM Volátil

**Pipeline de procesamiento (sin persistencia):**

```
1. RECEPCIÓN: Job de BullMQ contiene prompt cifrado (BYTEA)

2. DESCIFRADO EN RAM:
   - Obtener KEK del tenant desde HSM (cifrado en tránsito)
   - Descifrar prompt con AES-256-GCM en buffer RAM
   - KEK descartado inmediatamente después
   - Variable: let decrypted = Buffer.alloc(0)

3. FORMATEO DEL PROMPT:
   - Inyectar system prompt clínico (del tenant, en RAM)
   - Inyectar contexto de sesión previa (solo últimos N tokens)
   - Ensamblar en estructura { system, messages, tools }

4. INFERENCIA vLLM:
   - Enviar a vLLM via HTTP (localhost:8000)
   - vLLM configurado sin logging
   - Respuesta en buffer RAM

5. CIFRADO DE RESPUESTA:
   - Cifrar con misma KEK (o KEK del paciente si es personal)
   - Almacenar solo BYTEA cifrado en PostgreSQL

6. ZEROING DE MEMORIA:
   - Sobrescribir buffers con ceros
   - Explicit Buffer.alloc(0) + garbage collection
```

**Configuración de vLLM para zero-persistencia:**

```bash
# Flags de vLLM para entorno clínico
vllm serve deepseek-r1-distill-qwen-70b \
  --tensor-parallel-size 2 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.90 \
  --disable-log-requests \           # No loguear prompts
  --disable-log-stats \              # No loguear estadísticas
  --trust-remote-code \
  --enforce-eager \
  --max-num-batched-tokens 8192 \
  --max-num-seqs 8 \
  --kv-cache-dtype fp8 \
  --device cuda \
  --host 127.0.0.1 \
  --port 8000

# Kernel parameter: evitar swap
echo "vm.swappiness=0" >> /etc/sysctl.conf
echo "vm.overcommit_memory=1" >> /etc/sysctl.conf
sysctl -p

# mlock all: evitar que memoria con datos clínicos vaya a disco
# Se configura en systemd service
[Service]
LimitMEMLOCK=infinity
ExecStartPre=/bin/bash -c 'echo mlock > /sys/kernel/mm/transparent_hugepage/enabled'
```

**Zeroing explícito en Node.js:**

```javascript
function secureZero(buffer: Buffer): void {
  buffer.fill(0);
  // Forzar que el optimizador V8 no elimine la operación
  // (usando crypto API para asegurar escritura)
  crypto.webcrypto.getRandomValues(buffer);
  buffer.fill(0);
}

// En el worker de IA
async function processIaRequest(job: Job) {
  const encryptedPrompt = Buffer.from(job.data.prompt, 'hex');
  const tenantKek = await getTenantKek(job.data.tenantId);

  // Buffer temporal (RAM)
  const decryptedPrompt = Buffer.alloc(encryptedPrompt.length);
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', tenantKek, iv);
    decryptedPrompt.set(decipher.update(encryptedPrompt));

    // ... proceso de inferencia ...

    const response = await sendToVllm(decryptedPrompt.toString('utf-8'));
    const encryptedResponse = encryptWithKek(response, tenantKek);
    await storeEncrypted(job.data.patientId, encryptedResponse);
  } finally {
    // Zeroing forzoso
    secureZero(decryptedPrompt);
    secureZero(tenantKek);
    global.gc?.();  // Forzar GC si está disponible (--expose-gc)
  }
}
```

### 6.4 Sin Persistencia de Logs de Prompts/Respuestas

**Política de no-logueo:**

| Componente | Logs permitidos | Logs prohibidos |
|---|---|---|
| Nginx (reverse proxy) | IP origen, timestamp, endpoint, status code, latency | Request body, response body |
| API Gateway (FastAPI) | ID de request, tenant_id (anonimizado), duración | Prompt, respuesta, contexto clínico |
| vLLM | Número de requests, tokens/s, VRAM usage | Contenido de prompts, respuestas generadas |
| BullMQ (Redis) | Estado de jobs, errores, tiempos de proceso | Payload de jobs (cifrado en Redis) |
| PostgreSQL | Slow queries, conexiones, locks | Contenido BYTEA (cifrado) |
| Application logs (Winston) | IDs, timestamps, errores genéricos | Cualquier dato del paciente |

**Configuración de Nginx para excluir bodies de logs:**

```nginx
# No loguear cuerpos de requests de IA
location /api/v1/diary/send-to-ai {
    access_log /var/log/nginx/ancora-ia.log main_body_off;
    # ...
}

# Formato de log sin body
log_format main_body_off '$remote_addr - $remote_user [$time_local] '
                         '"$request" $status $body_bytes_sent '
                         '"$http_referer" "$http_user_agent"';
```

### 6.5 Priorización y Fairness entre Psicólogos

**Modelo de fairness:**

```
Tenant A (psicólogo con 40 pacientes activos):
  - Prioridad base: 8/10
  - Slots/día: 40 * 15min = 600 min
  - Límite de requests concurrentes: 4
  - Latencia objetivo: < 2s

Tenant B (psicólogo nuevo, 5 pacientes):
  - Prioridad base: 4/10
  - Slots/día: 5 * 15min = 75 min
  - Límite de requests concurrentes: 2
  - Latencia objetivo: < 3s

Tenant C (psicólogo premium, 25 pacientes, plan Intensivo):
  - Prioridad base: 9/10 (bonus por plan)
  - Slots/día: 25 * 30min = 750 min (doble por plan)
  - Límite de requests concurrentes: 6
  - Latencia objetivo: < 1.5s
```

**Implementación con weighted fair queuing:**

```typescript
class WeightedFairQueue {
  private queues: Map<string, {
    jobs: Job[];
    weight: number;         // Peso proporcional
    lastDequeued: number;   // Timestamp último servicio
  }>;

  // Algoritmo de Deficit Round Robin
  async nextJob(): Promise<Job | null> {
    const now = Date.now();
    let bestTenant: string | null = null;
    let bestScore = -Infinity;

    for (const [tenantId, q] of this.queues) {
      if (q.jobs.length === 0) continue;

      // Tiempo desde último servicio (más espera = más prioridad)
      const waitTime = now - q.lastDequeued;

      // Score = weight * (waitTime / 1000) - penalización por uso excesivo
      const usagePenalty = await this.getUsagePenalty(tenantId);
      const score = q.weight * (waitTime / 1000) - usagePenalty;

      if (score > bestScore) {
        bestScore = score;
        bestTenant = tenantId;
      }
    }

    if (!bestTenant) return null;

    const q = this.queues.get(bestTenant)!;
    q.lastDequeued = now;
    return q.jobs.shift()!;
  }

  private async getUsagePenalty(tenantId: string): Promise<number> {
    // Penalización si ha consumido > 80% de su cuota horaria
    const key = `ia_quota:${tenantId}:${new Date().getHours()}`;
    const used = await redis.get(key) || 0;
    const quota = this.getTenantQuota(tenantId);

    if (used > quota * 0.8) {
      return (used - quota * 0.8) / quota * 10;
    }
    return 0;
  }
}
```

### 6.6 Capacidad por Servidor (Dual RTX 4090)

| Métrica | Valor |
|---|---|
| Modelo principal | DeepSeek-R1-Distill-Qwen-70B (AWQ 4-bit) |
| VRAM total | 48 GB (24 GB x 2 GPUs) |
| VRAM modelo | ~38.5 GB (TP=2) |
| KV Cache disponible | ~9.5 GB (FP8 pooled) |
| Slots concurrentes | 10 slots de 15 min por bloque |
| Pacientes activos por servidor | ~100-150 (distribución Poisson) |
| Latencia promedio | ~1.5s (TTFT) |
| Tokens/s agregados | ~45 t/s (DeepSeek-R1), ~75 t/s (con speculative decoding) |
| Cobertura horaria | 08:00-20:00 (chat diurno), 20:00-08:00 (procesamiento batch) |

**Distribución de VRAM detallada:**

```
GPU 0 (24 GB):
  ├── Model weights (AWQ 4-bit):  19.25 GB
  ├── KV Cache pool:               1.57 GB (~19,625 tokens)
  ├── Whisper (Fijo):              1.50 GB
  ├── CUDA overhead:               1.50 GB
  └── Margen:                      0.18 GB
  ───────────────────────────────────────
  Total:                          24.00 GB

GPU 1 (24 GB):
  ├── Model weights (AWQ 4-bit):  19.25 GB
  ├── KV Cache pool:               1.57 GB
  ├── CUDA overhead:               1.50 GB
  └── Margen:                      1.68 GB
  ───────────────────────────────────────
  Total:                          24.00 GB
```

### 6.7 Aislamiento Criptográfico en la GPU

**Ciclo completo de una request de IA multi-tenant:**

```
[Paciente A - Tenant 001]                    [Paciente B - Tenant 002]
         │                                          │
         ▼                                          ▼
   Cifra mensaje con KEK A                   Cifra mensaje con KEK B
         │                                          │
         ▼                                          ▼
   ┌────────────────────────────────────────────────────┐
   │              API GATEWAY (FastAPI)                  │
   │                                                     │
   │  1. Descifra mensaje A con KEK A (RAM exclusiva)   │
   │  2. Descifra mensaje B con KEK B (RAM exclusiva)   │
   │  3. Formatea prompts con system prompt de cada     │
   │     tenant                                         │
   │  4. Encola en cola de prioridad                    │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │                 vLLM (GPU)                          │
   │                                                     │
   │  Aislamiento garantizado por:                       │
   │  - KV Cache separada por request (vLLM nativo)     │
   │  - Continuous batching: nunca mezcla contextos     │
   │    de diferentes pacientes en el mismo lote         │
   │  - Sin persistencia: VRAM se sobrescribe con       │
   │    cada nuevo batch                                 │
   │  - mlock: VRAM nunca va a swap en disco            │
   │  - --disable-log-requests: ningún prompt se loguea │
   └──────────────────────┬─────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────┐
   │              API GATEWAY (FastAPI)                  │
   │                                                     │
   │  5. Recibe respuesta en RAM volátil                │
   │  6. Cifra respuesta A con KEK A                    │
   │  7. Cifra respuesta B con KEK B                    │
   │  8. Zeroing de buffers                             │
   │  9. Envía BYTEA cifrado a PostgreSQL                │
   └──────┬─────────────────────────────────┬───────────┘
          │                                 │
          ▼                                 ▼
  [Paciente A recibe respuesta]     [Paciente B recibe respuesta]
  Solo KEK A puede descifrar       Solo KEK B puede descifrar
```

### 6.8 Escalabilidad Horizontal (N servidores GPU)

```
Cuando un servidor GPU alcanza >80% de ocupación sostenida:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  GPU Server 1   │    │  GPU Server 2   │    │  GPU Server N   │
│  (Dual 4090)    │    │  (Dual 4090)    │    │  (Dual 4090)    │
│  Tenants:       │    │  Tenants:       │    │  Tenants:       │
│  A, B, C        │    │  D, E, F        │    │  G, H, I        │
│  Ocupación: 75% │    │  Ocupación: 82% │    │  Ocupación: 45% │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │   Orchestrator        │
                    │   (balanceador)       │
                    │                       │
                    │  - Asigna tenants a   │
                    │    servidores         │
                    │  - Rebalancea cada    │
                    │    60 min             │
                    │  - Migra tenants si   │
                    │    un server falla    │
                    └──────────────────────┘
```

**Migración de tenant entre servidores (sin downtime):**

```
1. Orchestrator detecta server 2 > 80% ocupación
2. Selecciona tenant F (menor carga) para migrar a server 3
3. Server 3 carga el modelo (si no está ya cargado) (~30s)
4. Se replica KV Cache caliente de tenant F a server 3
5. Redis actualiza routing: ia_router:tenant_F → server_3
6. Nuevas requests van a server 3
7. Server 2 drena requests pendientes de tenant F
8. Server 2 libera VRAM de tenant F
```

---

## APÉNDICE A: Glosario de Términos Técnicos

| Término | Definición |
|---|---|
| **KEK** | Key Encryption Key. Clave maestra del tenant para cifrar datos clínicos. |
| **DK** | Data Key. Derivada del KEK + salt, usada para cifrar cada mensaje. |
| **Argon2id** | Función de derivación de clave resistente a ASIC/GPU. |
| **WORM** | Write Once Read Many. Almacenamiento inmutable para cumplimiento legal. |
| **Crypto-shredding** | Destrucción de datos mediante eliminación de la clave criptográfica. |
| **RLS** | Row-Level Security. Políticas de PostgreSQL que filtran filas por tenant. |
| **TP** | Tensor Parallelism. Divide el modelo entre múltiples GPUs. |
| **TTFT** | Time To First Token. Latencia hasta el primer token generado. |
| **SOAP** | Subjetivo, Objetivo, Análisis, Plan. Formato de notas clínicas. |
| **Raw-First** | Paradigma UX donde los datos crudos se muestran antes que el análisis IA. |

## APÉNDICE B: Decisiones Técnicas Clave

1. **Schema-per-tenant + RLS** en lugar de DB separada: Por coste operativo y flexibilidad. Un cluster PostgreSQL puede manejar cientos de miles de pacientes con aislamiento criptográfico.

2. **REST > GraphQL para 95% de la API**: Por simplicidad de caching, rate limiting y seguridad. GraphQL reservado para queries agregadas del dashboard.

3. **BullMQ sobre Redis nativo**: Por persistencia de jobs, reintentos automáticos, y visibilidad del estado de colas.

4. **vLLM como engine de inferencia**: Por su continuous batching nativo, PagedAttention para gestión eficiente de KV Cache, y soporte para Tensor Parallelism.

5. **No persistencia de logs de IA**: Por cumplimiento RGPD (Art. 9) y confianza del paciente. Los prompts se cifran antes de entrar a la cola y se descifran solo en RAM volátil por milisegundos.

6. **mlock + swappiness=0**: Para garantizar que datos clínicos en RAM nunca se escriban en disco (swap), incluso bajo presión de memoria.

7. **Stripe Connect con split payments**: Para cumplimiento fiscal (exención IVA Art.20.Uno.3º) y evitar laboralidad (falsos autónomos).

8. **Backup WORM con Object Lock Compliance**: Para cumplir con retención legal de 5 años (Ley 41/2002) sin posibilidad de alteración, ni siquiera por administradores.

---

*Fin del documento T1 — Arquitectura Global Multi-Psicólogo para Ancora (ancora.clinic)*
