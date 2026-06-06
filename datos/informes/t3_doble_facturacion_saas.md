# Modelo de Doble Facturación SaaS para Ancora (ancora.clinic)

## Investigación Completa: Dual SaaS + Stripe Connect Split Payments

---

## Índice

1. SAAS Paciente (29-39 EUR/mes)
2. SAAS Psicólogo (tiers: Gratuito, Básico, Pro, Enterprise)
3. Stripe Connect Split Payments
4. Implicaciones Fiscales (IVA, IRPF, Modelos 111/347)
5. Métricas Financieras y Proyecciones
6. Estrategia de Monetización

---

## 1. SAAS Paciente (29-39 EUR/mes)

### 1.1 Qué incluye

El paciente paga una suscripción mensual a Ancora por el software e infraestructura de IA local, separada completamente de los honorarios del psicólogo.

| Feature | Descripción | Valor percibido |
|---|---|---|
| Historia psicológica portable | Perfil vital cronológico: eventos, patrones, detonantes, relaciones, hipótesis, objetivos, avances. Reutilizable con cualquier psicólogo en la plataforma. | Moat principal. Rompe la pérdida de contexto al cambiar de terapeuta. |
| Diario IA | Chat guiado diario (15 min/día) con IA local (DeepSeek-R1-70B / GLM-5.1). Identifica patrones, distorsiones cognitivas, temas recurrentes. | Acompañamiento continuo entre sesiones. |
| Chat IA | 15 minutos diarios acumulables. Respuesta en <1.5s TTFT. Procesamiento 100% local en servidor propio. | Sin dependencia de APIs externas. Privacidad total. |
| Estadísticas de progreso | Gráficos de evolución emocional, adherencia, temas trabajados, hitos alcanzados. | Visibilidad del avance terapéutico. |
| Exportación | Descarga cifrada del historial completo en formato interoperable (JSON estructurado + PDF resumen). | Portabilidad real. El paciente es dueño de sus datos. |

### 1.2 Justificación del precio (29-39 EUR/mes)

**Análisis de valor vs competencia:**

| Competidor | Precio | Qué incluye | Diferencia con Ancora |
|---|---|---|---|
| Unobravo | 45 EUR/sesión (50 min) | Solo videollamada. Sin seguimiento entre sesiones. | Ancora ofrece **seguimiento diario IA + historia estructurada** por menos precio mensual. |
| Therapyside | 43-49 EUR/semana (172-196 EUR/mes) | Chat asíncrono + 1 sesión/semana. | Ancora separa SaaS (29-39 EUR) de la sesión con psicólogo (50-80 EUR). Total inferior. |
| ifeel | 30 EUR/semana (120 EUR/mes) chat | Chat con terapeuta humano (quemado). | Ancora descarga el chat diario en IA local; el psicólogo solo revisa. |
| BetterHelp | $280-400/mes | Chat ilimitado + 1 sesión/semana. | Ancora ofrece privacidad real (servidor local, no nube USA) a fracción del precio. |
| Talkspace | $69-129/semana ($276-516/mes) | Mensajería + sesiones cortas. | Ancora es 5-10x más barato con mejor privacidad y misma estructura. |

**Conclusión de precio:**

- 29 EUR/mes es el **precio de entrada** (plan promocional/básico, solo funciones esenciales).
- 39 EUR/mes es el **precio estándar** (funciones completas: historial + diario + estadísticas + exportación).
- En ambos casos, el precio es **inferior a una sola sesión de terapia tradicional** (45-80 EUR), ofreciendo valor continuo durante 30 días.
- Comparativa: un paciente paga 29 EUR/mes (SaaS) + 50-80 EUR/sesión (psicólogo, 1-4 veces al mes) = 79-349 EUR/mes total. Frente a 45 EUR/sesión de Unobravo x 4 semanas = 180 EUR/mes sin seguimiento diario.

### 1.3 Onboarding: 49 EUR (promo)

Pago único de activación que cubre:

| Concepto | Valor real | Margen plataforma |
|---|---|---|
| Triaje IA (PHQ-9 + GAD-7 automatizados) | 15 EUR (coste inferencia + análisis) | --- |
| Primera sesión (1h) con psicólogo asignado | 50-80 EUR (honorarios psicólogo) | --- |
| 1 semana de diario IA + historial estructurado | 7 EUR (coste inferencia 7 días) | --- |
| **Total valor real** | **72-102 EUR** | --- |
| **Precio promocional** | **49 EUR** | --- |
| **Subvención plataforma** | **23-53 EUR absorbidos** | Captación de usuario + activación |

**Estrategia:** La plataforma absorbe pérdida en onboarding a cambio de:
- Activar al paciente en el ecosistema.
- Que el psicólogo reciba su honorario completo (sin comisión en primera sesión).
- Iniciar la historia psicológica portable (lock-in del paciente).
- Iniciar la suscripción SaaS mensual recurrente.

---

## 2. SAAS Psicólogo (tiers)

