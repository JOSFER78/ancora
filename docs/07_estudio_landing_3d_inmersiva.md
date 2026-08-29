# ⚓ 07 · Estudio de Landing Page 3D Inmersiva: Arquitectura Náutica-Cerebral

**Ubicación:** `docs/07_estudio_landing_3d_inmersiva.md`  
**Estado:** Activo / Especificación Técnica de Producto & 3D  
**Proyecto:** Áncora (Human-in-the-Loop Clinical AI)  
**Entorno:** Web Responsive + Capacitor Mobile (Android / iOS)

---

## 1. Resumen Ejecutivo del Estudio

Este documento define la arquitectura técnica, narrativa y de interacción para la nueva **Landing Page Inmersiva 3D de Áncora**. 

El objetivo es sustituir las interfaces estáticas convencionales por una experiencia visual interactiva que transmita la esencia del producto:
- **La Náutica (El Mar y el Ancla):** Metáfora de la tormenta emocional, la deriva de los pensamientos y el anclaje a tierra firme a través de la contención clínica y la autorregulación somática.
- **La Neurociencia (El Árbol Vital y la Red Sináptica):** Metáfora de la memoria viva longitudinal, la estructuración de hitos biográficos y la sinergia *Human-in-the-Loop* entre la IA y el psicólogo colegiado.

---

## 2. Decisiones Técnicas Fundamentales (Estadio 1)

1. **Stack Gráfico Seleccionado:** **Three.js puro con Shaders GLSL procedurales** (descartando Spline Runtime por sobrepeso de 1.8MB+, dependencia de CDN y riesgo de fallos por memoria Jetsam en iOS).
2. **Control de Shaders Terapéuticos:**
   - Shaders de agua con **modulación de frecuencia respiratoria a 0.1 Hz (6 respiraciones/min)** para inducir coherencia cardíaca y calma visual.
   - Sistema de partículas para la **red sináptica** con advección mediante campo vectorial *Curl Noise*.
3. **Sensores Móviles:** Soporte completo de giroscopio con solicitud de permisos en iOS (`DeviceOrientationEvent.requestPermission()`), normalización a coordenadas normalizadas [-1, 1] y filtro paso bajo anti-jitter.
4. **Scrollytelling Pasivo:** Pista DOM nativa con canvas en `position: sticky; pointer-events: none;`, garantizando **cero scroll-jacking** y total compatibilidad con lectores de pantalla y gestos móviles inerciales.

---

## 3. Storyboard de las 4 Etapas del Recorrido (Estadio 2)

| Etapa | Nombre | Elementos 3D en Escena | Dinámica Visual y de Cámara | Mensaje Central del Ecosistema |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **La Deriva y la Tormenta** | Océano nocturno agitado (`#030712`), partículas de niebla marina, cielo abisal. | Oleaje turbulento con ondulaciones Simplex; cámara con deriva flotante suave. | *"Tu vida no cabe en una hora de consulta. Áncora no te deja solo entre sesión y sesión."* |
| **2** | **El Anclaje y la Contención** | Áncora Dorada 3D (`#f59e0b`) iluminada con halo Fresnel, oleaje que se calma a 0.1 Hz. | El ancla desciende y estabiliza el agua; el ritmo de luz guía la respiración profunda. | *"La primera memoria viva que acompaña tus días, recuerda lo que sientes y te ayuda a regularte."* |
| **3** | **La Red Neuronal y la Supervisión** | Nodos sinápticos interconectados (1.200 nodos), filamentos axónicos, impulsos de luz. | El ancla se desmaterializa en un grafo cerebral; los nodos reaccionan al cursor/giroscopio. | *"La IA acompaña y estructura con citas literales; tu psicólogo colegiado diagnostica y dirige."* |
| **4** | **El Faro y el Rumbo Vital** | Haz de luz volumétrico colimado (faro clínico), métricas transparentes *Patient 360*. | Disipación de niebla, enfoque en botones de Onboarding y selección de psicólogo. | *"Llega a cada sesión con el contexto exacto. Sin perder tiempo en repetir tu historia."* |

---

## 4. Garantías de Rendimiento y Seguridad (Estadio 4)

- **Capping Dinámico de DPR:** Máximo de 1.5 en móviles para evitar saturación de fill-rate en pantallas Retina/AMOLED.
- **Ciclo de Vida Limpio (`deepDispose`):** Liberación total de geometrías, materiales, texturas e instancias de memoria al desmontar la vista.
- **Pausa Automática en Segundo Plano:** Detección con `document.visibilityState` y `App.addListener('appStateChange')` de Capacitor para suspender el render loop y proteger la batería.
- **Modo Inspección 360°:** El canvas permanece pasivo para el scroll ordinario; solo activa controles orbitales interactivos cuando el usuario pulsa explícitamente el botón *"Modo Exploración 3D"*.
