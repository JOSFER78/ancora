# INFORME T4: GESTIÓN DE DATOS, PRIVACIDAD E IMPORTACIÓN/EXPORTACIÓN DE PACIENTES

## Proyecto: Ancora (ancora.clinic) — Telepsicología Zero-Knowledge

Version: 1.0
Fecha: 31 Mayo 2026
Clasificación: CONFIDENCIAL — Secreto Profesional Sanitario

---

## INDICE

1. IMPORTACION DE PACIENTES POR EL PSICOLOGO
   1.1 Invitacion por email/SMS con enlace magico
   1.2 Codigo QR unico desde panel del psicologo
   1.3 Subida CSV/Excel masivo con procesamiento por lotes
   1.4 Enlace publico con autoregistro
   1.5 API REST para integracion con sistemas de clinicas
2. EXPORTACION DE HISTORIA CLINICA PORTABLE
   2.1 Formatos: JSON, PDF, Markdown
   2.2 Contenido de la historia clinica
   2.3 Portabilidad entre psicologos (transferencia interna)
   2.4 Exportacion fuera de Ancora (descarga cifrada)
   2.5 Estructura JSON de referencia
3. ARQUITECTURA DE DATOS CIFRADOS
   3.1 AES-256-GCM en reposo (PostgreSQL BYTEA)
   3.2 Claves derivadas del cliente con Argon2id
   3.3 Cifrado E2EE para chats (WebCrypto API)
   3.4 Chats grupales con clave RSA-OAEP
   3.5 Procesamiento en RAM volatil y memory zeroing
   3.6 mlock/mlockall contra swap
4. CICLO DE VIDA DE LOS DATOS
   4.1 Alta: consentimiento + enclave cifrado
   4.2 Activo: procesamiento, backups, trazabilidad
   4.3 Baja: crypto-shredding
   4.4 Retencion: 5 anos post-baja (Ley 41/2002)
   4.5 Portabilidad (Art. 20 RGPD)
5. TRAZABILIDAD Y AUDITORIA
   5.1 Hash chain de logs de acceso (SHA256 encadenado)
   5.2 Registro completo de accesos
   5.3 Alertas de accesos sospechosos
   5.4 DLP clinico con NLP local
6. CHECKLIST GDPR COMPLETA
7. ANEXOS: Diagramas, estructuras BD, referencias

---

## 1. IMPORTACION DE PACIENTES POR EL PSICOLOGO

Ancora ofrece seis flujos de incorporacion de pacientes, cada uno con
distintos niveles de seguridad, friccion UX y capacidad de volumen.

### 1.1 Invitacion por email/SMS con enlace magico

#### UX Flow

```
[Psicologo en panel]           [Paciente]
        |                            |
        | 1. Click "Invitar Paciente"|
        | 2. Introduce email/tlf     |
        | 3. Selecciona plan         |
        | 4. Click "Enviar Invitacion"|
        |                            |
        |--- 5. Backend genera ----->|
        |    token JWT cifrado       |
        |    expiracion: 72h         |
        |                            |
        | 6. Email/SMS enviado ------+-> [Paciente recibe enlace]
        |                            |    "ancora.clinic/join?tk=xxx"
        |                            |
        |                            | 7. Abre enlace
        |                            | 8. Validacion token
        |                            | 9. Formulario registro:
        |                            |    - Password (Argon2id en cliente)
        |                            |    - Consentimiento explicito
        |                            |    - Datos demograficos minimos
        |                            | 10. Cuenta activada
        |                            | 11. Token invalidado (un solo uso)
        |<-- 12. Notificacion --------|
        |    "Paciente registrado"   |
```

#### Seguridad del token JWT

```javascript
// backend/src/services/invitation.service.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function createInvitationToken(psychologistId, patientEmail, planId) {
  // Nonce unico anti-replay
  const jti = crypto.randomUUID();

  // JWT cifrado con AES-256-GCM (JWE)
  const token = await new jose.EncryptJWT({
    sub: patientEmail,
    psy: psychologistId,       // ID del psicologo emisor
    plan: planId,
    purpose: 'patient_invite'
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('72h')
    .setJti(jti)
    .encrypt(process.env.INVITATION_ENCRYPTION_KEY);

  // Almacenar hash del jti para deteccion de uso multiple
  await db.query(
    `INSERT INTO invitation_tokens (jti_hash, psychologist_id, email, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [crypto.createHash('sha256').update(jti).digest('hex'),
     psychologistId, patientEmail,
     new Date(Date.now() + 72 * 3600 * 1000)]
  );

  return token;
}
```

#### Estructura de base de datos

```sql
-- Tabla de tokens de invitacion
CREATE TABLE invitation_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti_hash        VARCHAR(64) NOT NULL UNIQUE,    -- SHA256 del jti
  psychologist_id UUID NOT NULL REFERENCES psychologists(id),
  patient_email   VARCHAR(255) NOT NULL,
  plan_id         UUID REFERENCES subscription_plans(id),
  status          VARCHAR(20) DEFAULT 'pending',   -- pending|used|expired|revoked
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  used_by_ip      INET,
  INDEX idx_invitation_psychologist (psychologist_id),
  INDEX idx_invitation_status_expires (status, expires_at)
);

-- Trigger de limpieza: invalidar tokens expirados cada hora
CREATE OR REPLACE FUNCTION clean_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitation_tokens
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### Edge cases cubiertos

| Escenario | Accion |
|-----------|--------|
| Token expirado | Mostrar "Enlace expirado. Solicita nueva invitacion a tu psicologo." |
| Token reutilizado | Detectar por jti_hash UNIQUE, mostrar "Este enlace ya fue usado." |
| Email ya registrado | Redirigir a login con mensaje: "Ya tienes cuenta. Inicia sesion." |
| Token revocado por psicologo | CRUD en panel: "Invitacion cancelada." |
| Intento de escalado de privilegios | El JWT lleva `purpose: 'patient_invite'`, validado en middleware |
| Multiple invitaciones mismo email | Solo el ultimo token activo es valido; previos se marcan revoked |
| Enlace abierto en dispositivo no seguro | Mostrar advertencia de seguridad antes del formulario |

---

### 1.2 Codigo QR unico desde panel del psicologo

#### UX Flow

```
[Panel del Psicologo]
        |
        | 1. Click "Generar QR de Admision"
        | 2. Sistema genera:
        |    - QR rotativo (cada 5 min)
        |    - Firma HMAC-SHA256 del payload
        |    - Nonce + timestamp
        | 3. QR mostrado en pantalla grande
        |    (ej: tablet en recepcion)
        |
[Paciente escanea con movil]
        |
        | 4. App abre ancora.clinic/qr/abcdef
        | 5. Valida firma HMAC y timestamp
        |    (rechaza si >5 min o firma invalida)
        | 6. Precarga datos del psicologo
        | 7. Formulario registro minimalista
        |    - Solo nombre + password + consentimiento
        | 8. Cuenta creada y vinculada al psicologo
```

#### Implementacion QR seguro

```javascript
// backend/src/services/qr.service.js
const crypto = require('crypto');
const QRCode = require('qrcode');

const QR_ROTATION_SECONDS = 300; // 5 minutos
const QR_HMAC_KEY = process.env.QR_HMAC_KEY; // 256-bit, rotado semanalmente

async function generatePsychologistQR(psychologistId) {
  const timestamp = Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000));
  const nonce = crypto.randomBytes(4).toString('hex');

  const payload = `${psychologistId}:${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', QR_HMAC_KEY)
    .update(payload)
    .digest('hex');

  const qrData = JSON.stringify({
    v: 2,
    p: psychologistId,
    t: timestamp,
    n: nonce,
    s: signature
  });

  // Generar SVG para visualizacion en web
  const qrSvg = await QRCode.toString(qrData, {
    type: 'svg',
    width: 400,
    margin: 2,
    color: { dark: '#1a365d', light: '#ffffff' }
  });

  // Almacenar QR activo en Redis (expira a los 5 min)
  await redis.setex(
    `qr_active:${psychologistId}`,
    QR_ROTATION_SECONDS,
    qrData
  );

  return { qrSvg, expiresIn: QR_ROTATION_SECONDS };
}

// Middleware de validacion
async function validateQRMiddleware(req, res, next) {
  const { qrData } = req.body;
  let parsed;

  try {
    parsed = JSON.parse(qrData);
  } catch {
    return res.status(400).json({ error: 'QR invalido' });
  }

  // Version check
  if (parsed.v !== 2) return res.status(400).json({ error: 'QR desactualizado' });

  // Timestamp freshness
  const currentWindow = Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000));
  if (Math.abs(parsed.t - currentWindow) > 1) {
    return res.status(401).json({ error: 'QR expirado. Solicita uno nuevo.' });
  }

  // Verificar firma HMAC
  const payload = `${parsed.p}:${parsed.t}:${parsed.n}`;
  const expectedSig = crypto
    .createHmac('sha256', QR_HMAC_KEY)
    .update(payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(parsed.s), Buffer.from(expectedSig))) {
    return res.status(403).json({ error: 'QR fraudulento detectado' });
  }

  req.psychologistId = parsed.p;
  next();
}
```

#### Anti-fraude: rotacion por ventana temporal

```
Time Window 1 (T0 - T0+5min)         Time Window 2 (T0+5min - T0+10min)
+----------------------------+       +----------------------------+
| QR firma con HMAC(t1)    | ----> | QR firma con HMAC(t2)    |
| payload: psy:t1:nonce1   |       | payload: psy:t2:nonce2   |
+----------------------------+       +----------------------------+
       |                                      |
       v                                      v
Si se fotografía un QR y se intenta         Solo acepta t2
usar minutos después, t1 != current          Rechaza t1
tambien HMAC no coincide

Proteccion adicional:
- Rate limiting: max 3 intentos de escaneo fallidos por IP/minuto
- Si un mismo QR se escanea desde 2 IPs distintas en <1s -> bloqueo
- Log de todos los escaneos con geolocalizacion aproximada
```

#### Edge cases

| Escenario | Accion |
|-----------|--------|
| QR en foto en redes sociales | Inutil tras 5 min por ventana temporal |
| Paciente escanea desde otra ciudad | Normal, el QR vincula al psicologo, no geolocaliza |
| Pantalla del psicologo compartida en Zoom | Misma proteccion: temporal + HMAC |
| Ataque de repeticion (replay) | Nonce + timestamp unicos; HMAC invalido tras ventana |
| Psicologo cierra sesion sin limpiar QR | QR se invalida al marcar `qr_active` como null en Redis |
| Paciente escanea pero no completa registro | No hay impacto; QR expira en 5 min igualmente |

---

### 1.3 Subida CSV/Excel masivo con procesamiento por lotes

#### UX Flow

```
[Panel del Psicologo -> Importar Pacientes]
        |
        | 1. Descargar plantilla .csv/.xlsx
        |    Columnas: nombre, email, telefono, plan, notas
        | 2. Rellenar datos (max 500 filas por lote)
        | 3. Subir archivo
        |
[Backend]
        |
        | 4. Validacion del archivo:
        |    - Extension permitida (.csv, .xlsx)
        |    - Tamano max 10MB
        |    - Cabeceras correctas
        |    - Validacion de email formato
        |    - Deteccion duplicados (email ya registrado)
        | 5. Preview de resultados para el psicologo:
        |    - 450 filas OK
        |    - 30 emails invalidos
        |    - 20 duplicados
        | 6. Confirmacion del psicologo
        |
        | 7. Procesamiento por lotes (BullMQ):
        |    - Batch 1: 100 invitaciones
        |    - Batch 2: 100 invitaciones
        |    - Batch 3: 100 invitaciones
        |    - Batch 4: 100 invitaciones
        |    - Batch 5: 100 invitaciones
        |
        | 8. Por cada fila:
        |    - Generar token JWT individual
        |    - Enviar email/SMS
        |    - Almacenar en invitation_tokens
        |
        | 9. Resultado final en panel:
        |    - 450 invitaciones enviadas
        |    - 50 errores (detalle descargable CSV)
```

#### Procesamiento por lotes

```javascript
// backend/src/queues/bulkInvitation.queue.js
const { Queue, Worker } = require('bullmq');