### 2.1 Tabla comparativa de features por tier

| Feature | Gratuito | Básico (29 EUR/mes) | Pro (69 EUR/mes) | Enterprise (personalizado) |
|---|---|---|---|---|
| **Límite pacientes activos** | Hasta 5 | Hasta 20 | Ilimitados | Ilimitados |
| **Panel clínico (Clinical Dashboard)** | Básico | Completo | Completo + avanzado | Personalizado |
| **Diario IA del paciente (lectura)** | SI | SI | SI | SI |
| **Estadísticas de progreso por paciente** | NO | SI (básicas) | SI (avanzadas + gráficos) | SI + informes exportables |
| **Smart SOAP automático** | NO | SI (generación automática) | SI (avanzado + edición) | SI + API para HIS |
| **Video-briefing con teleprompter** | NO | SI | SI + editor | SI + white-label |
| **Matching con pacientes** | Manual (solo invitados) | Algoritmo básico | Prioridad en matching | Matching dedicado |
| **Facturación automatizada** | NO (manual) | SI (Stripe Connect) | SI + informes fiscales | SI + API contable |
| **Exportación de datos clínicos** | NO | NO | SI (JSON, PDF, FHIR básico) | SI + integración EHR |
| **API de acceso** | NO | NO | NO | SI |
| **Multi-psicólogo (clínicas)** | NO | NO | NO | SI (hasta 20+ perfiles) |
| **White-label parcial** | NO | NO | NO | SI (logo propio, dominio) |
| **Soporte** | Email (72h) | Chat (24h) | Prioridad (4h) | Dedicado (SLA 1h) |

### 2.2 Descripción detallada por tier

#### Gratuito (0 EUR/mes)

- **Objetivo:** Hook de entrada. Barrera cero para atraer psicólogos.
- **Límite:** 5 pacientes activos. Suficiente para probar la plataforma, validar el modelo y empezar a generar ingresos sin coste.
- **Funcionalidades:** Perfil profesional, recepción de pacientes invitados, lectura del diario IA, videollamadas básicas.
- **Sin SOAP automático:** El psicólogo debe redactar notas manualmente. Este es el principal "dolor" que fuerza la conversión a pago.
- **Sin estadísticas:** No ve gráficos de progreso ni métricas agregadas.

**Estrategia de conversión:** Al alcanzar 5 pacientes, se bloquea la posibilidad de añadir más hasta que se actualice a Básico o Pro. El psicólogo ya ha invertido tiempo en la plataforma (5 pacientes configurados, flujo aprendido) y los pacientes ya tienen su historia en Ancora, generando lock-in bidireccional.

#### Básico (29 EUR/mes)

- **Objetivo:** Plan de entrada para psicólogos individuales con carga moderada.
- **Límite:** 20 pacientes. Cubre a la mayoría de psicólogos en solitario.
- **Smart SOAP:** Generación automática de notas clínicas en formato SOAP (Subjetivo, Objetivo, Análisis, Plan) a partir de la transcripción de la sesión y el diario del paciente. Ahorro estimado: 40% del tiempo administrativo.
- **Estadísticas básicas:** Gráficos de adherencia, evolución semanal, check-ins cumplidos.
- **Valor por 29 EUR/mes:** Equivale a ~1 hora de trabajo administrativo ahorrada. Si el psicólogo factura 50-80 EUR/hora, el retorno es inmediato.

#### Pro (69 EUR/mes)

- **Objetivo:** Plan premium para psicólogos con alta demanda o que quieren maximizar productividad.
- **Pacientes ilimitados:** Sin restricción de capacidad.
- **SOAP avanzado:** Edición colaborativa, plantillas personalizables, detección automática de sesgos, integración de escalas clínicas (PHQ-9, GAD-7) en las notas.
- **Prioridad matching:** Los pacientes entrantes que buscan psicólogo ven primero los perfiles Pro. El algoritmo de matching pondera positivamente a los planes de pago.
- **Facturación automatizada + informes fiscales:** Resumen trimestral preparado para Modelo 111 y 347.
- **Exportación completa:** Posibilidad de descargar el historial de todos los pacientes en formato estructurado.

#### Enterprise (personalizado)

- **Objetivo:** Clínicas, centros de psicología, grupos sanitarios.
- **Multi-psicólogo:** Gestión de equipos (hasta 20+ profesionales) con roles diferenciados (psicólogo titular, supervisor, administrativo).
- **API completa:** Integración con sistemas de historia clínica electrónica (HIS/EHR), sistemas de facturación, CRM.
- **White-label parcial:** La clínica puede usar su propia marca en el portal del paciente (dominio personalizado, logo, colores), mientras Ancora gestiona la infraestructura.
- **Soporte dedicado:** SLA de 1 hora para incidencias críticas.
- **Precio:** Desde 199 EUR/mes base + 29 EUR/mes por psicólogo adicional, negociable según volumen.

---

## 3. Stripe Connect Split Payments

### 3.1 Flujo de pago

