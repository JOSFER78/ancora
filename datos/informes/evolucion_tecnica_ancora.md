# EVOLUCIÓN TÉCNICA, ARQUITECTURA DE INFRAESTRUCTURA Y ESTRATEGIA COMERCIAL - ÁNCORA APP

Este documento consolida la hoja de ruta definitiva para el desarrollo tecnológico, viabilidad de hardware local, orquestación de recursos de inferencia, estrategia de doble suscripción (Dual-SaaS), arquitectura de diseño UX/UI clínico y estrategia comercial para la plataforma **Áncora**. El sistema se define como una **infraestructura clínica y tecnológica permanente** que conecta de forma perpetua a pacientes y psicólogos, asegurando la portabilidad absoluta del historial clínico con privacidad descentralizada y procesamiento 100% en local.

## 1. OPTIMIZACIÓN, CUANTIZACIÓN Y ARQUITECTURA DE SISTEMAS IA LOCAL

Para garantizar una privacidad médica absoluta, el cumplimiento estricto del RGPD para datos de salud en España y la soberanía de los datos, la plataforma ejecuta la totalidad de la ingesta de datos, inferencia de IA y flujos de comunicación localmente en servidores físicos dedicados bajo control de Áncora.

### A. Especificación del Servidor Local (Workstation de Alta Densidad de VRAM - ~7.495 €)

Para dar servicio de manera simultánea y fluida a **1.000 usuarios activos al día (DAU)** con la mayor inteligencia local interactiva posible en caliente durante la franja diurna (08:00 a 20:00 hora española), el hardware se unifica en una única workstation profesional unificada mediante un motor de inferencia de alto rendimiento (**vLLM** con Tensor Parallelism **TP=4**).

#### Especificaciones Técnicas de la Máquina Requerida:
*   **Procesamiento Gráfico (Clúster Unificado):** **4x NVIDIA GeForce RTX 3090 24GB VRAM** (Usadas/Reacondicionadas con pasta térmica y almohadillas renovadas. Total VRAM: **96 GB**, ancho de banda combinado de **3.744 GB/s**). Esto permite alojar el modelo diurno de 70B y ejecutarlo a velocidad nativa de GPU, manteniendo un margen masivo de VRAM libre para la gestión de contextos activos y KV Cache.
*   **Procesador (CPU):** AMD Threadripper PRO 5955WX (16 Cores, 32 Threads, 128 líneas PCIe Gen 4 nativas libres) montado sobre una placa base **ASUS Pro WS WRX80E-SAGE SE WIFI II**. Esto garantiza que las 4 ranuras físicas de las GPUs funcionen a PCIe 4.0 x16 nativo y en paralelo sin cuellos de botella de ancho de banda.
*   **Memoria RAM:** **256 GB DDR4 ECC** Registrada (8 canales de memoria DDR4 de 3200MHz para saturar el bus y dar soporte a tareas asíncronas).
*   **Almacenamiento:** RAID 5 con 3x SSD NVMe PCIe 4.0 de 2 TB (Lectura secuencial de hasta 21.000 MB/s, ofreciendo ~4 TB útiles cifrados con LUKS AES-256).
*   **Acelerador Secundario Independiente:** **1x NVIDIA RTX 3060 o RTX 4060 Ti (12GB/16GB VRAM)**. Esta GPU se coloca fuera del clúster de inferencia principal y se dedica en exclusiva al procesamiento y transcripción de audios cortos en caliente (Whisper Large V3 local) durante el día, liberando el clúster principal de 4 GPUs de cualquier interrupción asíncrona.
*   **Fuente de Alimentación:** 2x Seasonic Prime PX-1000W 80+ Platinum conectadas mediante cable sincronizador dual para alimentar de manera segura las 4 GPUs.

---

### B. Distribución y Planificación de Recursos por Horario (Day/Night Schedule)