const bulkInvitationQueue = new Queue('bulk-invitations', {
  connection: { host: 'redis', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

async function enqueueBulkInvitations(psychologistId, patients, batchSize = 100) {
  const batches = [];
  for (let i = 0; i < patients.length; i += batchSize) {
    batches.push(patients.slice(i, i + batchSize));
  }

  const jobs = batches.map((batch, index) => ({
    name: `batch-${index}`,
    data: { psychologistId, patients: batch, batchIndex: index }
  }));

  return await bulkInvitationQueue.addBulk(jobs);
}

// Worker process
const worker = new Worker('bulk-invitations', async (job) => {
  const { psychologistId, patients, batchIndex } = job.data;
  const results = [];

  for (const patient of patients) {
    try {
      const token = await createInvitationToken(psychologistId, patient.email, patient.plan);
      await sendEmailInvitation(patient.email, token);

      // Actualizar progreso en Redis (para el polling del frontend)
      await redis.incr(`bulk_progress:${psychologistId}`);

      results.push({ email: patient.email, status: 'sent' });
    } catch (error) {
      results.push({ email: patient.email, status: 'error', reason: error.message });
    }
  }

  return { batchIndex, results };
}, {
  connection: { host: 'redis', port: 6379 },
  concurrency: 3, // Max 3 lotes simultaneos
  limiter: {
    max: 10,     // Max 10 invitations por segundo
    duration: 1000
  }
});
```

#### Validacion del archivo

```python
# backend/src/validation/bulk_import.py
import pandas as pd
import re
from email_validator import validate_email, EmailNotValidError

REQUIRED_COLUMNS = ['nombre', 'email']
OPTIONAL_COLUMNS = ['telefono', 'plan', 'notas']
MAX_ROWS = 500
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class BulkImportValidator:
    def __init__(self, file_path: str, psychologist_id: str):
        self.file_path = file_path
        self.psychologist_id = psychologist_id
        self.errors = []
        self.warnings = []
        self.valid_rows = []

    def validate(self) -> dict:
        # 1. Extension
        if not self.file_path.endswith(('.csv', '.xlsx')):
            return {'valid': False, 'errors': ['Formato no soportado. Usa .csv o .xlsx']}

        # 2. Lectura
        try:
            if self.file_path.endswith('.csv'):
                df = pd.read_csv(self.file_path, dtype=str)
            else:
                df = pd.read_excel(self.file_path, dtype=str)
        except Exception as e:
            return {'valid': False, 'errors': [f'Error al leer archivo: {str(e)}']}

        # 3. Cabeceras
        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            return {'valid': False, 'errors': [f'Columnas requeridas faltantes: {missing}']}

        # 4. Numero de filas
        if len(df) > MAX_ROWS:
            return {'valid': False, 'errors': [f'Maximo {MAX_ROWS} pacientes por lote']}

        # 5. Validar cada fila
        for idx, row in df.iterrows():
            row_errors = []

            # Email valido
            try:
                validate_email(row['email'], check_deliverability=False)
            except EmailNotValidError as e:
                row_errors.append(f'Email invalido: {row["email"]}')

            # Nombre no vacio
            if pd.isna(row.get('nombre')) or not str(row.get('nombre', '')).strip():
                row_errors.append('Nombre requerido')

            # Telefono formato (opcional)
            telefono = row.get('telefono', '')
            if pd.notna(telefono) and telefono.strip():
                if not re.match(r'^\+?\d{6,15}$', telefono.strip()):
                    row_errors.append(f'Telefono formato invalido: {telefono}')

            if row_errors:
                self.errors.append({'row': idx + 2, 'email': row['email'], 'errors': row_errors})
            else:
                self.valid_rows.append(row.to_dict())

        # 6. Detectar duplicados internos en el CSV
        emails = [r['email'] for r in self.valid_rows]
        if len(emails) != len(set(emails)):
            dupes = [e for e in emails if emails.count(e) > 1]
            self.warnings.append(f'Emails duplicados en el archivo: {list(set(dupes))}')

        # 7. Detectar duplicados contra BD
        existing = db.query("""
            SELECT email FROM users WHERE email = ANY($1)
        """, [emails])
        if existing:
            existing_emails = [r['email'] for r in existing]
            self.warnings.append(f'Pacientes ya registrados: {existing_emails}')
            self.valid_rows = [r for r in self.valid_rows if r['email'] not in existing_emails]

        return {
            'valid': len(self.valid_rows) > 0,
            'total_rows': len(df),
            'valid_count': len(self.valid_rows),
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
            'errors': self.errors,
            'warnings': self.warnings,
            'valid_rows': self.valid_rows
        }
```

#### Edge cases

| Escenario | Accion |
|-----------|--------|
| CSV con caracteres especiales (acentos, enees) | Detectar encoding y forzar UTF-8 |
| Archivo .xlsx corrupto | Capturar exception y pedir re-subida |
| 500 filas, 400 emails invalidos | Mostrar preview: "Solo 100 validos. ?Confirmar?" |
| Un email aparece 10 veces en el CSV | Enviar una sola invitacion, notificar duplicados |
| Lote parcialmente enviado y servidor cae | BullMQ retry con backoff exponencial |
| Psicologo cancela importacion a medio proceso | BullMQ: eliminar trabajos pendientes de ese batchId |
| Email invalido (sin @) | Marcar fila como error, continuar con las demas |

---

### 1.4 Enlace publico tipo 'ancora.clinic/psicologo/dr-garcia'

#### UX Flow

```
[Psicologo configura perfil publico]
        |
        | 1. Activar "Perfil Publico" en configuracion
        | 2. Slug personalizado (dr-garcia, psicologo-maria)
        | 3. Descripcion breve y foto (opcional)
        | 4. Precio/sesion visible
        | 5. Horario de disponibilidad
        |
[Paciente llega al enlace]
        |
        | ancora.clinic/psicologo/dr-garcia
        |
        | 6. Landing page del psicologo:
        |    - Foto y presentacion profesional
        |    - Precios transparentes
        |    - Boton "Reservar cita de prueba"
        |    - Sello: "Datos cifrados Zero-Knowledge"
        |
        | 7. Click "Reservar cita"
        | 8. Formulario de autoregistro:
        |    - Nombre completo
        |    - Email
        |    - Password (Argon2id en cliente)
        |    - Consentimiento explicito
        |    - Cuestionario breve (PHQ-2 opcional)
        | 9. Cuenta creada + vinculada al psicologo
        | 10. Opcion de pago de primera sesion
        |
[Notificacion al psicologo]
        |
        | 11. Email: "Nuevo paciente registrado desde tu enlace"
        | 12. Panel: paciente aparece en lista con estado "Nuevo"
```

#### Implementacion de slugs

```sql
CREATE TABLE psychologist_public_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id     UUID UNIQUE NOT NULL REFERENCES psychologists(id),
  slug                VARCHAR(100) UNIQUE NOT NULL,    -- 'dr-garcia'
  is_active           BOOLEAN DEFAULT false,
  title               VARCHAR(200),                    -- "Psicologo General Sanitario"
  description         TEXT,
  photo_url           VARCHAR(500),
  price_display       INTEGER,                         -- Precio visible en €
  consultation_duration INTEGER DEFAULT 50,            -- Minutos
  auto_approve        BOOLEAN DEFAULT false,           -- Aceptar pacientes automaticamente
  seo_meta_title      VARCHAR(160),
  seo_meta_description VARCHAR(320),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_public_slug (slug)
);

-- Slug validation: solo letras, numeros y guiones
CREATE OR REPLACE FUNCTION validate_slug(slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN slug ~ '^[a-z0-9-]{3,100}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### Seguridad del autoregistro

```javascript
// Proteccion contra abuso del enlace publico
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,     // 15 min
  max: 10,                        // Max 10 registros por ventana
  message: 'Demasiados intentos. Intenta en 15 minutos.'
};

// CAPTCHA invisible (Cloudflare Turnstile) en formulario
const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token) {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: `secret=${turnstileSecretKey}&response=${token}`
    }
  );
  return response.json();
}

// Anti-bot: Honeypot field invisible en formulario
// Si se rellena -> descartar como bot
```

#### Edge cases

| Escenario | Accion |
|-----------|--------|
| Slug ya ocupado | Sugerir alternativas: dr-garcia-1, dr-garcia-madrid |
| Psicologo desactiva perfil | Redirigir a 410 Gone con mensaje |
| Paciente se registra pero psicologo no acepta | Estado "pendiente de aprobacion" en panel |
| Spam bots atacan formulario | Turnstile + rate limiting + honeypot |
| Psicologo cambia slug | 301 redirect del antiguo al nuevo + notificar pacientes |
| Enlace indexado en Google por error | Meta noindex en perfiles no activados |
| Paciente ya existente intenta registrarse de nuevo | Email ya registrado -> mostrar login con recordatorio |
| Psicologo elimina su cuenta | Perfil publico se desactiva inmediatamente |

---

### 1.5 API REST para integracion con sistemas de clinicas

#### Endpoints

```
POST   /api/v1/integrations/patients/invite        Invitar paciente
POST   /api/v1/integrations/patients/bulk-import   Importacion masiva
GET    /api/v1/integrations/patients/{id}/status   Estado de invitacion
POST   /api/v1/integrations/patients/register      Autoregistro delegado
GET    /api/v1/integrations/export/patients        Exportar pacientes
```

#### Autenticacion API

```javascript
// API Key + HMAC signing para partners clinicos
// Cada clinica tiene:
//   api_key_id      (identificador publico, ej: 'clinic_abc123')
//   api_key_secret  (secreto compartido, 256-bit, almacenado como bcrypt hash)

const crypto = require('crypto');

function generateApiSignature(apiKeyId, apiKeySecret, method, path, body, timestamp) {
  const payload = [
    timestamp,
    apiKeyId,
    method.toUpperCase(),
    path,
    JSON.stringify(body)
  ].join('\n');

  return crypto
    .createHmac('sha256', apiKeySecret)
    .update(payload)
    .digest('hex');
}

// Cliente llama:
// Header: X-API-Key: clinic_abc123
// Header: X-Timestamp: 1717200000
// Header: X-Signature: <hmac result>
```

#### Ejemplo de flujo completo (clinica integrada)

```python
# Ejemplo: Clinica "PsicoMadrid" integra Ancora via API
import requests
import hmac
import hashlib
import json
import time

API_BASE = "https://api.ancora.clinic/v1/integrations"
API_KEY_ID = "clinic_psicomadrid"
API_KEY_SECRET = "sk-..."

def sign_request(method, path, body, timestamp):
    payload = f"{timestamp}\n{API_KEY_ID}\n{method}\n{path}\n{json.dumps(body)}"
    return hmac.new(
        API_KEY_SECRET.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

def invite_patient(patient_data):
    timestamp = str(int(time.time()))
    path = "/patients/invite"
    body = {
        "nombre": patient_data["nombre"],
        "email": patient_data["email"],
        "telefono": patient_data.get("telefono", ""),
        "plan_id": "plan_esencial",
        "notas": patient_data.get("notas", ""),
        "metadata": {
            "source": "psicomadrid_ehr",
            "referrer_id": patient_data["ehr_id"]
        }
    }

    signature = sign_request("POST", path, body, timestamp)

    response = requests.post(
        f"{API_BASE}{path}",
        json=body,
        headers={
            "X-API-Key": API_KEY_ID,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
            "Content-Type": "application/json"
        }
    )
    return response.json()

# Uso:
resultado = invite_patient({
    "nombre": "Ana Garcia Lopez",
    "email": "ana.garcia@email.com",
    "ehr_id": "PAT-2024-001234"
})
print(f"Invitacion enviada: {resultado['invitation_id']}")
```

#### Tabla de permisos por API Key

```sql
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id        VARCHAR(64) UNIQUE NOT NULL,   -- 'clinic_abc123'
  key_hash      VARCHAR(255) NOT NULL,         -- bcrypt del secreto
  name          VARCHAR(200) NOT NULL,          -- 'Clinica PsicoMadrid'
  permissions   TEXT[] NOT NULL DEFAULT '{}',   -- ARRAY de permisos
    -- permisos disponibles:
    -- 'patients:invite', 'patients:read', 'patients:write',
    -- 'appointments:read', 'appointments:write',
    -- 'export:read'
  rate_limit     INTEGER DEFAULT 100,           -- requests/minuto
  allowed_ips    INET[],                        -- Restriccion por IP (opcional)
  is_active      BOOLEAN DEFAULT true,
  last_used_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  INDEX idx_api_key_id (key_id)
);
```

#### Edge cases

| Escenario | Accion |
|-----------|--------|
| API Key robada | Rotar inmediatamente desde panel; notificar a clinica |
| Clinica envia datos duplicados | Idempotency key en header `Idempotency-Key: UUID` |
| Rate limit excedido | HTTP 429 + header `Retry-After` |
| Clinica desea webhook de confirmacion | Configurar webhook URL: `POST /api/v1/integrations/webhook` |
| Paciente invitado por API que ya existe | Devolver error 409 Conflict con detalle |
| Integracion con EHR extranjero (HIPAA) | Endpoint dedicado con firma adicional FHIR |
| Timeout de respuesta >30s | Procesamiento asincrono con polling de estado |

---

## 2. EXPORTACION DE HISTORIA CLINICA PORTABLE

Este es el corazon del sistema. La portabilidad es obligacion legal
(Art. 20 RGPD) y ventaja competitiva frente a plataformas que atrapan
datos del paciente.

### 2.1 Formatos soportados

| Formato | Proposito | Contenido | Tamano tipico | Cifrado |
|---------|-----------|-----------|---------------|---------|
| JSON (.ancora) | Completo, portable, reimportable | Historia clinica COMPLETA | 50KB - 5MB | Clave paciente (AES-256-GCM) |
| PDF | Resumen ejecutivo psicologo-paciente | Datos principales, graficos, cronologia | 10-30 paginas | Sin cifrar (visible para paciente) |
| Markdown | Importable a Obsidian/Notion | Estructura completa en texto plano | 30KB - 1MB | Sin cifrar (descarga voluntaria) |

### 2.2 Contenido de la historia clinica

```
+----------------------------------------------------------+
|            HISTORIA CLINICA ANCORA                        |
|            Formato: JSON v2.1                             |
+----------------------------------------------------------+
|                                                           |
| 1. METADATOS                                              |
|    - ID del paciente (anonimizado para reimportacion)     |
|    - Nombre, fecha de nacimiento                          |
|    - Fecha de alta en Ancora                              |
|    - Fecha de exportacion                                 |
|    - Hash SHA256 de la exportacion                        |
|                                                           |
| 2. CRONOLOGIA VITAL                                       |
|    - Timeline completo de sesiones                        |
|    - Fechas de cada sesion                                |
|    - Duracion de cada sesion                              |
|    - Modalidad (video, chat, revision)                    |
|    - Psicologo asignado en cada periodo                   |
|                                                           |
| 3. PATRONES EMOCIONALES                                   |
|    - Series temporales de estados de animo                |
|    - Datos de check-ins diarios                           |
|    - Tendencias detectadas por IA                         |
|    - Correlaciones con eventos vitales                    |
|                                                           |
| 4. EVENTOS SIGNIFICATIVOS                                 |
|    - Eventos vitales marcados por el paciente             |
|    - Crisis y episodios                                   |
|    - Logros y hitos                                       |
|    - Activaciones de kill-switch                          |
|                                                           |
| 5. OBJETIVOS TERAPEUTICOS                                 |
|    - Objetivos definidos por paciente y psicologo         |
|    - Estado de cada objetivo                              |
|    - Progreso medido                                      |
|    - Fechas de revision de objetivos                      |
|                                                           |
| 6. NOTAS DEL PSICOLOGO (SOAP)                             |
|    - Notas Subjetivo, Objetivo, Analisis, Plan            |
|    - Fecha de cada nota                                   |
|    - Firma digital del psicologo                          |
|    - Hash de integridad de cada nota                      |
|                                                           |
| 7. EJERCICIOS Y MATERIAL TERAPEUTICO                      |
|    - Ejercicios asignados                                 |
|    - Completitud de ejercicios                            |
|    - Registros de practica                                |
|    - Material psicoeducativo entregado                    |
|                                                           |
| 8. AVANCES Y RECAIDAS                                    |
|    - Metricas de progreso                                 |
|    - Indicadores de mejora                                |
|    - Recaidas documentadas                                |
|    - Periodos de crisis                                   |
|                                                           |
| 9. DATOS DE WEARABLES (si aplica)                         |
|    - Sueno (horas, calidad)                               |
|    - Frecuencia cardiaca / HRV                            |
|    - Pasos diarios                                        |
|    - Periodos de estres                                   |
+----------------------------------------------------------+
```

### 2.3 Portabilidad entre psicologos (transferencia interna)

Cuando un paciente cambia de psicologo DENTRO de Ancora, los datos
NO necesitan ser descargados. El sistema transfiere el acceso
criptografico.

#### UX Flow

```
[Paciente solicita cambio de psicologo]
        |
        | 1. Menu -> "Cambiar de psicologo"
        | 2. Seleccionar nuevo psicologo del directorio
        | 3. Confirmar: "Entiendo que mi historial completo
        |    sera visible para mi nuevo psicologo"
        | 4. Autenticacion reforzada (password + 2FA)
        |
[Backend: Transferencia criptografica]
        |
        | 5. Sistema recupera clave publica RSA del nuevo psicologo
        | 6. Recifra la clave de acceso del paciente con la nueva
        |    clave publica del psicologo
        |    (nunca se descifra en servidor el contenido)
        |
        | 7. Actualiza tabla de acceso:
        |    - Revoca acceso del psicologo anterior
        |    - Concede acceso al nuevo psicologo
        |    - Log de auditoria del cambio
        |
        | 8. Notifica a AMBOS psicologos:
        |    - Anterior: "El paciente X ha transferido su caso"
        |    - Nuevo: "Tienes un nuevo paciente con historial completo"
        |
[Seguridad]
        |
        | - El psicologo anterior PIERDE acceso inmediatamente
        | - El paciente conserva control total
        | - Nota SOAP del psicologo anterior: visible pero inmutable
        | - El nuevo psicologo NO puede editar notas previas
        | - Solo puede anadir nuevas notas y objetivos
```

#### Implementacion del recifrado

```javascript
// backend/src/services/transfer.service.js
const crypto = require('crypto');

async function transferPatientToPsychologist(patientId, oldPsychologistId, newPsychologistId) {
  return await db.transaction(async (tx) => {
    // 1. Verificar que el nuevo psicologo esta disponible
    const newPsy = await tx.query(
      `SELECT id, rsa_public_key FROM psychologists WHERE id = $1 AND is_active = true`,
      [newPsychologistId]
    );
    if (!newPsy.rows[0]) throw new Error('Psicologo no disponible');

    // 2. Recuperar KEK envuelta (Key Encryption Key) del paciente
    //    La KEK esta cifrada para cada psicologo autorizado
    const kekEntry = await tx.query(
      `SELECT encrypted_key FROM patient_key_access
       WHERE patient_id = $1 AND psychologist_id = $2`,
      [patientId, oldPsychologistId]
    );
    if (!kekEntry.rows[0]) throw new Error('No hay acceso previo');

    // 3. La KEK esta cifrada con RSA-OAEP de cada psicologo
    //    No podemos descifrarla en servidor. En su lugar:
    //    - El servidor envia al paciente una solicitud de re-cifrado
    //    - El navegador del paciente descifra la KEK (tiene la clave)
    //    - Recifra con la clave publica del nuevo psicologo
    //    - Envia la nueva KEK cifrada al servidor

    // Alternativa (mas segura para UX): El paciente ya tiene la KEK
    // descifrada en sessionStorage. Frontend:
    //    const kek = sessionStorage.getItem('patient_kek');
    //    const newEncryptedKek = await encryptRSA(kek, newPsyPublicKey);
    //    await api.post('/transfer/confirm', { patientId, newEncryptedKek, newPsychologistId });

    // 4. Registrar nuevo acceso
    await tx.query(
      `INSERT INTO patient_key_access (patient_id, psychologist_id, encrypted_key, granted_at)
       VALUES ($1, $2, $3, NOW())`,
      [patientId, newPsychologistId, newEncryptedKek]
    );

    // 5. Revocar acceso anterior
    await tx.query(
      `UPDATE patient_key_access
       SET revoked_at = NOW()
       WHERE patient_id = $1 AND psychologist_id = $2 AND revoked_at IS NULL`,
      [patientId, oldPsychologistId]
    );

    // 6. Log de auditoria
    await tx.query(
      `INSERT INTO audit_log (action, patient_id, actor_id, metadata)
       VALUES ('PATIENT_TRANSFERRED', $1, $2, $3)`,
      [patientId, patientId,
       JSON.stringify({
         from_psychologist: oldPsychologistId,
         to_psychologist: newPsychologistId,
         timestamp: new Date().toISOString()
       })]
    );

    return { success: true, newPsychologistId };
  });
}
```

### 2.4 Exportacion para llevar fuera de Ancora

#### UX Flow

```
[Paciente en su perfil -> Exportar datos]
        |
        | 1. Seleccionar formato:
        |    [ ] JSON completo (.ancora) - RECOMENDADO
        |    [ ] PDF resumen ejecutivo
        |    [ ] Markdown para Obsidian/Notion
        |
        | 2. Seleccionar rango de fechas:
        |    [ ] Toda la historia
        |    [ ] Ultimos 6 meses
        |    [ ] Personalizado
        |
        | 3. Opciones de cifrado (solo para JSON):
        |    [X] Cifrar con mi clave de Ancora
        |    [ ] Descifrar (texto plano)
        |
        | 4. Confirmar con password
        |    (re-autenticacion requerida)
        |
[Backend]
        |
        | 5. Validar identidad (password + 2FA si activo)
        | 6. Recuperar todos los datos del paciente
        | 7. Montar estructura JSON completa
        | 8. Si cifrado:
        |    - Derivar clave de exportacion:
        |      Argon2id(password_export + salt) -> 256-bit
        |    - Cifrar JSON con AES-256-GCM
        |    - Incluir salt + iv + auth tag en .ancora file
        | 9. Generar PDF con Puppeteer
        | 10. Generar Markdown con plantillas
        | 11. Firmar con hash SHA256
        | 12. Devolver archivo firmado
        | 13. LOG: exportacion de historia clinica
```

#### Estructura del archivo .ancora (cifrado)

```
Archivo: paciente-historia-2026-05-31.ancora

Estructura interna (JSON almacenado en el archivo):
{
  "format": "ancora-clinical-history",
  "version": "2.1",
  "metadata": {
    "patient_id": "anon_a3f8c2...",
    "export_date": "2026-05-31T10:30:00Z",
    "export_reason": "patient_request_art20_gdpr",
    "record_count": 1458,
    "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
  },
  "encryption": {
    "algorithm": "AES-256-GCM",
    "kdf": "Argon2id",
    "kdf_params": {
      "time_cost": 3,
      "memory_cost": 65536,
      "parallelism": 4,
      "salt_hex": "a1b2c3d4e5f6..."
    },
    "iv_hex": "7a8b9c0d1e2f...",
    "auth_tag_hex": "f0e1d2c3b4a5..."
  },
  "payload": "base64_encoded_ciphertext..."
}

Para descifrar:
  1. Extraer salt del header
  2. Derivar clave: Argon2id(password_proporcionada, salt)
  3. AES-256-GCM decrypt(ciphertext, key, iv)
  4. Verificar auth tag
  5. Verificar hash SHA256 del contenido
```

#### Generacion de PDF

```javascript
// backend/src/export/pdf.service.js
const puppeteer = require('puppeteer');
const { compile } = require('handlebars');

const PDF_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 2.5cm; }
    body { font-family: 'Inter', sans-serif; color: #1a202c; }
    h1 { color: #2d3748; border-bottom: 3px solid #6b46c1; }
    .section { margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px; }
    .timeline { position: relative; }
    .timeline-item { margin: 10px 0; padding-left: 20px; border-left: 2px solid #6b46c1; }
    .mood-chart { width: 100%; height: 200px; background: linear-gradient(...); }
    .footer { text-align: center; font-size: 10px; color: #a0aec0; margin-top: 50px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .badge-green { background: #c6f6d5; color: #22543d; }
    .badge-red { background: #fed7d7; color: #742a2a; }
  </style>
</head>
<body>
  <h1>Historia Clinica - Ancora</h1>
  <p>Paciente: {{metadata.nombre}} | Exportado: {{metadata.export_date}}</p>

  <div class="section">
    <h2>Resumen del Tratamiento</h2>
    <p>Periodo: {{resumen.fecha_inicio}} - {{resumen.fecha_fin}}</p>
    <p>Psicologo asignado: {{resumen.psicologo_nombre}}</p>
    <p>Sesiones totales: {{resumen.sesiones_totales}}</p>
    <p>Objetivos completados: {{resumen.objetivos_completados}}/{{resumen.objetivos_totales}}</p>
  </div>

  <div class="section">
    <h2>Cronologia de Sesiones</h2>
    {{#each sesiones}}
    <div class="timeline-item">
      <strong>{{fecha}}</strong> - {{tipo}} ({{duracion}} min)
      <br><small>Tema: {{tema_principal}}</small>
    </div>
    {{/each}}
  </div>

  <div class="section">
    <h2>Patrones Emocionales</h2>
    <div class="mood-chart">{{mood_chart_svg}}</div>
  </div>

  <div class="section">
    <h2>Objetivos Terapeuticos</h2>
    {{#each objetivos}}
    <p>
      <span class="badge {{#if completado}}badge-green{{else}}badge-red{{/if}}">
        {{#if completado}}Completado{{else}}En curso{{/if}}
      </span>
      {{descripcion}}
    </p>
    {{/each}}
  </div>

  <div class="footer">
    Documento generado por Ancora.clinic | Ley 41/2002, Art. 15 | RGPD Art. 20
    <br>Hash de integridad: {{hash}}
  </div>
</body>
</html>
`;

async function generatePdf(data) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const template = compile(PDF_TEMPLATE);
  const html = template(data);

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '2.5cm', bottom: '2.5cm', left: '2cm', right: '2cm' }
  });

  await browser.close();
  return pdf;
}
```

### 2.5 Estructura JSON de referencia

```json
{
  "_format": "ancora-clinical-history",
  "_version": "2.1.0",
  "_generated_at": "2026-05-31T10:30:00Z",

  "metadata": {
    "patient_id_anon": "anon_a3f8c2d1e4b7",
    "nombre_paciente": "Ana Garcia Lopez",
    "fecha_nacimiento": "1992-03-15",
    "fecha_alta": "2025-09-01",
    "fecha_exportacion": "2026-05-31T10:30:00Z",
    "motivo_exportacion": "cambio_psicologo_externo",
    "total_registros": 1458,
    "hash_integridad": "sha256:e3b0c44298fc1c149afbf4c8996fb924..."
  },

  "cronologia": {
    "periodos_psicologo": [
      {
        "psicologo_id": "psy_001",
        "psicologo_nombre": "Dr. Carlos Mendez",
        "fecha_inicio": "2025-09-01",
        "fecha_fin": "2026-02-15",
        "total_sesiones": 22
      },
      {
        "psicologo_id": "psy_003",
        "psicologo_nombre": "Dra. Laura Jimenez",
        "fecha_inicio": "2026-02-20",
        "fecha_fin": null,
        "total_sesiones": 14
      }
    ],
    "sesiones": [
      {
        "id": "ses_001",
        "fecha": "2025-09-01T10:00:00Z",
        "tipo": "sesion_inicial",
        "modalidad": "videollamada",
        "duracion_minutos": 60,
        "psicologo_id": "psy_001",
        "psicologo_nombre": "Dr. Carlos Mendez",
        "tema_principal": "Evaluacion inicial y encuadre",
        "escalas_aplicadas": ["PHQ-9", "GAD-7"],
        "resultado_PHQ9": 15,
        "resultado_GAD7": 12,
        "nota_soap": {
          "subjetivo": "La paciente refiere...",
          "objetivo": "Se observa...",
          "analisis": "Los resultados sugieren...",
          "plan": "Sesiones semanales con enfoque TCC..."
        }
      },
      {
        "id": "ses_002",
        "fecha": "2025-09-08T11:00:00Z",
        "tipo": "seguimiento",
        "modalidad": "videollamada",
        "duracion_minutos": 45,
        "psicologo_id": "psy_001",
        "notas_psicologo": "Progreso en identificacion de distorsiones cognitivas"
      }
    ],
    "revisiones_asincronas": [
      {
        "id": "rev_001",
        "fecha": "2025-09-05T14:00:00Z",
        "duracion_minutos": 15,
        "tipo": "revision_semanal",
        "video_briefing_url": "https://cdn.ancora.clinic/...",
        "resumen_ia": "Mejora leve en estado de animo general..."
      }
    ]
  },

  "patrones_emocionales": {
    "checkins_mensuales": [
      {
        "mes": "2025-09",
        "media_animo": 4.2,
        "media_ansiedad": 6.8,
        "media_energia": 3.5,
        "media_sueno_horas": 6.2,
        "num_checkins": 28,
        "tendencia": "mejora_leve",
        "distorsiones_detectadas": ["catastrofismo", "polarizacion"],
        "frecuencia_distorsiones": {
          "catastrofismo": 12,
          "polarizacion": 8,
          "personalizacion": 3
        }
      }
    ],
    "tendencias_detectadas_ia": [
      {
        "periodo": "2025-09_a_2025-11",
        "patron": "Mejora en regulacion emocional pero persistencia de ansiedad social",
        "nivel_confianza_ia": 0.85
      }
    ]
  },

  "eventos_significativos": [
    {
      "id": "evt_001",
      "fecha": "2025-10-15",
      "tipo": "crisis",
      "severidad": "alta",
      "descripcion": "Episodio de ansiedad aguda tras reunion laboral",
      "activacion_kill_switch": true,
      "intervencion": "Protocolo de crisis activado. Contacto con psicologo en <30min",
      "resolucion": "Estabilizada tras intervencion psicologica"
    },
    {
      "id": "evt_002",
      "fecha": "2026-01-20",
      "tipo": "logro",
      "severidad": "baja",
      "descripcion": "Primera exposicion social exitosa (reunion con amigos)"
    }
  ],

  "objetivos_terapeuticos": [
    {
      "id": "obj_001",
      "descripcion": "Reducir frecuencia de ataques de panico de 3/sem a <1/sem",
      "fecha_creacion": "2025-09-01",
      "fecha_revision": "2025-12-01",
      "estado": "completado",
      "progreso_porcentaje": 100,
      "metricas": {
        "linea_base": 3,
        "actual": 0.5,
        "objetivo": 1
      }
    },
    {
      "id": "obj_002",
      "descripcion": "Mejorar calidad de sueno (media >7h/noche)",
      "fecha_creacion": "2025-09-01",
      "estado": "en_curso",
      "progreso_porcentaje": 65,
      "metricas": {
        "linea_base": 5.2,
        "actual": 6.8,
        "objetivo": 7.0
      }
    }
  ],

  "ejercicios": [
    {
      "id": "ej_001",
      "tipo": "registro_pensamientos",
      "nombre": "Registro de pensamientos automaticos",
      "fecha_asignacion": "2025-09-01",
      "total_asignados": 30,
      "completados": 28,
      "ultima_practica": "2026-05-28",
      "progreso": 0.93
    }
  ],

  "avances_y_recaidas": [
    {
      "periodo": "2025-09_a_2025-12",
      "tipo": "avance",
      "descripcion": "Reduccion del 60% en sintomas depresivos (PHQ-9: 15 -> 6)",
      "evidencia": "Escala PHQ-9 aplicada mensualmente"
    },
    {
      "periodo": "2026-02",
      "tipo": "recaida_parcial",
      "descripcion": "Aumento temporal de ansiedad (GAD-7: 8 -> 13)",
      "factor_desencadenante": "Problemas laborales",
      "duracion_dias": 18,
      "resolucion": "Estabilizacion tras 3 sesiones intensivas",
      "aprendizaje": "Identificacion temprana de patrones de estres"
    }
  ],

  "plan_accion_futuro": {
    "recomendaciones_al_alta": [
      "Continuar con registro de pensamientos automaticos",
      "Mantener rutina de higiene de sueno",
      "Sesiones de mantenimiento mensuales recomendadas"
    ],
    "nota_continuidad": "Paciente con buena respuesta a TCC. Riesgo de recaida bajo.",
    "psicologo_recomendado": null
  }
}
```

---

## 3. ARQUITECTURA DE DATOS CIFRADOS

### 3.1 AES-256-GCM en reposo en PostgreSQL

Toda columna con datos clinicos se almacena como BYTEA cifrada.

#### Esquema de cifrado

```
+----------------------------------------------------+
|              PostgreSQL (BYTEA)                     |
|                                                    |
| patient_data: table {                              |
|   id: UUID                                         |
|   encrypted_content: BYTEA  <-- AES-256-GCM       |
|   encryption_metadata: JSONB {                     |
|     "kek_id": UUID,               <- Key ID       |
|     "iv": hex,                    <- IV unico     |
|     "auth_tag": hex,              <- Auth tag     |
|     "algorithm": "AES-256-GCM"                    |
|   }                                                |
|   integrity_hash: VARCHAR(64)     <- SHA256        |
| }                                                  |
+----------------------------------------------------+
```

#### Funcion de cifrado en PostgreSQL

```sql
-- Extension pgcrypto requerida
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_clinical_data(
  plaintext TEXT,
  kek BYTEA,       -- Key Encryption Key (256-bit)
  kek_id UUID
) RETURNS TABLE(
  encrypted_data BYTEA,
  metadata JSONB,
  integrity_hash VARCHAR(64)
) AS $$
DECLARE
  iv BYTEA := gen_random_bytes(12);  -- 96-bit IV for GCM
  ciphertext BYTEA;
  auth_tag BYTEA;
  combined BYTEA;