```
PACIENTE
   |
   | Pago único: 29 EUR (SaaS) + 50 EUR (sesión) = 79 EUR
   v
STRIPE CHECKOUT
   |
   | Split en origen (Destination Charges)
   v
+------------------+------------------+
|  Ancora (29 EUR) |  Psicólogo (50 EUR) |
|  + IVA 21% = 6.09 EUR |  Exento IVA (Art. 20.Uno.3) |
|  Neto plataforma: 35.09 EUR |  Neto psicólogo: 50 EUR |
+------------------+------------------+
```

**Explicación del split:**

1. El paciente introduce su tarjeta una sola vez en Stripe Checkout.
2. Stripe divide el pago en origen mediante `transfer_data[destination]` en el PaymentIntent.
3. La parte del psicólogo (50 EUR) se envía directamente a su cuenta Stripe Connect (exento de IVA, el psicólogo factura directamente al paciente).
4. La parte de Ancora (29 EUR + 21% IVA) va a la cuenta principal de la plataforma.
5. La comisión de Stripe (~1.5% + 0.25 EUR) se aplica sobre el total (79 EUR) y se descuenta de la parte de la plataforma (o se prorratea, según configuración).

### 3.2 Código de ejemplo: Configuración Stripe Connect

```python
import stripe
import os
from decimal import Decimal

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

# --- CONFIGURACIÓN INICIAL ---

# 1. Crear cuenta Connect para un psicólogo (onboarding)
def crear_cuenta_psicologo(email: str, nombre: str) -> str:
    """Crea una cuenta Stripe Connect Express para el psicólogo."""
    account = stripe.Account.create(
        type="express",
        country="ES",
        email=email,
        business_type="individual",
        capabilities={
            "transfers": {"requested": True},
        },
        business_profile={
            "name": nombre,
            "product_description": "Servicios de psicología online",
            "url": "https://ancora.clinic",
        },
        individual={
            "first_name": nombre.split()[0],
            "last_name": " ".join(nombre.split()[1:]),
        },
        tos_acceptance={
            "service_agreement": "recipient",
        },
    )
    # Generar link de onboarding para que complete verificación
    account_link = stripe.AccountLink.create(
        account=account.id,
        refresh_url="https://ancora.clinic/psicologo/onboarding/refresh",
        return_url="https://ancora.clinic/psicologo/onboarding/complete",
        type="account_onboarding",
    )
    return account.id, account_link.url


# --- PROCESAMIENTO DE PAGO CON SPLIT ---

def cobrar_con_split(
    paciente_email: str,
    monto_total: Decimal,         # 79.00 EUR
    monto_plataforma: Decimal,    # 29.00 EUR
    monto_psicologo: Decimal,     # 50.00 EUR
    id_cuenta_psicologo: str,
    id_paciente: str,
    id_psicologo: str,
) -> dict:
    """
    Crea un PaymentIntent con split en origen.
    La parte del psicólogo se transfiere directamente a su cuenta Connect.
    La parte de plataforma se liquida en la cuenta principal de Ancora.
    """
    # Stripe cobra ~1.5% + 0.25 EUR sobre el total
    # Calculamos tarifa Stripe estimada
    tarifa_stripe = (monto_total * Decimal("0.015")) + Decimal("0.25")

    # La plataforma absorbe la tarifa de Stripe (se descuenta de su parte)
    monto_liquidacion_plataforma = monto_plataforma - tarifa_stripe

    # Crear PaymentIntent con destino
    payment_intent = stripe.PaymentIntent.create(
        amount=int(monto_total * 100),  # Stripe usa céntimos
        currency="eur",
        description=f"Ancora: SaaS + Sesión - Paciente {id_paciente}",
        statement_descriptor="ANCORA CLINIC",
        metadata={
            "tipo": "sesion_saas",
            "id_paciente": id_paciente,
            "id_psicologo": id_psicologo,
            "monto_plataforma_cents": int(monto_plataforma * 100),
            "monto_psicologo_cents": int(monto_psicologo * 100),
        },
        # Configuración del split
        transfer_data={
            "destination": id_cuenta_psicologo,
            "amount": int(monto_psicologo * 100),  # 50 EUR al psicólogo
        },
        # La plataforma retiene el resto (29 EUR - Stripe fee)
        on_behalf_of=id_cuenta_psicologo,
        receipt_email=paciente_email,
    )

    return {
        "client_secret": payment_intent.client_secret,
        "id": payment_intent.id,
        "monto_psicologo": float(monto_psicologo),
        "monto_plataforma": float(monto_liquidacion_plataforma),
    }


# --- GESTIÓN DE REEMBOLSOS ---

def procesar_reembolso(
    payment_intent_id: str,
    monto: Decimal = None,
    motivo: str = "solicitud_paciente",
):
    """
    Reembolso parcial o total. Stripe maneja automáticamente
    la devolución de fondos desde ambas cuentas.
    """
    params = {
        "payment_intent": payment_intent_id,
        "reason": motivo,
    }
    if monto is not None:
        params["amount"] = int(monto * 100)

    refund = stripe.Refund.create(**params)
    return {
        "id": refund.id,
        "status": refund.status,
        "monto_reembolsado": refund.amount / 100,
    }


# --- VERIFICACIÓN DE SALDOS ---

def verificar_balance_psicologo(id_cuenta_psicologo: str) -> dict:
    """Comprueba el balance disponible de un psicólogo antes de payout."""
    balance = stripe.Balance.retrieve(
        stripe_account=id_cuenta_psicologo
    )
    disponible = sum(
        bal.amount for bal in balance.available
        if bal.currency == "eur"
    )
    pendiente = sum(
        bal.amount for bal in balance.pending
        if bal.currency == "eur"
    )
    return {
        "disponible": disponible / 100,
        "pendiente": pendiente / 100,
    }
```

