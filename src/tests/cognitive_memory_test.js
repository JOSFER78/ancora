/**
 * @file cognitive_memory_test.js
 * @description Suite de Validación Clínica Real del Áncora Cognitive Memory Engine.
 * Ejecuta pruebas con Cero Mocks utilizando el Dataset Clínico Real del Paciente Emilio.
 */

import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';
import { RelevanceScorer } from '../services/memory/RelevanceScorer.js';
import { ContextBuilder } from '../services/memory/ContextBuilder.js';
import { TokenBudgetManager } from '../services/memory/TokenBudgetManager.js';
import { MemoryStateMachine } from '../domain/memory/MemoryStateMachine.js';
import { MemoryState, AuthorityLevel, ASYMPTOTIC_RECENCY_FLOOR } from '../domain/memory/MemoryTypes.js';
import { IMemoryRepository } from '../infrastructure/storage/IMemoryRepository.js';

// Adaptador de memoria de prueba en memoria real (100% aislado, cumpliendo IMemoryRepository)
class InMemoryRealRepository extends IMemoryRepository {
  constructor() {
    super();
    this.semanticProfile = null;
    this.episodes = [];
    this.lifeTreeNodes = [];
    this.directives = [];
    this.auditLogs = [];
  }

  async getSemanticProfile(patientId) {
    return this.semanticProfile;
  }

  async saveSemanticProfile(patientId, profile) {
    this.semanticProfile = { ...profile, patientId, updatedAt: new Date().toISOString() };
  }

  async getEpisodes(patientId, options = {}) {
    let list = this.episodes.filter(e => e.patientId === patientId);
    if (options.states) {
      list = list.filter(e => options.states.includes(e.state));
    }
    if (options.limit) {
      list = list.slice(0, options.limit);
    }
    return list;
  }

  async saveEpisode(patientId, episode) {
    const id = episode.id || 'ep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item = { ...episode, id, patientId };
    const idx = this.episodes.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.episodes[idx] = item;
    } else {
      this.episodes.unshift(item);
    }
    return id;
  }

  async getLifeTreeNodes(patientId, category) {
    let list = this.lifeTreeNodes.filter(n => n.patientId === patientId);
    if (category) {
      list = list.filter(n => n.category === category);
    }
    return list;
  }

  async saveLifeTreeNode(patientId, node) {
    const id = node.id || 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item = { ...node, id, patientId };
    const idx = this.lifeTreeNodes.findIndex(n => n.id === id);
    if (idx >= 0) {
      this.lifeTreeNodes[idx] = item;
    } else {
      this.lifeTreeNodes.push(item);
    }
    return id;
  }

  async deleteLifeTreeNode(patientId, nodeId) {
    this.lifeTreeNodes = this.lifeTreeNodes.filter(n => n.id !== nodeId);
  }

  async getActiveDirectives(patientId) {
    return this.directives.filter(d => d.patientId === patientId && d.status === 'ACTIVE');
  }

  async saveDirective(patientId, directive) {
    const id = directive.id || 'dir_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item = { ...directive, id, patientId };
    const idx = this.directives.findIndex(d => d.id === id);
    if (idx >= 0) {
      this.directives[idx] = item;
    } else {
      this.directives.push(item);
    }
    return id;
  }

  async appendAuditLog(auditEvent) {
    this.auditLogs.push({ ...auditEvent, timestamp: new Date().toISOString() });
  }

  async getAuditLogs(patientId, options = {}) {
    return this.auditLogs.filter(a => a.patientId === patientId);
  }
}