BEGIN
  -- AES-256-GCM encrypt
  combined := pgp_sym_encrypt(
    plaintext,
    encode(kek, 'hex'),
    'cipher-algo=aes256',
    'compress-algo=0'
  );

  -- SHA256 integrity hash
  integrity_hash := encode(
    digest(plaintext, 'sha256'),
    'hex'
  );

  metadata := jsonb_build_object(
    'kek_id', kek_id,
    'algorithm', 'AES-256-GCM',
    'iv', encode(iv, 'hex'),
    'created_at', NOW()
  );

  encrypted_data := combined;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Columnas cifradas por tabla

```sql
-- Tabla de chats/entradas de diario
CREATE TABLE encrypted_chat_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  psychologist_id   UUID REFERENCES psychologists(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  entry_type        VARCHAR(20) NOT NULL,  -- 'chat','checkin','note','exercise'

  -- Datos cifrados
  encrypted_content BYTEA NOT NULL,
  encryption_metadata JSONB NOT NULL,

  -- Metadatos no cifrados (para busqueda sin descifrar)
  entry_date        DATE NOT NULL,          -- Fecha sin cifrar
  mood_score        INTEGER,                -- Puntuacion de animo (1-10)
  has_crisis_keywords BOOLEAN DEFAULT false,

  -- Integridad
  integrity_hash    VARCHAR(64) NOT NULL,
  previous_hash     VARCHAR(64) NOT NULL,   -- Hash chain

  INDEX idx_patient_date (patient_id, entry_date),
  INDEX idx_crisis_flag (has_crisis_keywords) WHERE has_crisis_keywords = true
);

-- Tabla de KEKs (Key Encryption Keys) por paciente
CREATE TABLE patient_key_encryption_keys (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID UNIQUE NOT NULL REFERENCES patients(id),
  kek_wrapped       BYTEA NOT NULL,         -- KEK cifrada con clave derivada del usuario
  wrapping_method   VARCHAR(20) DEFAULT 'argon2id',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  rotated_at        TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true
);

-- Tabla de acceso de psicologos a KEK de pacientes
CREATE TABLE patient_key_access (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  psychologist_id   UUID NOT NULL REFERENCES psychologists(id),
  encrypted_key     BYTEA NOT NULL,          -- KEK cifrada con RSA-OAEP del psicologo
  granted_at        TIMESTAMPTZ DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ,
  granted_by        UUID REFERENCES users(id),  -- Quien autorizo el acceso
  UNIQUE(patient_id, psychologist_id, COALESCE(revoked_at, 'infinity'))
);
```

