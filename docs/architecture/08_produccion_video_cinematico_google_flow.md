# 🛸 08 · Plan de Producción de Vídeo Cinemático Google Flow & Veo 3.1: Áncora

**Ubicación:** `docs/architecture/08_produccion_video_cinematico_google_flow.md`  
**Autor:** Chief Cinematic Director (10autoflow / Future City Engine & Antigravity 2.0)  
**Destino:** Google Flow, Gemini Omni Flash & Google Veo 3.1  
**Estándar Óptico:** ARRI Alexa 65 / Hasselblad X2D 100C • Lentes Master Prime 24mm & 35mm (f/2.8)

---

## 1. Fundamentos de Producción: De la Geometría 3D al Fotorrealismo Óptico

Se abandona el renderizado WebGL procedural basado en cajas y polígonos simples en favor de una **experiencia visual cinematográfica fotorrealista continua** con navegación interactiva mediante fotogramas de alta resolución y secuencias de vídeo generadas con Google Flow y Veo 3.1.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎬 ESPECIFICACIÓN CINEMATOGRÁFICA DE ALTA GAMA (ÁNCORA)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Sensor / Color: ARRI Alexa 65 / Hasselblad X2D 100C (RAW 8K).             │
│ • Óptica: Master Prime 24mm & 35mm (f/2.8), profundidad de campo óptica real.│
│ • Espacio de Color: ACEScg / DCI-P3, gradación en Azul Abisal & Ámbar Cálido.│
│ • Navegación: Scrollytelling pasivo con interpolación de fotogramas clave.   │
│ • Audio Sincronizado: Coreografía acústica por fases (Intro -> Outro).      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Matriz Multimodal de 7 Slots (Gemini Omni Flash) por Escena

### Escena 01: "La Tormenta y la Rumiación Nocturna" (0.0s - 4.5s)
* **Fase Musical:** INTRO (*Establishing Cinematic Glide*).
* **Slots Multimodales:**
  1. `<FIRST_FRAME> @Image1`: Plano general del mar nocturno abisal bajo nubes de tormenta y reflejo lunar.
  2. `<IMAGE_REF_0..4> @Image2..@Image6`: 5 tomas radiales limpias a $60^\circ$ del oleaje en movimiento.
  3. `<IMAGE_REF_5> @Image7`: Vector de aproximación de cámara descendente suave.
* **Prompt para Veo 3.1:**
  ```text
  [# Sources <FIRST_FRAME>@Image1]
  [# References <IMAGE_REF_0>@Image2, <IMAGE_REF_1>@Image3, <IMAGE_REF_2>@Image4, <IMAGE_REF_3>@Image5, <IMAGE_REF_4>@Image6, <IMAGE_REF_5>@Image7]
  MOTION VECTOR DIRECTIVE: @Image7 serves ONLY as an abstract spatial translation vector for camera sensor navigation. DO NOT render the red line, red stroke, numbers 1 or 2, HUD markers, or any graphic overlays into the generated video.
  
  Cinematic wide establishing shot gliding forward across deep stormy oceanic waves under dark volumetric midnight clouds, subtle moonlit reflection on sea crests, color palette in deep navy (#030712) and icy slate, ARRI Alexa 65, 35mm Master Prime, f/2.8, zero digital noise, hyperrealistic physical fluid dynamics.
  ```

---

### Escena 02: "El Faro de Contención y el Anclaje" (4.5s - 9.0s)
* **Fase Musical:** VERSE (*Low-Altitude Coastal Glide & Beacon Reveal*).
* **Prompt para Veo 3.1:**
  ```text
  Cinematic coastal low-altitude tracking shot sweeping around a rugged cliff where a solitary lighthouse beacon glows with warm amber light, water surface gently calming with smooth ripples, dawn twilight sky transitioning from deep cyan to warm golden horizon, Hasselblad X2D 100C, 50mm f/2.0, atmospheric sea mist clearing, serene grounding emotional tone.
  ```

---

### Escena 03: "El Espacio Clínico y el Vínculo Humano" (9.0s - 13.5s)
* **Fase Musical:** BUILDUP (*Intimate Medium Dolly & Natural Light Flow*).
* **Prompt para Veo 3.1:**
  ```text
  Cinematic documentary medium slow push-in shot of a patient sitting in a warm minimalist modern therapy room, smiling with relief while looking at an open journal, compassionate psychologist softly blurred in background, natural morning sunlight casting soft shadows, ARRI Alexa Mini LF, 35mm f/2.0, shallow depth of field, authentic emotional resonance.
  ```

---

### Escena 04: "El Puerto Seguro y el Rumbo Vital" (13.5s - 18.0s)
* **Fase Musical:** OUTRO (*Panoramic Horizon Ascent & Golden Sunrise*).
* **Prompt para Veo 3.1:**
  ```text
  Cinematic panoramic crane pull-back and gentle ascent over a peaceful coastal harbor at sunrise, calm golden glassy water with small boats moored at a wooden pier, morning mist evaporating under bright sun rays, sense of profound emotional clarity and forward momentum, Hasselblad X2D 100C, 24mm Master Prime, 8k photorealistic film still.
  ```

---

## 3. Arquitectura del Visor Web Interactivo de Capturas Cinemáticas

1. **Secuenciador de Fotogramas Fotorrealistas:** En lugar de geometrías WebGL opacas, el visor monta un sistema de capas fotográficas de alta definición con transiciones de disolución cruzada (*crossfade*) por hardware (`opacity` + `transform: scale(1.05) -> scale(1.0)`).
2. **Barra de Scrubber & Telemetría:** Permite pausar, avanzar fotograma a fotograma o activar el modo reproducción automática cinemática.
3. **Tarjeta de Información Clínica Desplegable:** Cada fotograma enlaza con la directiva clínica real, la cita *verbatim* auditada y la métrica de producto de Áncora.
