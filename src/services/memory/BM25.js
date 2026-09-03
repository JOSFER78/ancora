/**
 * @file BM25.js
 * @description Recuperación léxica BM25 sobre la memoria del paciente.
 *
 * POR QUÉ BM25 Y NO VECTORES
 * --------------------------
 * La búsqueda densa está descartada: los veinte modelos de embeddings del
 * router no responden, Cohere y Voyage prohíben el uso desde el navegador, y la
 * capa gratuita de Gemini admite revisión humana del contenido, lo que la
 * inhabilita para datos del artículo 9 del RGPD (D-07 de la Biblia).
 *
 * BM25 no es el premio de consolación que parece. En MS MARCO, BM25 solo da
 * 0.184 de MRR@10 frente a 0.33-0.36 de la búsqueda densa, pero con expansión
 * de documentos (doc2query) sube a 0.272: cierra alrededor de la mitad del
 * hueco, sin enviar una sola frase del paciente a un proveedor de embeddings.
 *
 * POR QUÉ NO JACCARD, QUE ES LO QUE HABÍA
 * ---------------------------------------
 * Jaccard trata todas las palabras igual. En un expediente clínico eso es
 * fatal: «que», «para» y «cuando» aparecen en todos los recuerdos, mientras que
 * «hermana» o «insomnio» aparecen en dos — y son justo las que dicen de qué se
 * está hablando. BM25 corrige las dos cosas que Jaccard ignora:
 *
 *   · **IDF**: una palabra que sale en todos los recuerdos no distingue nada,
 *     así que pesa poco. Una rara pesa mucho.
 *   · **Saturación**: que «ansiedad» salga ocho veces no hace el recuerdo cuatro
 *     veces más relevante que si sale dos. La tercera aportación ya suma poco.
 *   · **Longitud**: un recuerdo largo tiene más probabilidad de contener
 *     cualquier palabra por puro azar; se compensa.
 */

/** Saturación de frecuencia. 1.2 es el valor estándar de la literatura. */
const K1 = 1.2;
/** Cuánto se penaliza la longitud. 0.75, también el estándar. */
const B = 0.75;

/**
 * Palabras vacías del castellano.
 *
 * Se quedan fuera del índice porque no distinguen un recuerdo de otro. La lista
 * es corta a propósito: con IDF, una palabra frecuente ya pesa poco sola, así
 * que quitar de más solo serviría para perder matices.
 */
const VACIAS = new Set([
  'a', 'al', 'algo', 'ante', 'antes', 'aquel', 'aquella', 'aqui', 'asi', 'aun',
  'bien', 'cada', 'como', 'con', 'contra', 'cual', 'cuando', 'de', 'del',
  'desde', 'donde', 'dos', 'el', 'ella', 'ellos', 'en', 'entre', 'era', 'eres',
  'es', 'esa', 'ese', 'eso', 'esta', 'estan', 'este', 'esto', 'estoy', 'fue',
  'ha', 'hace', 'han', 'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los',
  'mas', 'me', 'mi', 'mientras', 'mucho', 'muy', 'ni', 'no', 'nos', 'o', 'para',
  'pero', 'poco', 'por', 'porque', 'que', 'se', 'ser', 'si', 'sin', 'sobre',
  'solo', 'son', 'su', 'sus', 'tan', 'te', 'tiene', 'todo', 'tu', 'un', 'una',
  'uno', 'unos', 'y', 'ya', 'yo'
]);

/**
 * Trocea y normaliza un texto.
 *
 * Quita tildes: quien escribe deprisa en un chat pone «ansiedad» tanto como
 * «ansiédad», y «depresion» tanto como «depresión». Sin normalizar, cada
 * variante sería una palabra distinta y el recuerdo no se encontraría.
 */
export function tokenizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !VACIAS.has(t))
    .map(recortarSufijo);
}

/**
 * Recorte de sufijos, mínimo y sin diccionario.
 *
 * No es un lematizador: es lo justo para que «pesadillas» encuentre «pesadilla»
 * y «llorando» encuentre «llorar». Se aplica solo a palabras largas, donde
 * equivocarse cuesta poco; con las cortas el riesgo de juntar cosas distintas
 * es mayor que la ganancia.
 */
function recortarSufijo(palabra) {
  if (palabra.length <= 5) return palabra;
  for (const sufijo of ['ando', 'iendo', 'aciones', 'acion', 'mente', 'idades', 'idad', 'es', 's']) {
    if (palabra.endsWith(sufijo) && palabra.length - sufijo.length >= 4) {
      return palabra.slice(0, -sufijo.length);
    }
  }
  return palabra;
}