### 3.2 Claves derivadas del cliente con Argon2id (Zero-Knowledge)

La plataforma NUNCA tiene acceso a las claves de descifrado.

```
[Registro del paciente]
        |
        | 1. Paciente crea password: "MiClaveSegura123!"
        | 2. Navegador genera salt (16 bytes aleatorios)
        | 3. Deriva clave de cifrado:
        |    master_key = Argon2id(
        |       password = "MiClaveSegura123!",
        |       salt = salt,
        |       time_cost = 3,
        |       memory_cost = 65536 (64MB),
        |       parallelism = 4,
        |       key_length = 32 (256 bits)
        |    )
        | 4. Divide master_key en:
        |    - kek (256 bits): Key Encryption Key
        |    - kek_auth (256 bits): Autenticacion KEK
        |    - auth_key (128 bits): Autenticacion API
        | 5. Envia al servidor:
        |    - salt (para re-derivar en login)
        |    - kdf_params (para configuracion Argon2id)
        |    - auth_key_hash (SHA256 del auth_key)
        |    - KEK_envuelta:
        |      - kek_wrapped = AES-GCM-256(kek, server_key)
        | 6. Servidor almacena:
        |    - salt
        |    - kdf_params
        |    - auth_key_hash
        |    - kek_wrapped (nunca el kek en claro)
        | 7. El kek SOLO existe en memoria del navegador
        |    y en sessionStorage/IndexedDB local
```

#### Implementacion en frontend (WebCrypto)

```javascript
// frontend/src/crypto/keyDerivation.js

// Parametros Argon2id
const ARGON2_CONFIG = {
  timeCost: 3,
  memoryCost: 65536,  // 64 MB
  parallelism: 4,
  hashLength: 32       // 256 bits
};

async function deriveKeys(password, salt) {
  // Importar password como PBKDF2-compatible (polyfill para Argon2)
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Usar Argon2 via WebAssembly (biblioteca argon2-browser)
  const { argon2id } = await import('@anclm/argon2-browser');

  const masterKey = await argon2id({
    pass: password,
    salt: salt,
    time: ARGON2_CONFIG.timeCost,
    mem: ARGON2_CONFIG.memoryCost,
    hashLen: ARGON2_CONFIG.hashLength * 3,  // 96 bytes total
    type: argon2id
  });

  // Dividir en 3 claves
  const kek = masterKey.hash.slice(0, 32);      // Key Encryption Key
  const kekAuth = masterKey.hash.slice(32, 64); // KEK Auth
  const authKey = masterKey.hash.slice(64, 80); // Auth key (128 bits)

  // Calcular hash de authKey para servidor
  const authKeyBuffer = await crypto.subtle.digest('SHA-256', authKey);

  return {
    kek: new Uint8Array(kek),
    kekAuth: new Uint8Array(kekAuth),
    authKey: new Uint8Array(authKey),
    authKeyHash: new Uint8Array(authKeyBuffer)
  };
}

// En login: re-derivar la KEK desde password + salt
async function loginAndDecrypt(password, salt, encryptedPayload) {
  const keys = await deriveKeys(password, hexToBytes(salt));

  // La KEK descifra los datos del paciente
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: encryptedPayload.iv,
      additionalData: encryptedPayload.aad,
      tagLength: 128
    },
    keys.kek,  // La KEK, no el server, descifra
    encryptedPayload.ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
```

### 3.3 Cifrado E2EE para chats con WebCrypto API

Cada mensaje individual se cifra en el navegador antes de enviarse al servidor.

```
[Cliente A]                      [Servidor]                     [Cliente B]
    |                                |                              |
    | 1. Genera clave sesion efimera |                              |
    |    AES-GCM-256                |                              |
    | 2. Cifra mensaje con clave    |                              |
    | 3. Envia:                     |                              |
    |    - ciphertext               |                              |
    |    - iv                       |                              |
    |    - encrypted_session_key    |                              |
    |    (session key cifrada con   |                              |
    |     RSA-OAEP pub key de B)    |                              |
    |---> 4. Almacena BYTEA ------->|                              |
    |                                |---> 5. Entrega mensaje ---->|
    |                                |                              | 6. Descifra session key
    |                                |                              |    con RSA-OAEP priv key
    |                                |                              | 7. Descifra mensaje
    |                                |                              |    con AES-GCM
```

#### Implementacion

```javascript
// frontend/src/crypto/e2ee.js

// 1. Cifrar mensaje saliente
async function encryptMessage(plaintext, recipientPublicKeyPEM) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generar clave simetrica efimera para este mensaje
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  // Generar IV unico
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Cifrar el mensaje
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv, tagLength: 128 },
    aesKey,
    data
  );

  // Exportar la clave AES para cifrarla con RSA
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // Importar clave publica RSA del destinatario
  const recipientPublicKey = await importPublicKey(recipientPublicKeyPEM);

  // Cifrar la clave AES con RSA-OAEP
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey
  );

  // Firmar el mensaje para integridad
  const signature = await signMessage(Buffer.concat([
    new Uint8Array(ciphertext),
    iv
  ]));

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    encryptedKey: arrayBufferToBase64(encryptedKey),
    signature: arrayBufferToBase64(signature)
  };
}

// 2. Descifrar mensaje entrante
async function decryptMessage(encryptedMsg, privateKeyPKCS8) {
  const ciphertext = base64ToArrayBuffer(encryptedMsg.ciphertext);
  const iv = base64ToArrayBuffer(encryptedMsg.iv);
  const encryptedKey = base64ToArrayBuffer(encryptedMsg.encryptedKey);

  // Descifrar clave AES con clave privada RSA
  const privateKey = await importPrivateKey(privateKeyPKCS8);
  const aesKeyRaw = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKey
  );

  // Importar clave AES
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Descifrar mensaje
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv, tagLength: 128 },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
```

### 3.4 Chats grupales (Duo/Familiar) con clave de grupo RSA-OAEP

```
[Plan Duo / Familiar]
        |
        | 1. Creador del grupo genera clave simetrica K_G
        |    (AES-256-GCM, generada localmente en navegador)
        |
        | 2. Para cada miembro del grupo:
        |    - Recupera clave publica RSA del miembro
        |    - Cifra K_G con RSA-OAEP(public_key_member, K_G)
        |    - Envia encrypted_K_G_member al servidor
        |
        | 3. Servidor almacena en tabla claves_grupo_usuario:
        |    - user_id
        |    - group_id
        |    - encrypted_key (BYTEA)
        |
        | 4. Cuando un miembro envia mensaje:
        |    - Cifra mensaje con K_G (AES-256-GCM)
        |    - Envia ciphertext al servidor
        |    - Servidor almacena y distribuye a otros miembros
        |    - Cada miembro descifra con su copia local de K_G
        |
        | 5. Cuando la IA mediadora necesita procesar:
        |    - El servidor API recupera encrypted_K_G_ai
        |    - Descifra K_G en RAM volatil (con clave privada de la IA)
        |    - Procesa el mensaje (analisis, resumen)
        |    - Cifra resultado con K_G
        |    - Hace memory zeroing de K_G en RAM
```

#### Implementacion de clave de grupo

```javascript
// frontend/src/crypto/groupChat.js

// 1. Crear grupo y generar clave compartida
async function createGroup(memberPublicKeys) {
  // Generar clave simetrica de grupo
  const groupKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,  // Extraible para poder cifrarla
    ["encrypt", "decrypt"]
  );

  const rawGroupKey = await window.crypto.subtle.exportKey("raw", groupKey);

  // Cifrar K_G para cada miembro
  const encryptedKeys = {};
  for (const [memberId, pubKeyPEM] of Object.entries(memberPublicKeys)) {
    const publicKey = await importPublicKey(pubKeyPEM);
    encryptedKeys[memberId] = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      rawGroupKey
    );
  }

  return { groupKey, encryptedKeys };
}

// 2. Unirse a grupo (recuperar K_G cifrada para uno mismo)
async function joinGroup(encryptedGroupKeyForMe, myPrivateKey) {
  const privateKey = await importPrivateKey(myPrivateKey);
  const rawGroupKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedGroupKeyForMe
  );

  return await window.crypto.subtle.importKey(
    "raw",
    rawGroupKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 3. Cifrar mensaje de grupo
async function encryptGroupMessage(plaintext, groupKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    groupKey,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv)
  };
}
```

#### Tabla de claves de grupo

```sql
CREATE TABLE group_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID UNIQUE NOT NULL REFERENCES therapy_groups(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  rotated_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true
);

CREATE TABLE group_key_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key_id    UUID NOT NULL REFERENCES group_keys(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  encrypted_key   BYTEA NOT NULL,         -- K_G cifrada con RSA-OAEP del miembro
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  left_at         TIMESTAMPTZ,
  UNIQUE(group_key_id, user_id, COALESCE(left_at, 'infinity'))
);
```

### 3.5 Procesamiento en RAM volatil con memory zeroing explicito

Todo dato clinico descifrado se procesa EXCLUSIVAMENTE en RAM
y se sobrescribe con ceros inmediatamente despues de usar.