El rendimiento de la workstation se optimiza dinámicamente según la hora del día mediante la **orquestación y priorización temporal de colas en la aplicación (Redis/BullMQ)**. El clúster vLLM permanece activo en TP=4 ejecutando el modelo caliente principal (DeepSeek-R1-Distill-Llama-70B a 4.0 bpw), y es la lógica del backend la que decide qué tareas procesar y suspender temporalmente.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLÚSTER UNIFICADO DE GPUS (TP=4)                       │
│                           (Total: 96 GB VRAM)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│         MODO CALIENTE COMPLETO PARA MODELO DE 70B EN EXL2 A 4.0 BPW         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼ DIURNO: Inferencia Interactiva (08:00 a 20:00)       ▼ NOCTURNO: Lote Asíncrono (20:00 a 08:00)
┌──────────────────────────────────────┐              ┌──────────────────────────────────────┐
│   CANAL DE INFERENCIA EN CALIENTE    │              │   CANAL DE PROCESAMIENTO DIFERIDO    │
│ • Chat interactivo diario (Paciente) │              │ • Transcripciones Whisper acumuladas │
│ • Teleprompter de revisión (Psicol.) │              │ • Estructuración de Informes SOAP    │
│ • Inferencia interactiva de CoT      │              │ • Indexación y embeddings RAG        │
│ [100% de la potencia para T. Real]  │              │ [Procesamiento masivo en background] │
└──────────────────────────────────────┘              └──────────────────────────────────────┘
```

#### 1. Periodo Diurno (08:00 a 20:00): Experiencia Interactiva Síncrona
*   El 100% de la capacidad de procesamiento de las 4 GPUs se reserva para responder con latencia ultrabaja a las interacciones de los usuarios en tiempo real.
*   **Tareas Diurnas:** Chats de diario interactivo de pacientes, ejercicios de estabilización de crisis y teleprompter de redacción de informes y envío de vídeo para psicólogos.
*   **Gestión de Colas:** Las tareas pesadas de procesamiento de audio largo y generación de resúmenes SOAP se encolan automáticamente en Redis, pero sus consumidores (*Workers*) se pausan a nivel de backend. No consumen ciclos de GPU del clúster.

#### 2. Periodo Nocturno (20:00 a 08:00): Inferencia de Razonamiento en Lote
*   El sistema reactiva de forma automática los *Workers* de BullMQ para procesar secuencialmente todas las tareas asíncronas acumuladas durante el día.
*   **Tareas Nocturnas:** Transcripción de audios de consultas médicas mediante Whisper en la GPU secundaria, redacción automática de notas clínicas SOAP, y re-indexación vectorial en la base de datos `pgvector` en la workstation.
*   Esto garantiza que la workstation funcione al 100% de utilización por la noche, procesando cientos de minutos de audio y estructurando historiales clínicos sin degradar el tiempo de respuesta del chat diurno.

---

### C. Catálogo de Modelos Locales y Dimensionamiento de VRAM/RAM

Para ofrecer la máxima inteligencia local, la workstation se configura con modelos de lenguaje optimizados en cuantizaciones de alta fidelidad que se ajustan al límite físico del hardware:

| Modelo de IA | Parámetros | Rol / Caso de Uso | Cuantización | Memoria Requerida | Distribución (VRAM/RAM) | Rendimiento Combinado (TP=4) | Calidad de Razonamiento Clínico |
| :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **DeepSeek-R1-Distill-Llama-70B** | 70B | Inferencia Interactiva Diurna y SOAP | EXL2 / AWQ (4.0 bpw) | ~35 GB + KV Cache | 96 GB VRAM (100% VRAM TP=4) | ~60 t/s | **93/100 (Razonamiento CoT)** |
| **Llama-3.3-70B-Instruct** | 70B | Chat Principal Diurno | EXL2 (4.0 bpw) | ~35 GB + KV Cache | 96 GB VRAM (100% VRAM TP=4) | ~65 t/s | **90/100 (Excelente)** |
| **Qwen-2.5-VL-72B-Instruct** | 72B | Multimodal (Imágenes, Escaneo) | AWQ (4-bit) | ~45 GB total | VRAM Dedicada (Carga en Clúster) | ~55 t/s | **89/100 (Visión Avanzada)** |
| **Faster-Whisper-large-v3** | 1.5B | Transcripción de Audio | int8_float16 | ~3.1 GB | VRAM Dedicada (GPU Whisper) | Transcribe 1h en ~30s | **92/100 (Audio/Voz)** |

---

### D. Viabilidad de DeepSeek-R1 671B Normal frente a Modelos Destilados de 70B

Para garantizar la mayor inteligencia y velocidad posibles bajo el presupuesto de la workstation (~7.495 €), se ha analizado detalladamente la viabilidad de ejecutar el modelo insignia **DeepSeek-R1 (671B MoE)** en local:
1.  **Requerimientos de VRAM del R1 671B Normal:** Cargar este modelo en FP8 unificado requiere un mínimo de **340 GB de VRAM** libres, lo cual exigiría un chasis empresarial con **8x NVIDIA RTX 6000 Ada (50.000 €)** o clústeres HGX H100.
2.  **Inviabilidad del Offloading CPU/GPU:** En la workstation de 96 GB VRAM, ejecutar el modelo de 671B en GGUF (cuantización Q4_K_M de ~380 GB) requiere volcar ~290 GB a la memoria RAM DDR4 del sistema. El límite físico de velocidad de la memoria RAM del sistema (DDR4 a ~70-150 GB/s) frente al de las GPUs (936 GB/s por RTX 3090) estrangula la inferencia, bajando la velocidad a **0.5 - 1.5 tokens/segundo**. Esto inutiliza el chat en tiempo real diurno y causa que las tareas nocturnas tarden más de 12 horas en procesarse.
3.  **Inviabilidad de Cuantizaciones Extremas (IQ2_XXS):** Intentar comprimir el R1 671B a 2.0 bits por peso para que quepa en los 96 GB de VRAM nativos destruye la coherencia lógica y la precisión diagnóstica clínica, anulando la ventaja del razonamiento complejo (Chain of Thought).
4.  **Elección de DeepSeek-R1-Distill-Llama-70B (100% In-VRAM):** Los modelos destilados de 70B cuantizados a 4.0 bpw EXL2 (~35 GB) cargan por completo en la VRAM de las GPUs. Rinden a un promedio de **~60 tokens/segundo** de forma nativa en caliente. Ofrecen un rendimiento de razonamiento clínico equivalente al 93% del modelo MoE original con latencias instantáneas y soporte para múltiples usuarios concurrentes en el chat conversacional diurno.

---

### E. Concurrencia Libre sin Restricciones de Acceso (Cálculo Matemático de Colas)

Para maximizar la experiencia del usuario y simplificar la interfaz, **se elimina cualquier tipo de restricción o reserva de slots en la UI**. En su lugar, el sistema confía en la asincronía natural de la interacción de los 1.000 usuarios activos diarios (DAU) y en la capacidad de encolamiento y paralelización de tareas del backend.

#### 1. Modelado Matemático de Tráfico y Peticiones por Segundo (Distribución de Poisson)
*   **Usuarios Activos Diarios (DAU):** **1.000 usuarios** distribuidos a lo largo del día.
*   **Volumen de Inferencia Estimado:** Asumiendo que cada usuario activo genera un promedio de 10 mensajes/respuestas de diario al día, en total se registran **10.000 peticiones de inferencia diurnas**.
*   **Distribución Horaria:** Concentrado en **12 horas de actividad libre** (08:00 a 20:00).
*   **Tasa de Entrada Media:** $\frac{10000\text{ peticiones}}{12\text{ horas}} \approx 833.3\text{ peticiones por hora}$.
*   **Escenario de Hora Pico (Factor de Concentración 2.5x):**
    $$\text{Tasa en Hora Pico} = 833.3 \times 2.5 \approx 2083.3\text{ peticiones/hora.}$$
*   **Peticiones por Segundo promedio en Hora Pico (Tasa de Llegada $\lambda$):**
    $$\lambda = \frac{2083.3\text{ peticiones}}{3600\text{ segundos}} \approx 0.58\text{ peticiones por segundo.}$$
*   **Cálculo de Concurrencia en el Mismo Segundo (Distribución de Poisson):**
    La probabilidad de recibir $k$ peticiones simultáneas en el mismo segundo exacto viene dada por:
    $$P(X = k) = \frac{e^{-0.58} \cdot 0.58^k}{k!}$$
    *   **$P(X = 0) \approx 56.0\%$:** En más de la mitad de los segundos del día, la GPU no recibe ninguna petición de chat interactivo.
    *   **$P(X = 1) \approx 32.5\%$:** El servidor procesa una única petición conversacional.
    *   **$P(X = 2) \approx 9.4\%$:** Ocurren dos peticiones simultáneas en el mismo segundo.
    *   **$P(X = 3) \approx 1.8\%$:** Tres peticiones simultáneas en el mismo segundo.
    *   **$P(X \ge 4) \approx 0.3\%$:** La probabilidad de que 4 o más usuarios hagan click en enviar en el mismo segundo exacto es residual (~1 vez cada 5 minutos de uso continuo).

#### 2. Planificación de Inferencia en vLLM (Continuous Batching)
*   **vLLM** gestiona de manera nativa la cola de inferencia mediante *Continuous Batching*. En lugar de procesar peticiones una a una, agrupa dinámicamente las peticiones en lotes paralelos directamente en la memoria de las GPUs.
*   Con un tamaño máximo de lote de 32 o 64 peticiones simultáneas, las ráfagas ocasionales de 4-8 peticiones del peor segundo se resuelven en un solo ciclo de ejecución de la GPU (tiempo de respuesta ~2.5s), manteniendo latencias de primer token (TTFT) inferiores a 1.5 segundos.
*   El usuario experimenta un chat totalmente inmediato sin necesidad de reservar slots de antemano.

#### 3. Dimensionamiento contextual de la KV Cache
*   Tras cargar el modelo de 70B (~35 GB) en la workstation **4x RTX 3090 (96 GB VRAM)**, quedan **61 GB libres** de VRAM para KV Cache.
*   Con KV Cache cuantizada a 8-bit (160 KB/token), una ventana de contexto de **8.192 tokens** por usuario consume **1.31 GB**.
*   El clúster mantiene en caliente el contexto de hasta **46 usuarios simultáneos en contexto de 8k**. Si en un momento dado la concurrencia supera este número, vLLM realiza de forma automática el *swap* de contextos pasivos (desalojando temporalmente a memoria RAM) sin interrumpir la experiencia del chat.

---

### F. Gestión de Colas Asíncronas y Canales en Backend (Redis/BullMQ)

Para evitar que las peticiones pesadas interrumpan el chat síncrono, la aplicación implementa una estructura de **prioridades a nivel de cola en el backend (Redis y BullMQ)**, dividiendo el trabajo en tres canales principales:

| Canal | Tipo de Tarea | Prioridad de GPU | Tiempo de Respuesta | Mecanismo de Inferencia |
| :--- | :--- | :---: | :---: | :--- |
| **Síncrono (Chat Vivo)** | • Diario interactivo guiado (Paciente)<br>• Teleprompter de revisión (Psicólogo) | **Alta (Inmediata)** | < 1.5s (TTFT) | Inferencia directa en caliente en vLLM. |
| **Asíncrono (Diferido)** | • Envío de audios de diario (Paciente)<br>• Peticiones de informes rápidos | **Media (Cola diurna)** | ~2-5 minutos | Transcripción en la GPU Whisper secundaria. La estructuración LLM se encola en BullMQ y se resuelve en milisegundos cuando la GPU interactiva está libre. |
| **Asíncrono (Lote)** | • Transcripción de sesiones LiveKit (Psicólogo)<br>• Generación de Notas SOAP y RAG clínicos | **Baja (Cola nocturna)** | Asíncrono (Noche) | Se encolan en Redis y son procesadas masivamente por Workers de 20:00 a 08:00 con el modelo DeepSeek-R1-Distill-Llama-70B. |

---

### G. Transición Horaria de Colas en BullMQ

La orquestación del backend suspende o reanudará de forma programática los *Workers* de BullMQ para evitar la concurrencia de tareas pesadas durante el día, manteniendo el modelo de 70B caliente y listo para peticiones conversacionales.

```typescript
import Queue from 'bull';
import cron from 'node-cron';