/**
 * Índice BM25 sobre una colección de recuerdos.
 *
 * Se construye en memoria y en el navegador: son decenas o cientos de
 * documentos cortos, no millones. No hay servidor de búsqueda ni hace falta.
 */
export class BM25Index {
  /**
   * @param {Array<Object>} documentos
   * @param {Function} extraerTexto  Cómo sacar el texto de cada documento.
   */
  constructor(documentos = [], extraerTexto = d => d?.content || '') {
    this.documentos = documentos;
    this.tokensPorDoc = documentos.map(d => tokenizar(extraerTexto(d)));
    this.longitudes = this.tokensPorDoc.map(t => t.length);
    this.longitudMedia =
      this.longitudes.reduce((a, b) => a + b, 0) / (this.longitudes.length || 1);

    // Frecuencia por documento y número de documentos que contienen cada término.
    this.frecuencias = this.tokensPorDoc.map(tokens => {
      const mapa = new Map();
      for (const t of tokens) mapa.set(t, (mapa.get(t) || 0) + 1);
      return mapa;
    });

    this.docsPorTermino = new Map();
    for (const mapa of this.frecuencias) {
      for (const termino of mapa.keys()) {
        this.docsPorTermino.set(termino, (this.docsPorTermino.get(termino) || 0) + 1);
      }
    }
  }

  /**
   * IDF con suavizado: nunca negativo.
   *
   * La fórmula clásica de BM25 da valores negativos para términos que están en
   * más de la mitad de los documentos, lo que restaría puntuación por acertar.
   * Con el suavizado, una palabra omnipresente simplemente no aporta.
   */
  idf(termino) {
    const N = this.documentos.length;
    const n = this.docsPorTermino.get(termino) || 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }

  /** Puntuación BM25 de un documento frente a una consulta ya troceada. */
  puntuar(indiceDoc, tokensConsulta) {
    const frecuencias = this.frecuencias[indiceDoc];
    const longitud = this.longitudes[indiceDoc] || 1;
    let total = 0;

    for (const termino of tokensConsulta) {
      const f = frecuencias.get(termino);
      if (!f) continue;
      const numerador = f * (K1 + 1);
      const denominador = f + K1 * (1 - B + B * (longitud / (this.longitudMedia || 1)));
      total += this.idf(termino) * (numerador / denominador);
    }
    return total;
  }

  /**
   * Busca y devuelve los documentos ordenados, con su puntuación normalizada
   * entre 0 y 1 para poder combinarla con los otros factores del scorer.
   *
   * @param {string} consulta
   * @param {Object} [opciones]
   * @param {number} [opciones.limite]
   * @param {string[]} [opciones.expansiones]  Términos añadidos a la consulta.
   */
  buscar(consulta, { limite = 10, expansiones = [] } = {}) {
    const tokens = [...tokenizar(consulta), ...expansiones.flatMap(tokenizar)];
    if (!tokens.length || !this.documentos.length) return [];

    const bruto = this.documentos.map((doc, i) => ({
      doc,
      indice: i,
      puntuacion: this.puntuar(i, tokens)
    }));

    const maximo = Math.max(...bruto.map(r => r.puntuacion), 0);
    return bruto
      .filter(r => r.puntuacion > 0)
      .map(r => ({ ...r, similitud: maximo > 0 ? r.puntuacion / maximo : 0 }))
      .sort((a, b) => b.puntuacion - a.puntuacion)
      .slice(0, limite);
  }

  /**
   * Similitud de un texto suelto con la consulta, en el rango 0-1.
   * Es el reemplazo directo de `computeSemanticSimilarity`.
   */
  similitud(consulta, indiceDoc) {
    const tokens = tokenizar(consulta);
    if (!tokens.length) return 0;
    const puntuacion = this.puntuar(indiceDoc, tokens);
    // La saturación de BM25 hace que en la práctica una coincidencia buena
    // ronde 3-6 con documentos cortos; se acota ahí para tener un 0-1 estable.
    return Math.min(1, puntuacion / 6);
  }
}

/**
 * Construye el índice y busca en una sola llamada, para quien no necesite
 * conservar el índice entre consultas.
 */
export function buscarEnMemorias(memorias, consulta, opciones = {}) {
  const indice = new BM25Index(
    memorias,
    m => `${m.title || ''} ${m.content || ''} ${m.description || ''} ${m.verbatimQuote || m.verbatim_quote || ''}`
  );
  return indice.buscar(consulta, opciones);
}