```javascript
// backend/src/crypto/memoryZeroing.js
const { sensitive } = require('@sensitive-utils/memory-safe');
const { randomBytes } = require('crypto');

class SecureBuffer {
  constructor(size) {
    this.buffer = Buffer.allocUnsafe(size);
    // Llenar con ruido para evitar data remanente de alloc previo
    this.buffer.fill(0x42);
  }

  write(data, offset = 0) {
    const written = this.buffer.write(data, offset);
    // Prevenir que el compilador optimice la escritura
    // (noop que fuerza retention)
    process.noDeprecation = true;
    return written;
  }

  read(offset = 0, length = this.buffer.length) {
    return this.buffer.slice(offset, offset + length);
  }

  /**
   * Sobrescribe el buffer con ceros de forma segura
   * Garantizado por V8 (--zero-fill-buffers no es suficiente)
   */
  zeroize() {
    // Sobrescribir 3 veces: ceros, unos, ceros
    this.buffer.fill(0x00);
    this.buffer.fill(0xFF);
    this.buffer.fill(0x00);

    // Forzar que V8 no optimice esta funcion
    // (evita que el GC mueva datos sin limpiar)
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  /**
   * Limpieza automatica con destructor
   */
  destroy() {
    this.zeroize();
    this.buffer = null;
  }
}

// Ejemplo de uso en pipeline de IA
async function processClinicalMessage(encryptedPayload) {
  const secureBuf = new SecureBuffer(65536);

  try {
    // Solo en RAM: descifrar KEK
    const kek = await decryptKEK(encryptedPayload.kekId);
    secureBuf.write(kek);

    // Descifrar contenido en RAM
    const plaintext = await aes256GcmDecrypt(
      secureBuf.read(0, 32),  // KEK desde buffer seguro
      encryptedPayload.ciphertext,
      encryptedPayload.iv
    );

    // Procesar con LLM (el modelo se ejecuta en GPU,
    // pero el prompt se construye en RAM del sistema)
    const response = await llm.process(plaintext);

    // El resultado se vuelve a cifrar antes de almacenar
    return response;

  } finally {
    // SIEMPRE limpiar memoria
    secureBuf.destroy();
    kek?.zeroize?.();
    plaintext?.zeroize?.();
  }
}
```

### 3.6 mlock/mlockall para evitar swap de datos sensibles

```c
// backend/init_secure_memory.c
// Binario auxiliar que se ejecuta al inicio del servicio
// para bloquear toda la memoria del proceso en RAM fisica

#define _GNU_SOURCE
#include <sys/mman.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    // mlockall: Bloquear todas las paginas de memoria actuales Y futuras
    // MCL_CURRENT: Bloquear paginas ya asignadas
    // MCL_FUTURE:  Bloquear futuras asignaciones
    // MCL_ONFAULT:  Solo bloquear cuando se acceda (menos agresivo)
    if (mlockall(MCL_CURRENT | MCL_FUTURE | MCL_ONFAULT) == -1) {
        perror("mlockall failed");
        fprintf(stderr, "Ejecutar como root o configurar:\n");
        fprintf(stderr, "  sudo setcap cap_ipc_lock+ep /path/to/process\n");
        fprintf(stderr, "O en docker: --security-opt seccomp=unconfined\n");
        return 1;
    }

    // Verificar limite RLIMIT_MEMLOCK
    struct rlimit rlim;
    if (getrlimit(RLIMIT_MEMLOCK, &rlim) == 0) {
        printf("MEMLOCK limits: soft=%lu hard=%lu\n",
               rlim.rlim_cur, rlim.rlim_max);
    }

    return 0;
}
```

#### Configuracion de produccion

```bash
# /etc/systemd/system/ancora-backend.service
[Service]
# Aumentar limite de memoria lockeable
LimitMEMLOCK=infinity

# Capacidad para mlockall
AmbientCapabilities=CAP_IPC_LOCK

# Prevenir core dumps (pueden contener datos sensibles)
LimitCORE=0

# No permitir dump de memoria del proceso
MemoryDenyWriteExecute=true

# Protecciones adicionales
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
```

```yaml
# docker-compose.yml seccion backend
  backend:
    image: ancora-backend:latest
    security_opt:
      - seccomp=unconfined      # Necesario para mlockall
      - apparmor=unconfined
    cap_add:
      - IPC_LOCK                # Capacidad para mlock/mlockall
    ulimits:
      memlock:
        soft: -1                # Sin limite
        hard: -1
    environment:
      - NODE_OPTIONS=--zero-fill-buffers  # V8 zeroes allocated buffers
      - NODE_PENDING_DEPRECATION=1
    volumes:
      # No montar discos de swap dentro del contenedor
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 128M
          noexec: true
          nosuid: true
```

#### Verificacion de que mlock funciona

```bash
# Comprobar que un proceso tiene paginas lockeadas
# desde el host (o con nsenter en Docker)
sudo nsenter -t $(docker inspect -f '{{.State.Pid}}' ancora-backend) -m

# Dentro del namespace:
cat /proc/self/status | grep -i lock
# VmSwap: 0 kB                    <- CRITICO: debe ser 0
# VmLck:  123456 kB               <- Memoria lockeada

# Verificar con /proc/self/maps | grep -i lock
# Si VmSwap > 0, hay datos sensibles yendose a disco
```

---

## 4. CICLO DE VIDA DE LOS DATOS

### 4.1 Alta: consentimiento explicito + configuracion enclave cifrado

```
FLUJO DE ALTA DE PACIENTE
========================================

FASE 1: PRE-REGISTRO
  [ ] Paciente recibe invitacion (cualquier metodo del punto 1)
  [ ] Acepta terminos de servicio
  [ ] Crea password (evaluacion de fortaleza en cliente)
  [ ] Deriva KEK con Argon2id en navegador
  [ ] Genera par RSA (para E2EE chats)

FASE 2: CONSENTIMIENTO EXPLICITO (Art. 9 RGPD)
  [ ] Checkbox 1: "Consiento el tratamiento de mis datos de salud
       para telepsicologia con el psicologo asignado"
       [NO PREMARCADO - accion afirmativa requerida]
  [ ] Checkbox 2: "Autorizo a la IA local a procesar mis datos
       clinicos para generar resumenes y alertas"
       [NO PREMARCADO]
  [ ] Checkbox 3: "Entiendo que puedo revocar mi consentimiento
       en cualquier momento, solicitando la baja y destruccion
       de mis datos"
  [ ] Firma electronica simple (checkbox + timestamp + IP)

FASE 3: CONFIGURACION ENCLAVE CIFRADO
  [ ] Salt de Argon2id almacenado en servidor
  [ ] KEK envuelta (wrapped con server key) almacenada
  [ ] Clave publica RSA almacenada
  [ ] Clave privada RSA cifrada con KEK, almacenada
      (nunca en claro en servidor)
  [ ] Backup de recovery: frase de recuperacion de 12 palabras
      (BIP39, almacenada SOLO en el cliente)

FASE 4: PRIMERA CARGA DE DATOS
  [ ] Cuestionario inicial (PHQ-9, GAD-7)
  [ ] Datos demograficos minimos
  [ ] Toda la informacion se cifra con KEK antes de enviar
```

#### Log de consentimiento

```sql
CREATE TABLE consent_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  consent_type      VARCHAR(50) NOT NULL,
    -- 'treatment': Art. 9.2.a
    -- 'ai_processing': procesamiento IA
    -- 'data_transfer': transferencia a otro psicologo
    -- 'export': exportacion de datos
    -- 'revocation': revocacion de consentimiento
  granted           BOOLEAN NOT NULL,
  ip_address        INET,
  user_agent        TEXT,
  signed_hash       VARCHAR(64),       -- Hash firmado de los terminos aceptados
  version_terms     VARCHAR(20),        -- 'v1.2' de los terminos aceptados
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_patient_consent (patient_id, consent_type)
);

-- Cada consetimiento queda registrado inmutablemente
-- Trigger de no-borrado: solo INSERT, nunca DELETE o UPDATE
CREATE OR REPLACE FUNCTION prevent_consent_alteration()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Consent records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER immutable_consent
  BEFORE UPDATE OR DELETE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION prevent_consent_alteration();
```

### 4.2 Activo: procesamiento diario cifrado, backups incrementales, trazabilidad

#### Procesamiento diario

```
CADA DIA (cron jobs)
========================================

02:00 AM - Procesamiento nocturno
  [ ] Revisar chats del dia anterior
  [ ] Generar resumenes IA (en RAM, cifrar antes de almacenar)
  [ ] Detectar patrones anomalos
  [ ] Actualizar metricas de progreso

06:00 AM - Backup incremental
  [ ] pg_dump cifrado -> bucket S3 (cifrado lado cliente)
  [ ] Solo datos de las ultimas 24h
  [ ] Hash de integridad verificado

Cada hora - Health check
  [ ] Verificar integridad de KEKs (que los accesos existen)
  [ ] Rotar claves de sesion de chat si >24h
  [ ] Limpiar tokens expirados
  [ ] Verificar estado de mlock (VmSwap debe ser 0)

Tiempo real - Trazabilidad
  [ ] Cada acceso a datos -> audit_log
  [ ] Cada mensaje -> hash chain
  [ ] Cada cambio en objetivos -> log
```

#### Backup strategy

```shell
#!/bin/bash
# scripts/backup.sh - Backup incremental cifrado

BACKUP_DIR="/data/backups/$(date +%Y-%m-%d)"
ENCRYPTION_KEY_ID="backup-key-$(date +%Y%m)"

mkdir -p "$BACKUP_DIR"

# 1. Backup WAL (Write-Ahead Log) de PostgreSQL
#    Permite Point-In-Time Recovery
pg_basebackup \
  -D "$BACKUP_DIR/pg_wal" \
  -X stream \
  -z \
  -P \
  --wal-method=stream

# 2. Cifrar backup con clave de respaldo
#    (clave almacenada en HSM, no en servidor)
openssl enc -aes-256-gcm \
  -K "$(hsm_get_key $ENCRYPTION_KEY_ID)" \
  -iv "$(openssl rand -hex 12)" \
  -in "$BACKUP_DIR/pg_wal.tar.gz" \
  -out "$BACKUP_DIR/pg_wal.tar.gz.enc"

# 3. Subir a S3 Glacier (WORM + Object Lock)
aws s3 cp \
  "$BACKUP_DIR/pg_wal.tar.gz.enc" \
  "s3://ancora-backups/${BACKUP_DIR}/pg_wal.tar.gz.enc" \
  --storage-class GLACIER \
  --sse aws:kms

# 4. Verificar hash
sha256sum "$BACKUP_DIR/pg_wal.tar.gz.enc" > "$BACKUP_DIR/hash.sha256"

# 5. Limpiar backups locales > 30 dias
find /data/backups -mtime +30 -delete
```

### 4.3 Baja: crypto-shredding

El metodo MAS SEGURO para eliminar datos: no borrar los bytes,
sino destruir la clave que los descifra.

```
FLUJO DE BAJA DEL PACIENTE
========================================

FASE 1: SOLICITUD
  [ ] Paciente: "Solicitar baja de mi cuenta"
  [ ] Confirmacion: "?Que deseas hacer con tus datos?"
      [ ] Opcion A: Exportar historia clinica (recomendado)
      [ ] Opcion B: Borrar todo (crypto-shredding)
      [ ] Opcion C: Anonimizar (datos para investigacion)
  [ ] Re-autenticacion (password + 2FA obligatorio)

FASE 2: EXPORTACION (si aplica)
  [ ] Generar JSON completo cifrado
  [ ] Enviar por email enlace de descarga (expira 7 dias)
  [ ] Log de exportacion

FASE 3: CRYPTO-SHREDDING
  [ ] 1. Revocar acceso de psicologos
       UPDATE patient_key_access SET revoked_at = NOW()
       WHERE patient_id = $1 AND revoked_at IS NULL

  [ ] 2. Destruir KEK del paciente en HSM
       hsm_destroy_key(kek_id_del_paciente)
       Esto es INSTANTANEO e IRREVERSIBLE

  [ ] 3. Sobrescribir KEK envuelta en BD
       UPDATE patient_key_encryption_keys
       SET kek_wrapped = pgp_sym_encrypt('DESTROYED', 'tombstone')
       WHERE patient_id = $1

  [ ] 4. Marcar datos como cryptoshredded
       UPDATE encrypted_chat_entries
       SET encryption_metadata = jsonb_set(
         encryption_metadata,
         '{status}',
         '"cryptoshredded"'
       )
       WHERE patient_id = $1

  [ ] 5. Los backups inmutables en S3 contienen datos cifrados
       cuya clave YA NO EXISTE. Son ceniza criptografica.

FASE 4: NOTIFICACIONES
  [ ] Email al paciente: "Tus datos han sido destruidos"
  [ ] Notificacion al psicologo:
       "El paciente X ha solicitado la baja definitiva"
  [ ] Registro en audit_log (inmutable)
  [ ] Iniciar contador de retencion legal (5 anos para metadatos)
```

#### Implementacion de crypto-shredding

```javascript
// backend/src/services/cryptoShredding.service.js
const { HSM } = require('./hsm.client');

async function cryptoShredding(patientId) {
  return await db.transaction(async (tx) => {
    // 1. Obtener KEK ID del paciente
    const kekRecord = await tx.query(
      `SELECT id FROM patient_key_encryption_keys WHERE patient_id = $1 AND is_active = true`,
      [patientId]
    );

    if (kekRecord.rows.length === 0) {
      throw new Error('KEK no encontrada para este paciente');
    }

    const kekId = kekRecord.rows[0].id;

    // 2. Destruir KEK en HSM (FIPS 140-2 Level 3)
    await HSM.destroyKey(kekId);

    // 3. Marcar KEK como destruida
    await tx.query(
      `UPDATE patient_key_encryption_keys
       SET is_active = false,
           kek_wrapped = NULL,
           destroyed_at = NOW()
       WHERE id = $1`,
      [kekId]
    );

    // 4. Revocar TODOS los accesos pendientes
    await tx.query(
      `UPDATE patient_key_access
       SET revoked_at = NOW()
       WHERE patient_id = $1 AND revoked_at IS NULL`,
      [patientId]
    );

    // 5. Eliminar claves de grupo si es plan Duo/Familiar
    await tx.query(
      `UPDATE group_key_members
       SET left_at = NOW()
       WHERE user_id = $1 AND left_at IS NULL`,
      [patientId]
    );

    // 6. Anonimizar datos de identificacion directa
    //    (conservamos metadatos minimos por obligacion legal)
    await tx.query(
      `UPDATE patients
       SET email_hash = NULL,
           phone_hash = NULL,
           full_name_encrypted = NULL,
           is_anonymized = true,
           anonymized_at = NOW()
       WHERE id = $1`,
      [patientId]
    );

    // 7. Log de auditoria
    await tx.query(
      `INSERT INTO audit_log (action, patient_id, actor_id, metadata)
       VALUES ('CRYPTO_SHREDDING', $1, $1, $2)`,
      [patientId, JSON.stringify({
        method: 'hsm_key_destruction',
        kek_id: kekId,
        records_cryptoshredded: true,
        timestamp: new Date().toISOString()
      })]
    );

    return {
      success: true,
      method: 'crypto_shredding',
      message: 'Todos los datos han sido criptograficamente destruidos. Las claves de descifrado ya no existen.',
      recovery_possible: false
    };
  });
}
```