### 3.3 Manejo de reembolsos, disputas y fallos

#### Reembolsos
- Stripe reembolsa desde la cuenta que recibió los fondos.
- Si el reembolso es total: Stripe descuenta de ambas cuentas (plataforma + psicólogo) en proporción al split original.
- Si el reembolso es parcial: Stripe prorratea automáticamente.
- **Riesgo:** Si el psicólogo ya ha retirado los fondos (payout realizado), su balance Connect puede quedar en negativo. Stripe cobrará futuros pagos al psicólogo hasta cubrir el descubierto.

#### Disputas (chargebacks)
- La disputa se descuenta de la cuenta de la plataforma (quien tiene la relación contractual directa con Stripe).
- La plataforma puede trasladar parte o toda la disputa al psicólogo si se demuestra que el servicio clínico fue defectuoso.
- **Recomendación:** Configurar `stripe_account` en el PaymentIntent para que Stripe priorice el saldo de la cuenta destino (psicólogo) para cubrir disputas.

#### Fallos de pago
- Implementar Striwebhooks para `payment_intent.payment_failed`:
  - Notificar al paciente por email/SMS.
  - Suspender acceso al SaaS (no renovar sesión de IA) pero mantener la historia clínica accesible (deber ético).
  - Notificar al psicólogo que el paciente tiene un pago pendiente.
- **Reintentos automáticos:** Stripe Smart Retries (3 intentos en días distintos).
- **Suspensión progresiva:**
  - Día 1-3: Recordatorio amistoso.
  - Día 4-7: Chat IA desactivado (solo lectura de historial).
  - Día 8+: Perfil en pausa. Psicólogo notificado. No se programan nuevas sesiones hasta regularizar.

---

## 4. Implicaciones Fiscales

### 4.1 IVA SaaS 21%

**Base legal:** Servicios prestados por vía electrónica (Ley 37/1992 IVA, Art. 69. Uno).

La suscripción SaaS de Ancora (29-39 EUR/mes) califica como **servicio electrónico**:
- No hay intervención humana directa en la prestación del servicio.
- Es automatizado, estandarizado, sin personalización por persona física.
- Se entrega a través de internet.

**Tipo aplicable:** 21% de IVA en España (régimen general).

**Cálculo:**
- Precio SaaS: 29.00 EUR (base imponible base, puede haber recargo de equivalencia si aplica... en general, tipo general)
- Ejemplo real:
  - Precio sin IVA: 29.00 EUR
  - IVA 21%: 6.09 EUR
  - Total cobrado al paciente: 35.09 EUR

**Factura que emite Ancora al paciente:**

```
ANCORA CLINIC SL
CIF: Pendiente
Factura SaaS - [Nº Factura]
Fecha: [dd/mm/aaaa]
Cliente: [Nombre Paciente] - [NIF]

Concepto:
Suscripción mensual plataforma Ancora (software + IA local)
  - Historia psicológica portable
  - Diario IA (15 min/día)
  - Estadísticas de progreso
  - Exportación de datos

Base imponible:    29.00 EUR
IVA 21%:            6.09 EUR
Total:             35.09 EUR
```

### 4.2 Exención IVA Psicólogo (Art. 20.Uno.3 Ley IVA)

**Base legal:** Ley 37/1992, Artículo 20, apartado Uno, número 3:

> "Estarán exentas [...] las prestaciones de servicios de asistencia sanitaria por profesionales sanitarios [...] cualquiera que sea la persona o entidad a cuyo cargo se realicen."

**Requisitos para aplicar la exención:**
1. El psicólogo debe ser profesional sanitario habilitado (MPGS o PIR).
2. La prestación debe tener finalidad de diagnóstico, prevención o tratamiento.
3. La relación es directa psicólogo-paciente (aunque medie plataforma).

**Factura que emite el psicólogo al paciente (a través de Ancora):**

```
[Nombre Psicólogo]
[NIF/CIF]
[Nº Colegiado]

Factura Servicios Clínicos - [Nº Factura]
Fecha: [dd/mm/aaaa]
Cliente: [Nombre Paciente] - [NIF]

Concepto:
Servicio de psicología online (sesión 50 min)
  - Diagnóstico y tratamiento psicológico
  - Revisión de historial clínico

Base imponible:    50.00 EUR
IVA: Exento (Art. 20.Uno.3 LIVA)
Total:             50.00 EUR
```

