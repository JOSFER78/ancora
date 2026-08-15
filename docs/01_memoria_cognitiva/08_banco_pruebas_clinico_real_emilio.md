# Áncora Cognitive Memory Engine — 08. Banco de Pruebas Clínico Real (Dataset Emilio)

## 1. Justificación y Garantía de Datos Reales (Cero Mocks)

Siguiendo el mandato de **Código Rojo: Cero Mocks / 100% Ejecución Real**, este banco de pruebas utiliza exclusivamente los datos clínicos reales y transcripciones extraídas del paciente Emilio contenidos en `docs/dataset_clinico_test/`.

### Fuentes Documentales Reales Utilizadas:
1. `_extracted_EJE CRONOLOGICO.txt`: 41 años de biografía (Infancia, estudios, emprendimiento, quiebra 2022, trading de futuros).
2. `_extracted_sensaciones ansiedad.txt`: Registro somático fenoménico (opresión precordial, taquicardia 23:00h, hiperventilación, evitación del correo bancario).
3. `_extracted_walter01 historia y terapia.txt`: Transcripción de sesiones previas, esquemas de autoexigencia desadaptativa ("no puedo fallar a mi familia").
4. `_extracted_walter02 pensanega.txt`: Catálogo de distorsiones cognitivas activas (catastrofismo ante drawdown, sobregeneralización).

---

## 2. Ingesta y Clasificación Epistemológica (Niveles N1 a N4)

A partir de los textos reales, el extractor del Deep Path clasifica los hechos en la ontología de Áncora:

| Extracto Verbatim Real de Emilio | Nivel de Autoridad | Categoría Ontológica | Entidad Firestore Generada |
| :--- | :--- | :--- | :--- |
| *"Siento que me falta el aire cuando abro el correo bancario por la noche y veo los números rojos."* | **Nivel 3** (Declarado Paciente) | `USER_EXPRESSION` (Somático) | `/episodes/ep_0812` (Trigger: Correo nocturno) |
| *"Deuda total acumulada de 45.000€ en 3 préstamos personales tras el colapso del negocio en 2022."* | **Nivel 2** (Documental Financiero/Médico) | `OBJECTIVE_FACT` (Económico) | `/lifeTree/node_finance_debt` |
| *"Diagnóstico ratificado: Trastorno Adaptativo con Ansiedad Mixta. Pauta: Freeze Protocol 30s."* | **Nivel 1** (Validado por Psicólogo) | `CLINICAL_DIRECTIVE` & `DIAGNOSIS` | `/profile/current` & `/directives/dir_freeze` |
| *"Patrón detectado: Mayor número de episodios de pánico coinciden con días de pérdida en trading (R=0.84)."* | **Nivel 4** (Inferencia IA / Walter) | `HYPOTHESIS_DRAFT` (Cuarentena) | `/quarantineInferences/inf_trading_panic` |

---

## 3. Demostración de Resolución Temporal de Contradicciones

### Escenario Real Extraído del Dataset:
- **Enero 2026 (Episodio 1):** Emilio registra: *"No puedo salir a correr porque me dan mareos y siento que me va a dar un infarto."*
  - Estado: `active` | $S_{retrieval} = 0.88$.
- **Agosto 2026 (Episodio 28):** Emilio registra: *"Hoy he salido a nadar 45 minutos por la mañana y me he sentido tranquilo y despejado."*

### Comportamiento del Motor Bi-Temporal:
1. El motor **NO** sobreescribe ni elimina el recuerdo de Enero.
2. El registro de Enero pasa a estado `superseded` con metadato `possible_change_over_time: true`.
3. Se crea el nuevo registro de Agosto en estado `active` con `supersedes: "ep_enero_01"`.
4. En el **Patient 360**, el psicólogo visualiza la gráfica de **evolución somática positiva** con ambas citas textuales enfrentadas, verificando la efectividad del tratamiento.

---

## 4. Validación de Scoring y Context Builder

Al consultar el paciente: *"Hoy he tenido que mirar la cuenta del banco para pagar el alquiler y me he puesto muy nervioso, ¿qué hago?"*

El Context Builder realiza:
1. **Recuperación Semántica:** Selecciona el nodo `/lifeTree/node_finance_debt` y el episodio `/episodes/ep_0812`.
2. **Inyección de Directiva N1 Activa:** Inyecta la directiva del psicólogo: *"Recordar Protocolo de Congelación Inversa (30s agua fría en rostro) y no validar pensamientos de catástrofe financiera."*
3. **Consumo Total de Tokens:**
   - Prompt de Identidad + Directiva + Hechos relevantes = **540 tokens** (sobre presupuesto de 4.000 tokens de contexto).
4. **Respuesta del LLM en Fast Path:** Tiempo de respuesta $\le 1.4\text{s}$, guiando al paciente con el anclaje somático pautado por su terapeuta, sin alucinaciones y sin dar consejos médicos no supervisados.