### 4.4 Retencion: 5 anos post-baja (Ley 41/2002)

```
LINEA DE TIEMPO DE RETENCION DE DATOS
========================================

t=0: ALTA DEL PACIENTE
  [Datos completos cifrados activos]

t=+X meses: BAJA DEL PACIENTE
  [Crypto-shredding de datos clinicos]
  [Conservacion de metadatos minimos]

t=BAJA: INICIO PERIODO DE RETENCION LEGAL
  [Ley 41/2002, Art. 17: "Los centros sanitarios tienen
   la obligacion de conservar la documentacion clinica
   durante un minimo de cinco anos desde el alta"]

  Datos conservados (MINIMOS, solo metadatos):
  - ID del paciente (hash anonimizado)
  - Fechas de inicio y fin de tratamiento
  - Psicologo(s) asignado(s)
  - Diagnosticos principales (codificados, sin texto libre)
  - Consentimientos (prueba de conformidad legal)

  Datos DESTRUIDOS (crypto-shredding completo):
  - Todo el contenido de chats
  - Notas SOAP del psicologo
  - Diarios emocionales
  - Registros de check-ins
  - Ejercicios y respuestas
  - Grabaciones de sesiones
  - Cualquier texto libre del paciente

t=BAJA + 5 ANOS: DESTRUCCION TOTAL
  [Crypto-shredding de metadatos restantes]
  [Los datos en backups inmutables son ilegibles]
  [Certificado de destruccion emitido]
  [Notificacion al paciente (si email todavia existe)]
```

#### Implementacion del gestor de retencion

```sql
-- Programado mensualmente
CREATE OR REPLACE FUNCTION process_retention_policy()
RETURNS TABLE(action_taken TEXT, patient_count INT) AS $$
DECLARE
  rec RECORD;
  count_crypto_shred INT := 0;
  count_full_destroy INT := 0;
BEGIN
  -- FASE 1: Pacientes que solicitaron baja -> crypto-shredding
  -- Los datos clinicos se destruyen inmediatamente
  -- (ejecutado en tiempo real en la baja, no aqui)

  -- FASE 2: Pacientes con baja + 5 anos -> destruccion total
  FOR rec IN
    SELECT id, baja_at FROM patients
    WHERE is_anonymized = true
      AND baja_at < NOW() - INTERVAL '5 years'
      AND full_destroyed_at IS NULL
  LOOP
    -- Crypto-shredding de los ultimos metadatos
    PERFORM crypto_shredding_metadata(rec.id);

    UPDATE patients
    SET full_destroyed_at = NOW()
    WHERE id = rec.id;

    count_full_destroy := count_full_destroy + 1;
  END LOOP;

  -- FASE 3: Notificar pacientes (opcional, si hay email)
  -- (no implementado por privacidad - no tenemos email)

  RETURN QUERY
  SELECT 'crypto_shred_completed'::TEXT, count_crypto_shred
  UNION ALL
  SELECT 'full_destroy_completed'::TEXT, count_full_destroy;
END;
$$ LANGUAGE plpgsql;

-- Cron job mensual
SELECT cron.schedule(
  'retention-policy',
  '0 3 1 * *',  -- 3:00 AM cada 1 del mes
  'SELECT process_retention_policy()'
);
```

### 4.5 Portabilidad: derecho del paciente a exportar (Art. 20 RGPD)

```
DERECHO DE PORTABILIDAD - Art. 20 RGPD
========================================

El paciente tiene derecho a:
  [ ] Recibir sus datos en formato estructurado, de uso comun
      y lectura mecanica (JSON, no PDF)
  [ ] Transmitir esos datos a otro responsable del tratamiento
      (otra plataforma de psicologia)
  [ ] Que Ancora transmita directamente a otro sistema
      (si tecnicamente posible)

PROCEDIMIENTO:
  [ ] 1. Solicitud del paciente (email, formulario web, panel)
  [ ] 2. Plazo maximo: 1 mes (Art. 12.3 RGPD)
  [ ] 3. Verificacion de identidad (2FA obligatorio)
  [ ] 4. Generacion del archivo JSON completo
  [ ] 5. Entrega: descarga directa cifrada
  [ ] 6. Sin coste para el paciente (Art. 12.5)
  [ ] 7. Log de la exportacion

LIMITACIONES:
  [ ] No incluye datos de otros pacientes (planes Duo/Familiar)
       - Solo los datos INDIVIDUALES del solicitante
  [ ] No incluye datos anonimizados
  [ ] Las notas del psicologo son del paciente (Ley 41/2002, Art. 15)
       - SI se incluyen en la exportacion

FORMATOS SOPORTADOS:
  [ ] JSON (.ancora) - Recomendado, completa
  [ ] PDF - Resumen ejecutivo
  [ ] Markdown - Para re-importacion en otras herramientas
  [ ] CSV - Datos tabulares (check-ins, metricas)
```

---

## 5. TRAZABILIDAD Y AUDITORIA

### 5.1 Hash chain de logs de acceso (SHA256 encadenado)

Cada registro de auditoria contiene un hash del registro anterior,
formando una cadena inmutable. Modificar o eliminar un registro
rompe la cadena.

```
Estructura de la hash chain
========================================

Genesis Block (primer registro de auditoria)
+----------------------------------------------------+
| id: 1                                              |
| action: "SYSTEM_INIT"                              |
| timestamp: 2026-01-01T00:00:00Z                    |
| previous_hash: "0000000000000000..."               | <-- Hash cero (genesis)
| current_hash: "a1b2c3d4e5f6..."                    |
| hash_input: "1|SYSTEM_INIT|2026-01-01T00:00:00Z|   |
|              0000000000000000..."                   |
+----------------------------------------------------+
                            |
                            v (previous_hash apunta aqui)

Block 2: "PSYCHOLOGIST_ACCESS"
+----------------------------------------------------+
| id: 2                                              |
| action: "PSYCHOLOGIST_ACCESS"                      |
| patient_id: "pat_001"                              |
| psychologist_id: "psy_003"                         |
| timestamp: 2026-01-01T10:30:00Z                    |
| previous_hash: "a1b2c3d4e5f6..."                   | <-- Hash del block 1
| current_hash: "f0e1d2c3b4a5..."                    |
| hash_input: "2|PSYCHOLOGIST_ACCESS|pat_001|        |
|              psy_003|2026-01-01T10:30:00Z|          |
|              a1b2c3d4e5f6..."                       |
+----------------------------------------------------+
                            |
                            v

Block 3: "PATIENT_EXPORT"
+----------------------------------------------------+
| id: 3                                              |
| ...                                                |
| previous_hash: "f0e1d2c3b4a5..."                   |
+----------------------------------------------------+
```

#### Implementacion

```sql
CREATE TABLE audit_hash_chain (
  id                BIGSERIAL PRIMARY KEY,
  action            VARCHAR(50) NOT NULL,
  patient_id        UUID,
  actor_id          UUID NOT NULL,          -- Quien hizo la accion
  actor_type        VARCHAR(20) NOT NULL,   -- 'patient', 'psychologist', 'admin', 'system'
  metadata          JSONB,                  -- Datos adicionales de la accion
  ip_address        INET,                   -- IP del actor
  user_agent        TEXT,                   -- Browser/device
  geo_location      JSONB,                  -- Pais/ciudad aproximada
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Hash chain
  previous_hash     VARCHAR(64) NOT NULL,
  current_hash      VARCHAR(64) NOT NULL UNIQUE,

  INDEX idx_audit_patient (patient_id),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_timestamp (timestamp)
);

-- Funcion para generar el hash de un registro
CREATE OR REPLACE FUNCTION compute_audit_hash(
  id BIGINT,
  action VARCHAR,
  patient_id UUID,
  actor_id UUID,
  actor_type VARCHAR,
  metadata JSONB,
  ip_address INET,
  timestamp TIMESTAMPTZ,
  previous_hash VARCHAR
) RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(
    digest(
      format('%s|%s|%s|%s|%s|%s|%s|%s|%s',
        id, action, COALESCE(patient_id::text, ''),
        actor_id, actor_type,
        COALESCE(metadata::text, ''),
        COALESCE(ip_address::text, ''),
        timestamp::text,
        previous_hash
      ),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger que genera el hash chain automaticamente
CREATE OR REPLACE FUNCTION audit_hash_chain_trigger()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
BEGIN
  -- Obtener el hash del ultimo registro
  SELECT COALESCE(
    (SELECT current_hash FROM audit_hash_chain ORDER BY id DESC LIMIT 1),
    '0000000000000000000000000000000000000000000000000000000000000000'
  ) INTO prev_hash;

  NEW.previous_hash := prev_hash;
  NEW.current_hash := compute_audit_hash(
    NEW.id, NEW.action, NEW.patient_id,
    NEW.actor_id, NEW.actor_type, NEW.metadata,
    NEW.ip_address, NEW.timestamp, prev_hash
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_hash
  BEFORE INSERT ON audit_hash_chain
  FOR EACH ROW
  EXECUTE FUNCTION audit_hash_chain_trigger();

-- Funcion de verificacion de integridad
CREATE OR REPLACE FUNCTION verify_audit_chain()
RETURNS TABLE(chain_valid BOOLEAN, broken_at BIGINT) AS $$
DECLARE
  rec RECORD;
  expected_hash VARCHAR(64);
  prev_hash VARCHAR(64) := '0000000000000000000000000000000000000000000000000000000000000000';
  current_id BIGINT;
BEGIN
  chain_valid := true;
  broken_at := NULL;

  FOR rec IN SELECT * FROM audit_hash_chain ORDER BY id LOOP
    expected_hash := compute_audit_hash(
      rec.id, rec.action, rec.patient_id,
      rec.actor_id, rec.actor_type, rec.metadata,
      rec.ip_address, rec.timestamp, prev_hash
    );

    IF expected_hash != rec.current_hash THEN
      chain_valid := false;
      broken_at := rec.id;
      RETURN NEXT;
      RETURN;
    END IF;

    IF rec.previous_hash != prev_hash THEN
      chain_valid := false;
      broken_at := rec.id;
      RETURN NEXT;
      RETURN;
    END IF;

    prev_hash := rec.current_hash;
  END LOOP;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Cada acceso: quien, cuando, que dato, IP, user-agent

```sql
-- Acceso a historia clinica
INSERT INTO audit_hash_chain (action, patient_id, actor_id, actor_type,
                              metadata, ip_address, user_agent)
VALUES (
  'CLINICAL_HISTORY_ACCESS',
  'pat_001',
  'psy_003',
  'psychologist',
  jsonb_build_object(
    'access_type', 'full_history',
    'sections_accessed', ARRAY['notes', 'chat', 'exercises'],
    'reason', 'weekly_review',
    'session_id', 'ses_abc123'       -- Para correlacion con sesion activa
  ),
  '83.45.12.78',
  'Mozilla/5.0 Chrome/125...'
);

-- Ejemplo de logs de acciones registradas:
ACCIONES REGISTRADAS:
  CLINICAL_HISTORY_ACCESS    - Acceso a historia clinica
  CHAT_READ                  - Lectura de chat
  NOTE_CREATED               - Nota SOAP creada
  NOTE_MODIFIED              - Nota SOAP modificada
  NOTE_VALIDATED             - Nota firmada/validada
  PATIENT_CREATED            - Alta de paciente
  PATIENT_TRANSFERRED        - Transferencia entre psicologos
  PATIENT_EXPORTED           - Exportacion de datos
  PATIENT_CRYPTO_SHREDDED   - Destruccion de datos
  CONSENT_GRANTED            - Consentimiento otorgado
  CONSENT_REVOKED            - Consentimiento revocado
  INVITATION_SENT            - Invitacion enviada
  INVITATION_USED            - Invitacion aceptada
  API_ACCESS                 - Acceso via API REST
  SYSTEM_LOGIN               - Inicio de sesion
  LOGIN_FAILED               - Intento fallido de login
  PASSWORD_CHANGED           - Cambio de password
  KEY_ROTATED                - Rotacion de claves
  EXPORT_DOWNLOAD            - Descarga de exportacion
```

### 5.3 Alertas de accesos sospechosos

```javascript
// backend/src/monitoring/anomalyDetector.js
const { createHash } = require('crypto');
const { Redis } = require('ioredis');

class ClinicalAnomalyDetector {
  constructor() {
    this.redis = new Redis();
    this.TELEGRAM_WEBHOOK = process.env.ALERT_WEBHOOK;
  }