**Importante:** El psicólogo NO cobra IVA, pero debe incluir en su factura la referencia al artículo de exención.

### 4.3 IRPF: Retenciones y Modelo 111

#### Retenciones aplicables

| Situación | Retención IRPF | Base legal |
|---|---|---|
| Psicólogo autónomo (persona física) | 15% (primer año: 7%) | Art. 101 LIRPF, RD 439/2007 |
| Psicólogo profesional (actividad económica) | 15% | Art. 95 RIRPF |
| Clínica/empresa (sociedad) | No aplica retención | --- |

#### Flujo de retenciones con Stripe Connect

Actualmente, Stripe Connect NO retiene IRPF automáticamente. La responsabilidad es del psicólogo:

1. El psicólogo emite su factura exenta de IVA al paciente.
2. El paciente (persona física) NO está obligado a retener IRPF porque no es empresario.
3. **El psicólogo ingresa sus facturas en su declaración trimestral (Modelo 130/131)** y anual (Renta).
4. Alternativamente, Ancora puede **actuar como pagador** si contrata al psicólogo como profesional, reteniendo el 15% en cada pago. Pero esto crea riesgo de laboralidad.

**Modelo recomendado para Ancora:**
- Ancora **no retiene IRPF** al psicólogo para evitar relación laboral.
- El psicólogo declara sus ingresos directamente en sus modelos trimestrales.
- Ancora emite un **certificado anual de ingresos** (Modelo 347 o certificado de retenciones si aplica) para que el psicólogo lo use en su declaración.

#### Modelo 111 (retenciones IRPF)

**Ancora debe presentar Modelo 111 si retiene IRPF** a los psicólogos. Si opta por no retener (para evitar laboralidad), NO presenta 111 por estos pagos.

Si Ancora contrata a un psicólogo como profesional externo con retención:
- Trimestral: Modelo 111 (retenciones practicadas).
- Anual: Modelo 190 (resumen anual de retenciones).

### 4.4 Facturación automatizada

**Arquitectura de facturación:**

```
PACIENTE
   |--- Pago único (Stripe)
   |
   v
SISTEMA ANCORA
   |
   |--- Genera factura SaaS (Ancora -> Paciente)
   |       Base: 29 EUR + IVA 21% = 35.09 EUR
   |       IVA: Ingresado en Hacienda (Modelo 303 trimestral)
   |
   |--- Genera factura clínica (Psicólogo -> Paciente)
   |       Base: 50 EUR. Exenta IVA.
   |       Enviada al psicólogo para su contabilidad
   |
   |--- Reporte mensual al psicólogo
   |       "Tus facturas emitidas: XX EUR"
   |       "Tus cobros recibidos: XX EUR"
   |       "Resumen para Modelo 130/131"
```

### 4.5 Declaración en el Modelo 347

El Modelo 347 declara operaciones con terceros > 3.005,06 EUR anuales.

#### Flujo 1: Ancora -> Paciente (SaaS)

| Concepto | Valor |
|---|---|
| Cuota mensual SaaS | 35.09 EUR (IVA incl.) |
| Umbral 347 | 3.005,06 EUR anuales |
| Equivale a | ~86 meses de suscripción (7+ años) |
| **Conclusión** | Un paciente individual NO alcanza el umbral 347. Solo pacientes con múltiples servicios que sumen > 3.005 EUR. |

#### Flujo 2: Ancora -> Psicólogo (pagos)

| Concepto | Valor |
|---|---|
| Pago medio mensual a psicólogo | 50-500 EUR |
| Umbral 347 | 3.005,06 EUR anuales |
| Equivale a | 60-600 EUR/mes durante 12 meses |
| **Conclusión** | Si un psicólogo recibe > 3.005 EUR/año, Ancora debe incluirle en el 347. Psicólogos a tiempo parcial pueden no alcanzarlo. |

#### Flujo 3: Psicólogo -> Paciente (factura clínica)

El psicólogo declara sus facturas a pacientes en su propio Modelo 347. Si un paciente suma > 3.005 EUR en honorarios al año (poco probable en terapia estándar), debe declararse.

#### Resumen de obligaciones fiscales de Ancora

| Modelo | Periodicidad | Qué declara |
|---|---|---|
| 303 | Trimestral | IVA repercutido (SaaS 21%) - IVA soportado (gastos) |
| 111 | Trimestral | IRPF retenido a psicólogos (si aplica) |
| 190 | Anual | Resumen retenciones IRPF (si aplica) |
| 347 | Anual | Operaciones con psicólogos > 3.005 EUR/año |
| 349 | Trimestral | Operaciones intracomunitarias (si aplica) |
| 200 | Anual | Impuesto de Sociedades |

---

## 5. Métricas Financieras