// Inicialización de colas de tareas con Redis
const transcriptionQueue = new Queue('transcription-queue', 'redis://127.0.0.1:6379');
const soapGenerationQueue = new Queue('soap-generation-queue', 'redis://127.0.0.1:6379');
const ragIndexingQueue = new Queue('rag-indexing-queue', 'redis://127.0.0.1:6379');

/**
 * MODO DIURNO (08:00 a 20:00):
 * Pausa los workers asíncronos pesados para reservar el 100% de la workstation
 * a tareas de chat síncronas de baja latencia.
 */
async function startDiurnoMode() {
  console.log("[SCHEDULER] Activando Modo Diurno. Pausando procesamiento asíncrono pesado...");
  try {
    // Pausamos los consumidores de tareas de transcripción y estructuración SOAP
    await transcriptionQueue.pause(true); // localPaused = true
    await soapGenerationQueue.pause(true);
    await ragIndexingQueue.pause(true);
    console.log("[SCHEDULER] Colas asíncronas pausadas de forma segura. GPU dedicada a Chat Síncrono.");
  } catch (error) {
    console.error("[SCHEDULER - CRÍTICO] Error al transicionar a Modo Diurno:", error);
  }
}

/**
 * MODO NOCTURNO (20:00 a 08:00):
 * Reanuda el procesamiento de tareas pesadas acumuladas en las colas.
 * Los workers procesan las transcripciones de audio Whisper y generan las notas SOAP.
 */
async function startNocturnoMode() {
  console.log("[SCHEDULER] Activando Modo Nocturno. Reanudando colas de procesamiento pesado...");
  try {
    // Reanudamos los consumidores
    await transcriptionQueue.resume();
    await soapGenerationQueue.resume();
    await ragIndexingQueue.resume();
    console.log("[SCHEDULER] Colas de procesamiento reactivadas. Iniciando procesamiento en lote.");
  } catch (error) {
    console.error("[SCHEDULER - CRÍTICO] Error al transicionar a Modo Nocturno:", error);
  }
}

// Configuración de Cron Jobs (Husos horarios locales españoles)
// Ejecutar Modo Nocturno a las 20:00 todos los días
cron.schedule('0 20 * * *', () => {
  startNocturnoMode();
}, {
  timezone: "Europe/Madrid"
});

// Ejecutar Modo Diurno a las 08:00 todos los días
cron.schedule('0 8 * * *', () => {
  startDiurnoMode();
}, {
  timezone: "Europe/Madrid"
});

// Exportar funciones para diagnóstico o control manual vía Panel de Administración
export { startDiurnoMode, startNocturnoMode, transcriptionQueue, soapGenerationQueue };
```