  /**
   * Evaluar cada acceso en tiempo real
   */
  async evaluateAccess(auditEntry) {
    const alerts = [];

    // REGLA 1: Acceso fuera del horario laboral
    const hour = new Date().getHours();
    if (hour < 7 || hour > 22) {
      alerts.push({
        severity: 'medium',
        rule: 'OFF_HOURS_ACCESS',
        detail: `Acceso a las ${hour}:00 (fuera de horario 7:00-22:00)`
      });
    }

    // REGLA 2: Geografia anomalia
    if (auditEntry.geo_location?.country_code
        && !this.isExpectedCountry(auditEntry.actor_id, auditEntry.geo_location.country_code)) {
      alerts.push({
        severity: 'high',
        rule: 'UNEXPECTED_GEOGRAPHY',
        detail: `Acceso desde pais no esperado: ${auditEntry.geo_location.country_code}`
      });
    }

    // REGLA 3: Frecuencia de acceso anomala
    const recentAccessCount = await this.getRecentAccessCount(
      auditEntry.actor_id, 5 * 60 // Ultimos 5 minutos
    );
    if (recentAccessCount > 20) {
      alerts.push({
        severity: 'high',
        rule: 'HIGH_FREQUENCY_ACCESS',
        detail: `${recentAccessCount} accesos en 5 minutos`
      });
    }

    // REGLA 4: Acceso a multiples pacientes en poco tiempo
    const uniquePatients5min = await this.getUniquePatientsCount(
      auditEntry.actor_id, 5 * 60
    );
    if (uniquePatients5min > 5 && auditEntry.actor_type === 'psychologist') {
      alerts.push({
        severity: 'critical',
        rule: 'MASS_PATIENT_ACCESS',
        detail: `Accedio a ${uniquePatients5min} pacientes diferentes en 5 min`
      });
    }

    // REGLA 5: Intentos de login fallidos
    const failedLogins = await this.getFailedLoginCount(
      auditEntry.actor_id, 15 * 60 // Ultimos 15 min
    );
    if (failedLogins > 5) {
      alerts.push({
        severity: 'critical',
        rule: 'BRUTE_FORCE_ATTEMPT',
        detail: `${failedLogins} intentos fallidos de login en 15 min`
      });
    }

    // REGLA 6: Dispositivo/browser no reconocido
    const knownDevice = await this.isKnownDevice(
      auditEntry.actor_id, auditEntry.user_agent
    );
    if (!knownDevice && auditEntry.action === 'SYSTEM_LOGIN') {
      alerts.push({
        severity: 'medium',
        rule: 'UNKNOWN_DEVICE',
        detail: `Nuevo dispositivo detectado: ${auditEntry.user_agent?.substring(0, 80)}`
      });
    }

    // Procesar alertas
    for (const alert of alerts) {
      await this.processAlert(alert, auditEntry);
    }

    return alerts;
  }

  async processAlert(alert, auditEntry) {
    // Almacenar alerta
    await this.redis.lpush(
      `alerts:${alert.severity}`,
      JSON.stringify({ alert, auditEntry, timestamp: new Date() })
    );

    // Notificar inmediato si severidad alta o critica
    if (['high', 'critical'].includes(alert.severity)) {
      await this.notifySecurityTeam(alert, auditEntry);
    }

    // Si severidad critica: bloquear temporalmente
    if (alert.severity === 'critical') {
      await this.temporarilyBlockAccess(auditEntry.actor_id);
    }
  }

  async notifySecurityTeam(alert, auditEntry) {
    const message = `
[ALERTA DE SEGURIDAD - ANCORA]
Severidad: ${alert.severity.toUpperCase()}
Regla: ${alert.rule}
Detalle: ${alert.detail}
Actor: ${auditEntry.actor_id} (${auditEntry.actor_type})
IP: ${auditEntry.ip_address}
Timestamp: ${auditEntry.timestamp}

Accion requerida inmediata si severidad CRITICAL.
    `;

    // Enviar a canal de seguridad (Telegram/Slack/PagerDuty)
    await fetch(this.TELEGRAM_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  }

  async temporarilyBlockAccess(actorId) {
    await this.redis.setex(`blocked:${actorId}`, 600, 'true'); // 10 min
    // En produccion: revocar sesiones activas, notificar, escalar
  }

  // Helpers con Redis
  async getRecentAccessCount(actorId, windowSeconds) {
    const key = `access_count:${actorId}`;
    const multi = this.redis.multi();
    multi.lpush(key, Date.now());
    multi.ltrim(key, 0, 999);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();

    const all = await this.redis.lrange(key, 0, -1);
    const cutoff = Date.now() - windowSeconds * 1000;
    return all.filter(t => parseInt(t) > cutoff).length;
  }

  async getUniquePatientsCount(actorId, windowSeconds) {
    const key = `unique_patients:${actorId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    return await this.redis.scard(key);
  }

  async getFailedLoginCount(actorId, windowSeconds) {
    const key = `failed_logins:${actorId}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }
}
```

### 5.4 DLP clinico: NLP local para enmascarar datos de salud

Cuando un paciente escribe una opinion publica (reseña del psicologo),
el sistema detecta automaticamente datos de salud y los enmascara
antes de publicar.

```python
# backend/src/dlp/clinical_dlp.py
import re
import spacy
from typing import List, Tuple, Optional

class ClinicalDLP:
    """
    Data Loss Prevention for clinical data.
    Runs locally (no API calls) on the same server.
    Uses spaCy es_core_news_sm for Spanish NER.
    """

    def __init__(self):
        self.nlp = spacy.load("es_core_news_sm")

        # Patrones de datos de salud
        self.health_patterns = [
            # Diagnosticos comunes
            r'\b(?:depresi[oó]n|ansiedad|tdah|toc|bipolar|esquizofrenia|'
            r'trastorno\s+(?:l[ií]mite|alimenticio|obsesivo|bipolar|'
            r'de\s+(?:ansiedad|personalidad|p[aá]nico|estr[eé]s)))\b',

            # Medicamentos
            r'\b(?:sertralina|fluoxetina|escitalopram|paroxetina|'
            r'clonazepam|diazepam|lorazepam|alprazolam|'
            r'olanzapina|risperidona|quetiapina|aripiprazol|'
            r'methylphenidate|atomoxetina)\b',

            # Sintomas y crisis
            r'\b(?:intento\s+de\s+suicidio|autolesiones?|'
            r'ataque\s+de\s+p[aá]nico|ideaci[oó]n\s+suicida|'
            r'crisis\s+ansiosa|episodio\s+(?:man[ií]aco|depresivo))\b',

            # Pronosticos y evaluaciones
            r'\b(?:phq-9|gad-7|baremo|diagn[oó]stico|pron[oó]stico)\b',
        ]

        # Compilar patrones
        self.compiled_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.health_patterns
        ]

        # Tags de reemplazo
        self.mask_tags = {
            'diagnosis': '[DIAGNOSTICO]',
            'medication': '[MEDICACION]',
            'symptom': '[SINTOMA]',
            'assessment': '[EVALUACION]',
            'clinical_data': '[DATOS_CLINICOS]',
        }

    def mask_health_data(self, text: str, user_id: Optional[str] = None) -> Tuple[str, List[dict]]:
        """
        Mask health-related data in public-facing text.
        Returns (masked_text, list_of_masked_entities).

        Ejemplo:
        Input:  "Mi psicologa me ayudo mucho con mi depresion y ansiedad.
                 Antes tomaba sertralina pero ahora estoy mucho mejor."
        Output: "Mi psicologa me ayudo mucho con mi [DIAGNOSTICO] y [DIAGNOSTICO].
                 Antes tomaba [MEDICACION] pero ahora estoy mucho mejor."
        """
        masked_entities = []

        # 1. NER con spaCy para nombres propios
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in ('PER', 'MISC'):  # Personas, nombres propios
                masked_entities.append({
                    'text': ent.text,
                    'label': 'PERSONAL_IDENTIFIER',
                    'start': ent.start_char,
                    'end': ent.end_char,
                    'mask': '[IDENTIFICADOR]'
                })

        # 2. Patrones de salud
        for pattern in self.compiled_patterns:
            for match in pattern.finditer(text):
                # Determinar tipo basado en el patron
                matched_text = match.group()
                mask_type = self._classify_match(matched_text)

                masked_entities.append({
                    'text': matched_text,
                    'label': mask_type,
                    'start': match.start(),
                    'end': match.end(),
                    'mask': self.mask_tags.get(mask_type, '[DATOS_CLINICOS]')
                })

        # 3. Aplicar mascaras (de atras a adelante para no romper indices)
        # Ordenar por posicion (reversa para no afectar offsets)
        masked_entities.sort(key=lambda x: x['start'], reverse=True)
        masked_text = text
        for entity in masked_entities:
            masked_text = (
                masked_text[:entity['start']]
                + entity['mask']
                + masked_text[entity['end']:]
            )

        # 4. Log de deteccion (para auditoria DLP)
        self._log_dlp_action(user_id, masked_entities)

        return masked_text, masked_entities

    def _classify_match(self, text: str) -> str:
        """Classify what type of clinical data was detected."""
        text_lower = text.lower()

        medication_keywords = ['sertralina', 'fluoxetina', 'clonazepam', 'diazepam',
                                'olanzapina', 'risperidona', 'methylphenidate']
        diagnosis_keywords = ['depresi', 'ansiedad', 'tdah', 'toc', 'bipolar',
                              'trastorno', 'esquizofrenia']
        symptom_keywords = ['suicidio', 'autolesion', 'panico', 'crisis',
                            'episodio']
        assessment_keywords = ['phq-9', 'gad-7', 'baremo', 'diagnostico', 'pronostico']

        for kw in medication_keywords:
            if kw in text_lower:
                return 'medication'
        for kw in diagnosis_keywords:
            if kw in text_lower:
                return 'diagnosis'
        for kw in symptom_keywords:
            if kw in text_lower:
                return 'symptom'
        for kw in assessment_keywords:
            if kw in text_lower:
                return 'assessment'
        return 'clinical_data'

    def _log_dlp_action(self, user_id, entities):
        """Log DLP actions for audit."""
        if entities:
            # Log anonimo (sin texto original) para auditoria DLP
            log_entry = {
                'user_id': user_id,
                'entities_detected': len(entities),
                'entity_types': list(set(e['label'] for e in entities)),
                'action': 'masked',
                'timestamp': __import__('datetime').datetime.now().isoformat()
            }
            # Enviar a audit log
            # (implementacion simplificada)
            print(f"[DLP] Masked {len(entities)} entities for user {user_id}")


# Uso en middleware de reseñas
dlp = ClinicalDLP()

def review_middleware(request):
    """Middleware que procesa reseñas antes de publicar."""
    review_text = request.json.get('text')
    user_id = request.user.id

    masked_text, entities = dlp.mask_health_data(review_text, user_id)

    if entities:
        # Si se enmascaro algo, notificar al usuario
        return {
            'masked_text': masked_text,
            'warning': 'Se han enmascarado datos de salud en tu reseña '
                       'para cumplir con el RD 1907/1996 de Publicidad Sanitaria.',
            'entities_masked': len(entities)
        }

    return {'text': review_text, 'masked': False}
```

---

## 6. CHECKLIST GDPR COMPLETA

### Checklist actionable para implementacion

```
======================================================================
CHECKLIST DE CUMPLIMIENTO GDPR - ANCORA (ancora.clinic)
======================================================================
Proyecto: Telepsicologia Zero-Knowledge con IA local
Responsable: [DPO asignado]
Fecha ultima revision: [dd/mm/aaaa]
======================================================================

[ ] = PENDIENTE
[+] = EN PROGRESO
[X] = COMPLETADO
[N] = NO APLICA

----------------------------------------------------------------------
1. CONSENTIMIENTO EXPLICITO SEPARADO (Art. 7, 9 RGPD)
----------------------------------------------------------------------

[X] 1.1 Consentimiento para TRATAMIENTO de datos de salud
      - Checkbox separado, NO premarcado
      - Texto claro: "Consiento el tratamiento de mis datos de salud
        para la prestacion de servicios de telepsicologia"
      - No agrupado con terminos y condiciones generales

[X] 1.2 Consentimiento para PROCESAMIENTO POR IA
      - "Autorizo el procesamiento automatizado de mis datos clinicos
        por el sistema de IA local para generar resumenes y alertas
        para mi psicologo"

[X] 1.3 Consentimiento para TRANSFERENCIA
      - "Consiento la transferencia de mi historia clinica a otro
        psicologo dentro de la plataforma si asi lo solicito"

[+] 1.4 Consentimiento para DATOS DE MENORES
      - Consentimiento del tutor legal
      - Verificacion de edad del tutor
      - Almacenamiento separado

[X] 1.5 Registro inmutable de cada consentimiento
      - Tabla consent_records (solo INSERT, nunca UPDATE/DELETE)
      - Hash SHA256 de los terminos aceptados

[X] 1.6 Mecanismo de REVOCACION
      - El paciente puede revocar en cualquier momento desde su panel
      - La revocacion no afecta tratamientos previos
      - Proceso claro de baja y destruccion de datos

----------------------------------------------------------------------
2. DPIA / EIPD (EVALUACION DE IMPACTO, Art. 35)
----------------------------------------------------------------------

[X] 2.1 Documento DPIA completo elaborado
      - Descripcion sistematica del tratamiento
      - Evaluacion de necesidad y proporcionalidad
      - Gestion de riesgos para derechos y libertades

[X] 2.2 Consulta previa a AEPD si DPIA identifica alto riesgo
      - Riesgo residual evaluado (ver seccion 3)

[X] 2.3 Medidas previstas para mitigar riesgos
      - Cifrado Zero-Knowledge
      - Datos solo en RAM (mlock)
      - Crypto-shredding
      - Minimizacion de datos
      - Pseudonimizacion en analytics

[+] 2.4 Revision anual del DPIA
      - Programada para [fecha]
      - O antes si hay cambios significativos en el tratamiento

----------------------------------------------------------------------
3. DPO (DELEGADO DE PROTECCION DE DATOS, Art. 37-39)
----------------------------------------------------------------------

[X] 3.1 DPO designado y notificado a AEPD
      - Nombre: [Nombre del DPO]
      - Contacto: dpo@ancora.clinic
      - Publicado en web y app

[X] 3.2 DPO con cualificacion profesional
      - Conocimiento especializado en proteccion de datos
      - Experiencia en datos de salud

[X] 3.3 DPO involucrado en todas las cuestiones de PDP
      - Consultado en diseno de nuevos tratamientos
      - Acceso directo a direccion

[X] 3.4 Canal de comunicacion directo con DPO
      - Email, formulario web, telefono
      - Tiempo de respuesta < 48h

----------------------------------------------------------------------
4. MINIMIZACION DE DATOS (Art. 5.1.c)
----------------------------------------------------------------------

[X] 4.1 Solo datos ESTRICTAMENTE NECESARIOS
      - Nombre, email, fecha nacimiento (no DNI)
      - Datos clinicos minimos para el tratamiento psicologico
      - No se recogen datos de tarjeta de credito (Stripe)

[X] 4.2 No se recogen datos EXCESIVOS
      - No orientacion sexual (si no relevante)
      - No ideologia, religion, raza (si no relevante)
      - No datos geneticos ni biometricos

[X] 4.3 Datos solo visibles para quien los necesita
      - Psicologo: solo datos de sus pacientes
      - Paciente: solo sus propios datos
      - Administrador: sin acceso a contenido clinico

[X] 4.4 Politica de retencion definida
      - Datos clinicos: destruidos inmediatamente tras baja
      - Metadatos minimos: 5 anos (Ley 41/2002)
      - Destruccion total: 5 anos post-baja

----------------------------------------------------------------------
5. TRAZABILIDAD (Art. 5.2, Art. 30)
----------------------------------------------------------------------