### 5.1 Margen por plan de psicólogo

| Plan | Precio | Coste directo | Margen bruto | % Margen |
|---|---|---|---|---|
| Gratuito | 0 EUR | 0,50 EUR/mes (ancho de banda + storage) | -0,50 EUR | N/A |
| Básico | 29 EUR | 1,50 EUR (IA + storage + ancho de banda) | 27,50 EUR | **94,8%** |
| Pro | 69 EUR | 3,00 EUR (IA intensiva + storage + prioridad) | 66,00 EUR | **95,7%** |
| Enterprise | 199 EUR base | 10 EUR (infraestructura dedicada) | 189 EUR+ | **95%+** |

**Nota:** El margen es casi 100% porque el SaaS es puro software. Los costes principales son:
- Infraestructura GPU local (amortizable, ~545 EUR/mes para servidor dual RTX 4090).
- Ancho de banda y storage (AWS S3-compatible, ~50-200 EUR/mes).
- Stripe fees (~1.5% + 0.25 EUR por transacción).

### 5.2 Mix de ingresos estimado (100 psicólogos + 300 pacientes)

**Escenario realista a 12 meses:**

| Categoría | Cantidad | Precio medio | Ingreso mensual | % del total |
|---|---|---|---|---|
| **Psicólogos** | | | | |
| Gratuito | 50 | 0 EUR | 0 EUR | 0% |
| Básico | 30 | 29 EUR | 870 EUR | 4.2% |
| Pro | 15 | 69 EUR | 1.035 EUR | 5.0% |
| Enterprise | 5 | 299 EUR | 1.495 EUR | 7.2% |
| *Subtotal psicólogos* | *100* | | *3.400 EUR* | *16.4%* |
| | | | | |
| **Pacientes** | | | | |
| SaaS básico | 200 | 29 EUR | 5.800 EUR | 28.0% |
| SaaS estándar | 100 | 39 EUR | 3.900 EUR | 18.8% |
| *Subtotal SaaS pacientes* | *300* | | *9.700 EUR* | *46.8%* |
| | | | | |
| **Onboarding** | 50 nuevos/mes | 49 EUR | 2.450 EUR | 11.8% |
| **Créditos extra** | 30 packs/mes | 15 EUR | 450 EUR | 2.2% |
| *Subtotal transaccional* | | | *2.900 EUR* | *14.0%* |
| | | | | |
| **Total ingresos recurrentes** | | | **13.100 EUR/mes** | |
| **Total ingresos totales** | | | **16.000 EUR/mes** | **100%** |

### 5.3 LTV segmentado

#### Paciente que llega por psicólogo (canal orgánico)

| Parámetro | Valor |
|---|---|
| Cuota mensual media | 32 EUR (mix 29+39) |
| Churn mensual estimado | 8% |
| Vida media (1/churn) | 12.5 meses |
| **LTV bruto** | **400 EUR** |
| Coste adquisición (CAC) | 5 EUR (invitación del psicólogo) |
| **LTV neto** | **395 EUR** |
| **Ratio LTV/CAC** | **79x** |

**Características:** Paciente que llega porque su psicólogo ya está en Ancora. Alta retención porque el psicólogo es su ancla. Bajo churn.

#### Paciente que llega por canal frío (ads, SEO, redes)

| Parámetro | Valor optimista | Valor pesimista |
|---|---|---|
| Cuota mensual media | 32 EUR | 32 EUR |
| Churn mensual | 15% | 25% |
| Vida media | 6.7 meses | 4 meses |
| LTV bruto | 214 EUR | 128 EUR |
| CAC (ads + contenido) | 80 EUR | 120 EUR |
| LTV neto | 134 EUR | 8 EUR |
| Ratio LTV/CAC | 2.7x | 0.07x |

**Conclusión:** El canal frío es mucho menos rentable. Hay que minimizar la inversión en ads fríos y maximizar la adquisición vía psicólogos (efecto red).

### 5.4 CAC por canal

| Canal | CAC estimado | Conversión a pago | Escalabilidad | Prioridad |
|---|---|---|---|---|
| Psicólogo invita a paciente | 5 EUR | Alta (>60%) | Alta (efecto red) | **1** |
| B2B2C (psiquiatras derivan) | 25 EUR | Media (40%) | Media (relacional) | **2** |
| SEO (contenido terapéutico) | 40 EUR | Media (30%) | Alta (largo plazo) | **3** |
| LinkedIn Ads (profesionales) | 60 EUR | Media (25%) | Media | **4** |
| Meta/Google Ads (frío) | 100-120 EUR | Baja (<10%) | Alta (caro) | **5** |
| TikTok / redes sociales | 80 EUR | Muy baja (<5%) | Alta (volátil) | **6** |

### 5.5 Proyección a 6, 12 y 24 meses

