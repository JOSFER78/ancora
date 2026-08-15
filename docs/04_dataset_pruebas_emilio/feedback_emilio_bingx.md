# Propuesta y Feedback de Experiencia de Producto en BingX - Emilio J.

Hola, buenas. Escribo este documento para detallar mi experiencia real en la plataforma, tal como me pedisteis para el feedback del producto de futuros. Espero que sirva de algo y no caiga en saco roto, porque opero todos los días y hay cosas que de verdad me complican la vida.

Llevo algo más de año y medio usando BingX, sobre todo para futuros perpetuos. Hago bastantes operaciones en el Oro (XAUUSD) y en Bitcoin, a veces más tranquilo y otras veces scalping a saco cuando veo volumen en las aperturas. Suelo mover unos 250.000 o 300.000 USDT al mes en volumen de trading total, dependiendo de si el mercado está interesante o si ando de viaje con el trabajo (soy fotoperiodista y a veces me toca cubrir cosas de urgencia y operar desde el portátil en cualquier sitio con mala conexión o desde el móvil corriendo).

Para mí, lo mejor que tiene BingX es que la aplicación móvil va bastante fluida para cerrar posiciones rápido si la cosa se tuerce, y que las comisiones no te comen vivo como en otros exchanges. El gráfico de TradingView que tenéis integrado en la web también va fino para dibujar niveles.

Sin embargo, hay una parte que me resulta un auténtico dolor de muelas y que me ha costado bastante dinero por cometer errores tontos: **el cálculo del tamaño de la posición y la gestión de las órdenes antes de entrar.**

Cuando el mercado se mueve rápido (por ejemplo, con noticias de tipos o el IPC), si quieres operar con cabeza y controlar el riesgo de verdad, tienes que hacer cálculos matemáticos a contrarreloj. Tienes que ver dónde pones el Stop Loss en el gráfico, restar el precio de entrada, calcular la distancia, y luego ver qué tamaño de contrato o lote tienes que meter para arriesgar, por ejemplo, 50 o 100 dólares de tu balance. 

Si te pones a hacer estas cuentas de cabeza o abriendo una calculadora en el móvil mientras el precio de Bitcoin se mueve a doscientas pulsaciones por segundo, pasan dos cosas:
1. O tardas demasiado, metes los datos a mano en el panel derecho de la web tarde y para cuando le das a comprar el precio ya se ha ido un 0.5% a tu favor (con lo que tu ratio de riesgo ya no sirve de nada).
2. O lo haces rápido a ojo y te equivocas al poner un decimal en el Stop Loss o metes el triple de lotaje del que debías por la prisa. A mí ya me ha pasado alguna vez que he quitado el Stop por pánico de no haber calculado bien o he promediado a la baja para no asumir el error, y te quedas con una sensación de impotencia tremenda.

**Lo que de verdad revolucionaría la plataforma y nos daría la vida a los que operamos en serio es un panel de trading interactivo directamente sobre el gráfico.**

Me refiero a algo parecido al TradePanel de MetaTrader o a la herramienta de posición larga/corta que tiene TradingView, pero que sea ejecutable. Es decir, que puedas activar una herramienta en la pantalla que te dibuje tres líneas:
- Una línea amarilla para el precio de entrada.
- Una línea roja para el Stop Loss.
- Y un par de líneas verdes para Take Profit 1 y Take Profit 2 (para poder programar salidas parciales, por ejemplo cerrar el 50% de la posición en el primer objetivo y dejar correr el resto).

Que tú puedas arrastrar esas líneas con el ratón sobre el gráfico para ajustarlas visualmente a los soportes y resistencias, y que en un cuadrito al lado le digas al sistema: "Quiero arriesgar el 1% de mi balance" (o una cantidad fija de USDT, como 50$). 

Al momento, sin tú tener que tocar una sola tecla ni hacer divisiones mentales, el panel debería calcularte:
- El tamaño exacto de la orden (en lotes de oro o contratos de BTC).
- El apalancamiento mínimo necesario para cubrir el margen.
- La pérdida exacta en dólares si te toca el SL.
- Y la ganancia acumulada si llega a los TP1 y TP2.

Y que con un solo botón que ponga "Lanzar Orden", se mande todo al exchange al instante (entrada, SL y salidas parciales pre-configuradas).

Esto no es solo una cuestión de comodidad; es una cuestión de salud mental y de disciplina. Si la plataforma te obliga a definir tu riesgo visualmente antes de disparar y te hace el cálculo matemático en frío, evitas entrar por impulso con lotes masivos. Eliminas el factor del pánico y los errores de digitación de números que a todos nos pasan cuando estamos estresados.

En plataformas de la competencia o de trading clásico esto se usa muchísimo porque es lo más eficiente. Si BingX metiera una herramienta así integrada directamente en su web, os ganaríais a toda la comunidad de traders independientes y de cuentas de fondeo que necesitamos llevar una gestión del riesgo a rajatabla para sobrevivir a largo plazo.

Espero que los ingenieros de producto le den una vuelta a esto. Si necesitáis que os detalle más la idea o cómo nos estructuramos estas herramientas en el día a día para no quemar las cuentas, decidme y lo comentamos.

Un saludo,
Emilio J.