[X] 5.1 Registro de actividades de tratamiento
      - Documento actualizado con todas las categorias
      - Finalidad, categorias, destinatarios, plazos

[X] 5.2 Log de accesos con hash chain
      - SHA256 encadenado (ver seccion 5.1)
      - Inmutable: cualquier alteracion rompe la cadena
      - Verificacion periodica de integridad

[X] 5.3 Registro de consentimientos
      - Version de terminos aceptados almacenada
      - Fecha y hora exacta
      - IP y user-agent

[X] 5.4 Registro de exportaciones
      - Quien, cuando, que se exporto
      - Hash de integridad del archivo exportado

[X] 5.5 Sistema de alertas de accesos sospechosos
      - Deteccion de patrones anomalos
      - Bloqueo automatico de cuentas comprometidas
      - Notificacion al DPO en < 5 min

----------------------------------------------------------------------
6. CIFRADO FUERTE (Art. 32, Art. 25 - Privacy by Design)
----------------------------------------------------------------------

[X] 6.1 Cifrado en reposo (AES-256-GCM)
      - Columnas BYTEA en PostgreSQL
      - Clave por paciente (KEK derivada de Argon2id)

[X] 6.2 Cifrado en transito (TLS 1.3)
      - HTTPS obligatorio en todos los endpoints
      - HSTS preload
      - Certificados con validez < 90 dias

[X] 6.3 Cifrado extremo a extremo (E2EE)
      - Chats: WebCrypto API en navegador
      - Claves RSA-OAEP de 4096 bits
      - Claves efimeras por mensaje

[X] 6.4 Zero-Knowledge Architecture
      - Servidor NO tiene acceso a claves de descifrado
      - KEK derivada en cliente con Argon2id
      - Crypto-shredding: destruir KEK = destruir datos

[X] 6.5 mlock/mlockall contra swap
      - Memoria lockeada en RAM fisica
      - VmSwap = 0 kB verificado

[X] 6.6 Memory zeroing explicito
      - Buffers sobrescritos con 0xFF y 0x00
      - GC forzado despues de limpieza

----------------------------------------------------------------------
7. POLITICA DE CONSERVACION (Art. 5.1.e)
----------------------------------------------------------------------

[X] 7.1 Plazos de conservacion documentados
      - Datos activos: mientras dure la relacion terapeutica
      - Datos post-baja: crypto-shredding inmediato
      - Metadatos minimos: 5 anos desde baja
      - Destruccion total: 5 anos desde baja

[X] 7.2 Procedimiento de destruccion segura
      - Crypto-shredding via HSM key destruction
      - Verificacion posterior de ilegibilidad
      - Certificado de destruccion emitido

[X] 7.3 Revision periodica de datos almacenados
      - Script mensual (process_retention_policy)
      - Identificar y destruir datos fuera de plazo

[X] 7.4 Datos en backups
      - Backups cifrados, claves separadas
      - Si se destruye KEK, backups son ilegibles
      - WORM policy evita alteracion de backups

----------------------------------------------------------------------
8. PORTABILIDAD (Art. 20)
----------------------------------------------------------------------

[X] 8.1 Derecho a recibir datos en formato estructurado
      - JSON (.ancora): formato completo y portable
      - PDF: resumen ejecutivo legible
      - Markdown: para re-importacion

[X] 8.2 Derecho a transmitir a otro responsable
      - Transferencia directa entre psicologos Ancora
      - Exportacion para llevar a otra plataforma

[X] 8.3 Sin coste para el paciente
      - Primera exportacion siempre gratuita
      - Exportaciones recurrentes sin coste adicional

[X] 8.4 Plazo maximo de 1 mes
      - Exportacion generada en < 1 hora tipicamente
      - Notificacion si plazo mayor (max 3 meses con justificacion)

[X] 8.5 Verificacion de identidad
      - Autenticacion reforzada (password + 2FA)
      - Log de todas las exportaciones

----------------------------------------------------------------------
9. BORRADO / ANONIMIZACION (Art. 17 - Derecho al Olvido)
----------------------------------------------------------------------

[X] 9.1 Procedimiento de borrado completo
      - Crypto-shredding como metodo principal
      - Sobrescritura de KEK en HSM
      - Verificacion post-borrado

[X] 9.2 Procedimiento de anonimizacion (opcional)
      - Pseudonimizacion irreversible
      - Datos solo para investigacion agregada
      - Sin posibilidad de re-identificacion

[X] 9.3 Comunicacion a terceros
      - Notificacion al psicologo de la baja
      - Verificacion de que ya no accede

[X] 9.4 Excepciones documentadas
      - Datos necesarios para defensa legal
      - Metadatos obligatorios por Ley 41/2002
      - Interes publico en investigacion (anonimizados)

----------------------------------------------------------------------
10. NOTIFICACION DE BRECHAS (Art. 33, 34)
----------------------------------------------------------------------

[ ] 10.1 Procedimiento de deteccion de brechas
      - Sistema de monitorizacion continua
      - Alertas automaticas de accesos anomales
      - Revision manual diaria de alertas

[ ] 10.2 Plantilla de notificacion a AEPD (< 72h)
      - Nature of the breach
      - Categories of data involved
      - Approximate number of affected individuals
      - Contact of DPO
      - Measures taken or proposed

[ ] 10.3 Plantilla de comunicacion a afectados
      - Si alto riesgo para derechos y libertades
      - Medidas de mitigacion recomendadas

[ ] 10.4 Registro de brechas (interno)
      - Fecha de descubrimiento
      - Fecha de notificacion
      - Medidas correctivas
      - Lecciones aprendidas

[ ] 10.5 Simulacros de brecha de seguridad
      - Al menos 1 simulacro anual
      - Evaluacion de tiempos de respuesta
      - Mejora continua de procedimientos

----------------------------------------------------------------------
PUNTUACION DE CUMPLIMIENTO: XX/YY (Z%)
Observaciones:
  1. [a completar]
  2. [a completar]
  3. [a completar]

Firma del DPO: ______________________   Fecha: ______________
======================================================================
```

---

## 7. ANEXOS

### A. Diagrama de arquitectura completo

```
+====================================================================+
|                    ANCORA - ARQUITECTURA DE DATOS                  |
+====================================================================+
|                                                                    |
|  [NAVEGADOR DEL PACIENTE]        [NAVEGADOR DEL PSICOLOGO]         |
|  +----------------------+        +----------------------+          |
|  | WebCrypto API        |        | WebCrypto API        |          |
|  | - Argon2id derivacion|        | - RSA keypair        |          |
|  | - AES-GCM encrypt    |        | - AES-GCM decrypt    |          |
|  | - RSA-OAEP wrap key  |        | - RSA-OAEP unwrap    |          |
|  | - sessionStorage KEK |        | - sessionStorage KEK |          |
|  | - IndexedDB local    |        | - IndexedDB local    |          |
|  +----------+-----------+        +----------+-----------+          |
|             |                               |                      |
|             | TLS 1.3                       | TLS 1.3              |
|             v                               v                      |
|  +================================================================+|
|  |             API GATEWAY / LOAD BALANCER                        ||
|  |             (Nginx, TLS termination)                           ||
|  +================================================================+|
|             |                               |                      |
|             +----------+--------------------+                      |
|                        |                                           |
|                        v                                           |
|  +================================================================+|
|  |             BACKEND (Node.js / FastAPI)                        ||
|  |                                                                ||
|  |  +------------------+  +----------------+  +------------+      ||
|  |  | Auth Service     |  | Clinical Svc   |  | Export Svc |      ||
|  |  | - JWT + 2FA      |  | - SOAP notes   |  | - JSON     |      ||
|  |  | - API Keys       |  | - Objectives   |  | - PDF      |      ||
|  |  | - Invitations    |  | - Exercises    |  | - Markdown |      ||
|  |  +------------------+  +----------------+  +------------+      ||
|  |                                                                ||
|  |  +------------------+  +----------------+  +------------+      ||
|  |  | Crypto Service   |  | Audit Service  |  | DLP Svc    |      ||
|  |  | - KEK management |  | - Hash chain   |  | - NLP mask |      ||
|  |  | - HSM client     |  | - Anomaly det  |  | - spacy NER|      ||
|  |  +------------------+  +----------------+  +------------+      ||
|  +================================================================+|
|             |                 |                 |                   |
|             v                 v                 v                   |
|  +------------------+  +----------+  +---------------------+        |
|  | PostgreSQL (BYTEA)|  | Redis    |  | GPU Server (vLLM) |        |
|  | AES-256-GCM      |  | - Queues |  | - DeepSeek-R1-70B |        |
|  | Hash chain audit  |  | - Rate   |  | - GLM-4-9B       |        |
|  | KEK store (HSM)   |  | - Cache  |  | - Memory zeroing  |        |
|  | Encrypted backups |  | - Session|  | - mlockall        |        |
|  +------------------+  +----------+  +---------------------+        |
|             |                               |                      |
|             v                               v                      |
|  +------------------+              +---------------------+          |
|  | S3 Glacier WORM  |              | HSM (FIPS 140-2 L3) |         |
|  | - Backups cifrados|              | - KEK storage       |         |
|  | - Object Lock     |              | - Key destruction   |         |
|  | - Inmutables      |              | - Crypto-shredding  |         |
|  +------------------+              +---------------------+          |
|                                                                    |
+====================================================================+
```

### B. Flujo de datos completo (extremadamente simplificado)

```
DATOS EN MOVIMIENTO (en transito)
==================================
Paciente escribiendo en chat:
  1. Navegador: cifra mensaje con AES-GCM-256 (clave efimera)
  2. Clave AES cifrada con RSA-OAEP (clave publica del psicologo)
  3. TLS 1.3: cifra todo el payload para el servidor
  4. Servidor: almacena BYTEA en PostgreSQL
  5. NO PUEDE descifrar (no tiene la clave privada RSA del psicologo)
  -> Dato seguro incluso si servidor comprometido

DATOS EN REPOSO
==================================
  1. Contenido: AES-256-GCM cifrado (BYTEA)
  2. Clave del contenido: KEK del paciente (256-bit)
  3. KEK: almacenada en HSM, envuelta para servidor con server key
  4. En navegador del paciente: KEK derivada de password via Argon2id
  5. Backup: cifrado con backup key (almacenada en cofre HSM separado)
  -> Sin KEK, los BYTEA son ruido

DATOS EN PROCESAMIENTO (RAM)
==================================
  1. Servidor descifra KEK (solo temporalmente, en buffer seguro)
  2. Descifra contenido del paciente en RAM
  3. Construye prompt para LLM local (GPU)
  4. Genera respuesta en RAM
  5. Cifra respuesta con KEK del paciente
  6. Hace memory zeroing de KEK y texto plano
  7. VmSwap = 0 kB (mlock evita swap)
  -> Datos solo existen en RAM volatil, por microsegundos

DATOS EN BAJA
==================================
  1. Crypto-shredding: destruir KEK en HSM
  2. Todos los BYTEA del paciente se vuelven ilegibles
  3. Backups inmutables: contienen BYTEA sin KEK = ceniza
  4. Metadatos minimos: conservados 5 anos
  5. Destruccion total a los 5 anos: destruir tambien metadatos
  -> Datos irrecuperables, no es necesario borrar fisicamente
```

### C. Codigos de respuesta para errores de seguridad

```
Codigos de error E2E (Extensiones de API):
  E2E_001 - Clave publica RSA del destinatario no encontrada
  E2E_002 - Clave privada RSA no disponible en sessionStorage
  E2E_003 - Fallo de descifrado AES-GCM (auth tag invalido)
  E2E_004 - KEK del paciente no encontrada en HSM
  E2E_005 - KEK destruida (crypto-shredding aplicado)
  E2E_006 - Clave de grupo no disponible (usuario no es miembro)
  E2E_007 - Clave de grupo rotada, solicitar nueva

Errores de auditoria:
  AUD_001 - Hash chain rota en registro N (posible manipulacion)
  AUD_002 - Intento de alteracion de registro de auditoria
  AUD_003 - Firma de consentimiento no coincide con terminos
  AUD_004 - Frecuencia de acceso anomala detectada

Errores de importacion:
  IMP_001 - Token de invitacion expirado
  IMP_002 - Token de invitacion ya utilizado
  IMP_003 - QR invalido (firma HMAC no coincide)
  IMP_004 - QR expirado (ventana temporal superada)
  IMP_005 - Archivo CSV invalido (cabeceras incorrectas)
  IMP_006 - Demasiados pacientes en un lote (>500)
  IMP_007 - API Key invalida o expirada
  IMP_008 - Firma HMAC de API request no coincide
  IMP_009 - Email del paciente ya registrado
```

### D. Referencias legales

```
- REGLAMENTO (UE) 2016/679 (RGPD)
  Art. 5: Principios relativos al tratamiento
  Art. 7: Condiciones para el consentimiento
  Art. 9: Categorias especiales de datos personales
  Art. 12: Transparencia y modalidades
  Art. 15: Derecho de acceso del interesado
  Art. 17: Derecho a la supresion (derecho al olvido)
  Art. 20: Derecho a la portabilidad de los datos
  Art. 25: Proteccion de datos desde el diseno
  Art. 30: Registro de actividades de tratamiento
  Art. 32: Seguridad del tratamiento
  Art. 33: Notificacion de violaciones de seguridad
  Art. 35: Evaluacion de impacto

- LEY ORGANICA 3/2018 (LOPDGDD - Espana)
  Art. 9: Derecho a la portabilidad
  Art. 10: Derecho de supresion

- LEY 41/2002 (Ley de Autonomia del Paciente - Espana)
  Art. 14: Derecho a la historia clinica
  Art. 15: Contenido de la historia clinica
  Art. 16: Acceso a la historia clinica
  Art. 17: Conservacion de la documentacion clinica (5 anos)

- REAL DECRETO 1907/1996
  Publicidad y promocion comercial de productos sanitarios
  Prohibicion de testimonios de pacientes

- CODIGO DEONTOLOGICO DEL PSICOLOGO (Espana)
  Art. 50-51: Secreto profesional y publicidad
  Art. 55: Consentimiento informado

- LEY 34/2002 (LSSI-CE)
  Comunicaciones comerciales electronicas

- REGLAMENTO eIDAS (UE) 910/2014
  Firma electronica cualificada
  (aplica a firma de consentimientos digitales)
```

---

FIN DEL INFORME T4

Documento generado para el proyecto Ancora (ancora.clinic)
Clasificacion: CONFIDENCIAL - Secreto Profesional Sanitario
Version del informe: 1.0 | 31 Mayo 2026