**Supuestos:**
- Crecimiento mensual: 15% primeros 6 meses, 10% siguientes 6, 8% después.
- Churn pacientes SaaS: 8% (psicólogo-derivados) / 15% (fríos) - ponderado 10%.
- Churn psicólogos de pago: 5% mensual.
- 50% de los psicólogos gratuitos se convierten a pago al alcanzar 5 pacientes.
- Cada psicólogo de pago trae 3 pacientes nuevos (efecto viral).
- Onboarding: 49 EUR/paciente nuevo (40% lo pagan).

| Métrica | Mes 1 | Mes 6 | Mes 12 | Mes 24 |
|---|---|---|---|---|
| Psicólogos activos | 10 | 50 | 120 | 350 |
| Psicólogos de pago | 2 | 15 | 45 | 150 |
| Pacientes SaaS | 20 | 120 | 350 | 1.200 |
| Nuevos pacientes/mes | 20 | 40 | 60 | 120 |
| | | | | |
| **Ingresos mensuales** | | | | |
| SaaS psicólogos | 58 EUR | 540 EUR | 1.890 EUR | 7.350 EUR |
| SaaS pacientes | 580 EUR | 3.480 EUR | 10.150 EUR | 34.800 EUR |
| Onboarding | 980 EUR | 1.960 EUR | 2.940 EUR | 5.880 EUR |
| Créditos extra | 0 EUR | 180 EUR | 525 EUR | 1.800 EUR |
| **Total ingresos** | **1.618 EUR** | **6.160 EUR** | **15.505 EUR** | **49.830 EUR** |
| | | | | |
| **Costes** | | | | |
| Infraestructura GPU | 545 EUR | 545 EUR | 1.090 EUR | 2.180 EUR |
| Stripe fees (~2%) | 32 EUR | 123 EUR | 310 EUR | 997 EUR |
| Hosting + storage | 100 EUR | 200 EUR | 400 EUR | 800 EUR |
| Marketing | 300 EUR | 1.000 EUR | 2.000 EUR | 4.000 EUR |
| Soporte + compliance | 500 EUR | 1.000 EUR | 2.000 EUR | 4.000 EUR |
| **Total costes** | **1.477 EUR** | **2.868 EUR** | **5.800 EUR** | **11.977 EUR** |
| | | | | |
| **Resultado** | | | | |
| Ingresos totales | 1.618 EUR | 6.160 EUR | 15.505 EUR | 49.830 EUR |
| Costes totales | 1.477 EUR | 2.868 EUR | 5.800 EUR | 11.977 EUR |
| **Margen neto** | **141 EUR** | **3.292 EUR** | **9.705 EUR** | **37.853 EUR** |
| **Margen %** | **8.7%** | **53.4%** | **62.6%** | **76.0%** |

**Punto de equilibrio:** Mes 1-2 (con 20 pacientes + 10 psicólogos). Esto valida el modelo como rápidamente rentable.

---

## 6. Estrategia de Monetización

### 6.1 Hook: psicólogo gratis hasta 5 pacientes (barrera cero)

**Estrategia:** El plan gratuito elimina toda barrera de entrada para el psicólogo:
- Sin tarjeta de crédito requerida para registrarse.
- Funcionalidades suficientes para probar el valor del producto.
- 5 pacientes gratuitos: margen suficiente para validar el modelo sin comprometer ingresos.

**Conversión forzada:** Al llegar al paciente número 6, el sistema:
1. Muestra un mensaje: "Has alcanzado tu límite de pacientes gratuitos. Actualiza a Básico o Pro para seguir añadiendo pacientes".
2. Los 5 pacientes existentes siguen funcionando (no se pierde el trabajo).
3. Se bloquea la incorporación de nuevos pacientes hasta la actualización.
4. El psicólogo ya ha invertido tiempo en la plataforma: alta probabilidad de conversión.

**Métrica objetivo:** 50% de conversión de gratuito a pago en los primeros 3 meses.

### 6.2 Upgrade forzado al llegar a 5 pacientes

**Mecanismo de bloqueo progresivo:**

| Nº pacientes | Estado | Acción del sistema |
|---|---|---|
| 1-4 | Normal | Sin restricciones |
| 5 | Último gratuito | Notificación: "Has llegado al límite. Actualiza para seguir creciendo." |
| 5+ | Bloqueado | No se puede añadir paciente nº6 hasta actualizar a plan de pago. |

**Trigger emocional:** El psicólogo ve el valor de la plataforma con sus 5 pacientes (diario IA estructurado, panel clínico, ahorro de tiempo). La alternativa es migrar a otro sistema o gestionar manualmente, perdiendo toda la inversión de tiempo y datos estructurados.

### 6.3 Referral: descuento por invitar a otro psicólogo

**Mecanismo:**
1. Cada psicólogo tiene un código de referral único.
2. Cuando un invitado se registra y paga su primer mes de cualquier plan de pago:
   - El psicólogo referente recibe **50% de descuento** en su próxima mensualidad.
   - El psicólogo invitado recibe **primer mes a mitad de precio**.
3. Límite: máximo 5 descuentos acumulables por mes (máximo un plan Pro gratis).