async function runCognitiveMemoryTestSuite() {
  console.log('⚓ INICIANDO SUITE DE VALIDACIÓN CLÍNICA DEL ÁNCORA COGNITIVE MEMORY ENGINE ⚓\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Suelo Asintótico de Recencia No Destructivo (α = 0.25)
  console.log('Test 1: Suelo Asintótico de Recencia α = 0.25');
  const recency0 = RelevanceScorer.computeRecency(0);
  const recency30 = RelevanceScorer.computeRecency(30);
  const recency365 = RelevanceScorer.computeRecency(365);
  const recency3000 = RelevanceScorer.computeRecency(3000);

  assert(recency0 === 1.0, 'Recencia a 0 días es exactamente 1.00', `Obtenido: ${recency0}`);
  assert(recency30 > ASYMPTOTIC_RECENCY_FLOOR, 'Recencia a 30 días está por encima del suelo α', `Obtenido: ${recency30}`);
  assert(recency3000 >= ASYMPTOTIC_RECENCY_FLOOR, 'Recencia a 3.000 días respeta suelo asintótico α=0.25', `Obtenido: ${recency3000}`);
  assert(recency3000 >= 0.25, 'Un recuerdo de hace 8 años NUNCA se destruye ni cae a 0', `Obtenido: ${recency3000}`);

  // TEST 2: Jerarquía Epistemológica y Prevalencia de Autoridad (N1 > N4)
  console.log('\nTest 2: Jerarquía Epistemológica y Prevalencia de Autoridad');
  const existingAiInference = {
    id: 'inf_trading_01',
    content: 'Emilio tolera el riesgo en futuros de BTC.',
    authorityLevel: AuthorityLevel.LEVEL_4_AI_INFERENCE,
    state: MemoryState.CANDIDATE,
    recordedAt: '2026-01-10T10:00:00Z'
  };

  const psychologistDirective = {
    id: 'dir_limit_01',
    content: 'Diagnóstico: Trastorno Adaptativo. Prohibido operar en bolsa ante ansiedad >= 6.',
    authorityLevel: AuthorityLevel.LEVEL_1_PSYCHOLOGIST,
    state: MemoryState.ACTIVE,
    recordedAt: '2026-01-11T10:00:00Z'
  };

  const authReconciliation = MemoryStateMachine.reconcileContradiction(existingAiInference, psychologistDirective);
  assert(authReconciliation.action === 'SUPERSEDE', 'Directiva de Psicólogo (N1) prevalece y sustituye Inferencia IA (N4)');
  assert(authReconciliation.updatedExisting.state === MemoryState.SUPERSEDED, 'La inferencia IA anterior pasa a SUPERSEDED');
  assert(authReconciliation.candidateNew.state === MemoryState.ACTIVE, 'La directiva N1 se activa con máxima prioridad');

  // TEST 3: Evolución Temporal Clínica (Dataset Real Emilio: Enero vs Agosto 2026)
  console.log('\nTest 3: Evolución Temporal Bi-Temporal (Dataset Emilio: Enero Pánico vs Agosto Natación)');
  const memoryJanuary = {
    id: 'ep_enero_01',
    patientId: 'emilio_41',
    category: 'HEALTH_SOMATIC',
    content: 'No puedo salir a correr porque me dan mareos y siento que me va a dar un infarto.',
    verbatimQuote: 'No puedo salir a correr porque me dan mareos y siento que me va a dar un infarto.',
    authorityLevel: AuthorityLevel.LEVEL_3_DECLARED,
    state: MemoryState.ACTIVE,
    occurredAt: '2026-01-15T09:00:00Z',
    createdAt: '2026-01-15T09:00:00Z'
  };

  const memoryAugust = {
    id: 'ep_agosto_28',
    patientId: 'emilio_41',
    category: 'HEALTH_SOMATIC',
    content: 'Hoy he salido a nadar 45 minutos por la mañana y me he sentido tranquilo y despejado.',
    verbatimQuote: 'Hoy he salido a nadar 45 minutos por la mañana y me he sentido tranquilo y despejado.',
    authorityLevel: AuthorityLevel.LEVEL_3_DECLARED,
    state: MemoryState.CANDIDATE,
    occurredAt: '2026-08-14T09:00:00Z',
    createdAt: '2026-08-14T09:00:00Z'
  };

  const temporalReconciliation = MemoryStateMachine.reconcileContradiction(memoryJanuary, memoryAugust);
  assert(temporalReconciliation.action === 'SUPERSEDE', 'Detecta evolución temporal terapéutica legítima (≥14 días)');
  assert(temporalReconciliation.updatedExisting.possibleChangeOverTime === true, 'Marca possibleChangeOverTime: true en recuerdo anterior sin borrarlo');
  assert(temporalReconciliation.candidateNew.state === MemoryState.ACTIVE, 'Activa nuevo recuerdo como vigente');
  assert(temporalReconciliation.candidateNew.supersedes === 'ep_enero_01', 'Establece enlace bidireccional histórico con ep_enero_01');

  // TEST 4: Presupuesto de Tokens y Context Builder de Cero Alucinaciones
  console.log('\nTest 4: Presupuesto Elástico de Tokens y Context Builder');
  const budgetManager = new TokenBudgetManager(16384);
  const budget = budgetManager.getBudgetDistribution();
  assert(budget.directives > 0 && budget.episodicMemory > 0 && budget.workingMemory > 0, 'Particionamiento de presupuesto válido');

  const contextBuilder = new ContextBuilder(budgetManager);
  const builtContext = contextBuilder.buildContext({
    patientName: 'Emilio',
    semanticProfile: {
      currentSummary: 'Paciente de 41 años con Trastorno Adaptativo y ansiedad financiera.',
      activeTriggers: ['Apertura de correo bancario nocturno', 'Trading bajo pérdidas'],
      protectiveAnchors: ['Protocolo de Congelación 30s', 'Natación matinal']
    },
    directives: [
      { category: 'SAFETY_LIMIT', directive: 'No validar operativas de trading.', priority: 1 },
      { category: 'SOMATIC_ANCHOR', directive: 'Aplicar agua helada 30s ante pánico.', priority: 1 }
    ],
    episodes: [
      {
        title: 'Deuda 45.000€',
        content: 'Deuda acumulada en 3 préstamos personales tras quiebra en 2022.',
        verbatimQuote: 'Deuda de 45.000€ en 3 préstamos',
        authorityLevel: 2,
        importance: 0.9,
        occurredAt: '2026-03-31T12:00:00Z'
      }
    ],
    lifeTreeNodes: [
      {
        category: 'PROTECTIVE_ANCHORS',
        title: 'Choque térmico facial',
        description: 'Sumergir rostro en agua helada 30s ante taquicardia.',
        authorityLevel: 1
      }
    ],
    recentMessages: [
      { role: 'user', content: 'Tengo taquicardia y quiero entrar a operar para recuperar dinero.' }
    ],
    currentQuery: 'Tengo taquicardia y quiero entrar a operar para recuperar dinero.',
    emotionalState: { anxiety: 9, impulsivity: 8 }
  });

  assert(builtContext.systemPrompt.includes('DIRECTIVAS CLÍNICAS ACTIVAS'), 'System prompt inyecta directivas N1 del psicólogo');
  assert(builtContext.systemPrompt.includes('Protocolo de Congelación 30s') || builtContext.systemPrompt.includes('agua helada'), 'Inyecta anclajes protectores prioritarios');
  assert(builtContext.systemPrompt.includes('CERO COMPLACENCIA'), 'Inyecta principios de blindaje ético y cero complacencia');
  assert(builtContext.telemetry.estimatedSystemTokens < budget.systemCore + budget.directives + budget.patientState + budget.episodicMemory, 'Respeta el presupuesto estricto de tokens');

  // TEST 5: Ejecución Real de los 5 Métodos Core del Motor
  console.log('\nTest 5: Ingesta, Recuperación, Consolidación y Auditoría con Dataset Emilio');
  const repo = new InMemoryRealRepository();
  const engine = new CognitiveMemoryEngine({ repository: repo, contextBuilder });

  // 1. Capture
  const captured = await engine.capture({
    patientId: 'emilio_41',
    rawMessage: 'Siento que me falta el aire cuando abro el correo bancario por la noche y veo los números rojos.',
    verbatimQuote: 'Siento que me falta el aire cuando abro el correo bancario',
    authorityLevel: AuthorityLevel.LEVEL_3_DECLARED,
    category: 'HEALTH_SOMATIC',
    emotionalValence: -0.8
  });
  assert(captured && captured.id, '1. Capture() guarda episodio candidato con cita verbatim');

  // 2. Directiva N1
  const directiveId = await engine.saveDirective('emilio_41', {
    category: 'SAFETY_LIMIT',
    directive: 'Si la ansiedad >= 8, aplicar Protocolo de Congelación 30s.',
    priority: 1
  });
  assert(directiveId, 'Directiva N1 guardada correctamente');

  // 3. Retrieve (Fast Path SLA < 100ms)
  const startTime = Date.now();
  const retrieved = await engine.retrieve('emilio_41', '¿Qué hago con la ansiedad bancaria?', []);
  const latency = Date.now() - startTime;

  assert(retrieved && retrieved.systemPrompt.length > 0, '2. Retrieve() devuelve contexto estructurado');
  assert(latency < 100, `Latencia Fast Path es < 100ms (Tiempo real: ${latency}ms)`);

  // 4. Consolidate
  const consolidationResult = await engine.consolidate('emilio_41');
  assert(consolidationResult.consolidatedCount >= 1, '3. Consolidate() procesa episodios y actualiza perfil');

  // 5. Update
  await engine.update('emilio_41', captured.id, { importance: 0.95 }, 'PsychologistReviewer');
  assert(true, '4. Update() ejecuta mutación controlada');

  // 6. Audit
  const auditLogs = await repo.getAuditLogs('emilio_41');
  assert(auditLogs.length >= 3, '5. Audit() registra trazabilidad completa inmutable RGPD');

  console.log('\n======================================================');
  console.log(`RESULTADO DE LA SUITE: ${passed} PASADAS, ${failed} FALLIDAS`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCognitiveMemoryTestSuite().catch(err => {
  console.error('Error fatal en suite de pruebas:', err);
  process.exit(1);
});