**Efecto red:** Si cada psicólogo invita a 2-3 colegas al año, el crecimiento es exponencial sin costes de adquisición.

### 6.4 Paciente: onboarding 49 EUR + SaaS mensual

**Estructura de precios al paciente:**

| Concepto | Precio | Periodicidad | Observaciones |
|---|---|---|---|
| Onboarding (triaje + 1h sesión) | 49 EUR (promo) | Único | Valor real: 72-102 EUR. Subvencionado por plataforma. |
| | 99 EUR (estándar) | Único | Precio real sin promoción. |
| SaaS paciente básico | 29 EUR/mes | Mensual | Funciones esenciales (historial + diario 15 min/día + chat) |
| SaaS paciente estándar | 39 EUR/mes | Mensual | + estadísticas avanzadas + exportación + prioridad en chat |

**Separación clara:** El paciente entiende que paga:
1. A Ancora por el software (29-39 EUR/mes).
2. Al psicólogo por la terapia (50-80 EUR/sesión, pactado directamente con el profesional).

**Ventaja competitiva:** El paciente sabe exactamente qué paga y a quién. Sin comisiones ocultas ni mezcla de conceptos.

### 6.5 Paquetes de créditos extra

**Monetización de uso intensivo:**

| Pack | Precio | Incluye | Coste/hora GPU | Margen plataforma |
|---|---|---|---|---|
| Chat Extra Básico | 9 EUR | +5 horas chat IA (30 min extra/día) | 1,80 EUR/hora | 73% |
| Chat Extra Intensivo | 25 EUR | +20 horas chat IA (2h extra/día) | 1,25 EUR/hora | 81% |
| Revisión Premium | 15 EUR | 1 revisión extra de psicólogo (urgente, 24h) | N/A (pago a psicólogo) | Variable |
| Pack Exportación Avanzada | 5 EUR | Exportación FHIR + JSON completo + informe PDF personalizado | 0,50 EUR | 90% |

**Coste operativo de chat extra:**
- Servidor dual RTX 4090: 6.530 EUR (amortizado a 3 años) = 181 EUR/mes.
- Electricidad (900W x 12h/día x 0,18 EUR/kWh) = 58 EUR/mes.
- Mantenimiento: 50 EUR/mes.
- Total coste servidor/mes: ~289 EUR.
- Capacidad: 640 sesiones de 15 min/día = 160 horas/mes.
- **Coste por hora de chat IA: ~1,81 EUR.**
- Pack de 5 horas a 9 EUR = 1,80 EUR/hora de coste -> 7,20 EUR de margen.

---

## Resumen Ejecutivo del Modelo

**Esquema general:**

```
               PACIENTE
                   |
                   | Pago único por todo
                   v
          STRIPE CONNECT
                   |
          +--------+--------+
          |                 |
          v                 v
     ANCORA (29-39 EUR)   PSICOLOGO (50-80 EUR)
     + IVA 21%            Exento IVA
     Factura SaaS         Factura clínica
          |                 |
          v                 v
     Declara:             Declara:
     - Modelo 303 (IVA)   - Modelo 130/131 (IRPF)
     - Modelo 347         - Modelo 347
     - Impuesto Sociedades
```

**Ventajas del modelo:**
1. **Sin riesgo de laboralidad:** El psicólogo no es empleado, es cliente del SaaS y prestador de servicios clínicos independiente.
2. **Blindaje fiscal del psicólogo:** Sus honorarios están exentos de IVA (Art. 20.Uno.3 LIVA), no actúa como intermediario sino como profesional sanitario directo.
3. **Margen altísimo en SaaS:** 95%+ en planes de psicólogo, 73%+ en packs de créditos.
4. **Efecto red viral:** Psicólogos traen pacientes, pacientes retienen psicólogos. Crecimiento orgánico.
5. **Rentabilidad desde el mes 1:** Con solo 20 pacientes + 10 psicólogos se cubren costes fijos.
6. **LTV/CAC excepcional en canal orgánico:** 79x cuando el paciente llega vía su psicólogo.
7. **Escalabilidad predecible:** Cada servidor GPU adicional (6.530 EUR) soporta ~1.000 DAU y se amortiza en ~16 meses.

**Riesgos principales:**
1. **Churn en canal frío:** LTV/CAC de 0.07x en escenario pesimista de ads. Minimizar inversión en publicidad fría.
2. **Dependencia de psicólogos:** Si abandonan, arrastran pacientes. Mitigar con lock-in de historia psicológica + Smart SOAP.
3. **Complejidad fiscal del split:** Stripe Connect no maneja retenciones IRPF automáticas. Requiere desarrollo de capa de facturación.
4. **Riesgo de disputas:** Chargebacks afectan a ambas cuentas. Política clara de reembolsos necesaria.

---

*Documento generado para Ancora.clinic - Mayo 2026*
*Próxima iteración: Integración con API de facturación (FacturaScripts/Anfix) y automatización del Modelo 111.*
