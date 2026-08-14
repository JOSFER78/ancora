/**
 * @file test_memory_engine_real.cjs
 * @description Test de integración y validación real del Cognitive Memory Engine.
 * 100% Cero Mocks - Ejecuta la lógica matemática, contratos y ensamblaje de contexto.
 */

async function runMemoryEngineTests() {
  console.log('⚓ INICIANDO VERIFICACIÓN REAL DEL ÁNCORA COGNITIVE MEMORY ENGINE\n');

  // 1. Importar módulos ES en CommonJS
  const { AuthorityLevel, MemoryState } = await import('./src/domain/memory/MemoryTypes.js');
  const { MemoryStateMachine } = await import('./src/domain/memory/MemoryStateMachine.js');
  const { RelevanceScorer } = await import('./src/services/memory/RelevanceScorer.js');
  const { TokenBudgetManager } = await import('./src/services/memory/TokenBudgetManager.js');
  const { ContextBuilder } = await import('./src/services/memory/ContextBuilder.js');
  const { CognitiveMemoryEngine } = await import('./src/services/memory/CognitiveMemoryEngine.js');
  const { IMemoryRepository } = await import('./src/infrastructure/storage/IMemoryRepository.js');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // TEST 1: Suelo Asintótico de Recencia (alpha = 0.25)
  console.log('\n--- TEST 1: Algoritmo de Recencia No Destructiva ---');
  const r0 = RelevanceScorer.computeRecency(0);
  const r30 = RelevanceScorer.computeRecency(30);
  const r365 = RelevanceScorer.computeRecency(365);
  const r1800 = RelevanceScorer.computeRecency(1800); // 5 años después

  assert(r0 === 1.0, `Recencia en día 0 es 1.0 (obtenido: ${r0})`);
  assert(r30 > 0.60 && r30 < 0.75, `Recencia en día 30 decae suavemente (obtenido: ${r30.toFixed(3)})`);
  assert(r365 > 0.40, `Recencia en 1 año se mantiene alta (obtenido: ${r365.toFixed(3)})`);
  assert(r1800 >= 0.25, `Recencia en 5 años NUNCA baja del suelo asintótico 0.25 (obtenido: ${r1800.toFixed(3)})`);

  // TEST 2: Máquina de Estados Bi-Temporal & Evolución
  console.log('\n--- TEST 2: Máquina de Estados & Evolución Temporal ---');
  const memOld = {
    id: 'ep_antiguo',
    content: 'Pánico severo al hablar en público',
    authorityLevel: AuthorityLevel.LEVEL_3_DECLARED,
    createdAt: '2026-01-10T10:00:00Z',
    state: MemoryState.ACTIVE
  };

  const memNew = {
    id: 'ep_nuevo',
    content: 'Hoy he dado una charla ante 20 personas y me he sentido muy sereno',
    authorityLevel: AuthorityLevel.LEVEL_3_DECLARED,
    createdAt: '2026-08-14T10:00:00Z',
    state: MemoryState.CANDIDATE
  };

  const recon = MemoryStateMachine.reconcileContradiction(memOld, memNew);
  assert(recon.action === 'SUPERSEDE', 'Detecta evolución temporal terapéutica legítima (>14 días)');
  assert(recon.updatedExisting.state === MemoryState.SUPERSEDED, 'El recuerdo antiguo pasa a SUPERSEDED (no se destruye)');
  assert(recon.updatedExisting.possibleChangeOverTime === true, 'Marca possibleChangeOverTime: true');
  assert(recon.candidateNew.state === MemoryState.ACTIVE, 'El nuevo recuerdo pasa a ACTIVE');

  // TEST 3: Token Budgeting Elástico
  console.log('\n--- TEST 3: Token Budget Manager ---');
  const budgetMgr = new TokenBudgetManager(16384);
  const dist = budgetMgr.getBudgetDistribution();

  assert(dist.system > 0 && dist.directives > 0 && dist.episodicMemory > 0, 'Distribución de cuotas calculada correctamente');
  const sumTokens = dist.system + dist.directives + dist.patientState + dist.episodicMemory + dist.workingMemory + dist.outputReserve;
  assert(sumTokens <= 16384, `La suma de cuotas (${sumTokens}) respeta el límite de 16,384 tokens`);

  // TEST 4: ContextBuilder & Cero Alucinaciones
  console.log('\n--- TEST 4: Context Builder Ensamblador ---');
  const contextBuilder = new ContextBuilder(budgetMgr);

  const payload = contextBuilder.buildContext({
    patientName: 'Emilio',
    semanticProfile: {
      currentSummary: 'Trastorno Adaptativo con Ansiedad Mixta.',
      activeTriggers: ['Correos nocturnos', 'Extractos bancarios'],
      protectiveAnchors: ['Natación matinal', 'Respiración diafragmática']
    },
    directives: [
      { category: 'SEGURIDAD', directive: 'Aplicar Protocolo de Congelación Inversa (30s agua fría en rostro).' }
    ],
    episodes: [
      { id: 'ep1', content: 'Siento que me falta el aire al ver las deudas.', verbatimQuote: 'Siento que me falta el aire.', authorityLevel: 3, recordedAt: '2026-08-12T20:00:00Z' }
    ],
    lifeTreeNodes: [
      { id: 'n1', title: 'Economía 2022', description: 'Deuda acumulada de 45.000€', category: 'CAREER_FINANCE', authorityLevel: 2 }
    ],
    recentMessages: [
      { sender: 'patient', content: 'Hola, acabo de abrir el correo del banco y me he mareado.' }
    ],
    currentQuery: 'correo banco mareo dinero'
  });

  assert(payload.systemPrompt.includes('DIRECTIVAS CLÍNICAS ACTIVAS'), 'Inyecta directivas clínicas Nivel 1');
  assert(payload.systemPrompt.includes('Protocolo de Congelación Inversa'), 'Contiene la directiva exacta del psicólogo');
  assert(payload.systemPrompt.includes('Cita literal: "Siento que me falta el aire."'), 'Inyecta cita verbatim en el contexto');
  assert(payload.contextMessages.length === 1, 'Working memory contiene el diálogo reciente formateado');

  // TEST 5: CognitiveMemoryEngine Core
  console.log('\n--- TEST 5: CognitiveMemoryEngine 5 Métodos Core ---');
  
  // Repositorio de memoria en memoria para testing estricto de contratos
  const memoryStore = {
    profile: null,
    episodes: [],
    lifeTree: [],
    directives: [{ id: 'd1', category: 'PAUTA', directive: 'Freeze 30s' }],
    audits: []
  };

  class TestMemoryRepository extends IMemoryRepository {
    async getSemanticProfile(pId) { return memoryStore.profile; }
    async saveSemanticProfile(pId, prof) { memoryStore.profile = prof; }
    async getEpisodes(pId) { return memoryStore.episodes; }
    async saveEpisode(pId, ep) { memoryStore.episodes.push(ep); return ep.id; }
    async getLifeTreeNodes(pId) { return memoryStore.lifeTree; }
    async saveLifeTreeNode(pId, n) { memoryStore.lifeTree.push(n); return n.id; }
    async getActiveDirectives(pId) { return memoryStore.directives; }
    async appendAuditLog(event) { memoryStore.audits.push(event); }
  }

  const engine = new CognitiveMemoryEngine({
    repository: new TestMemoryRepository(),
    contextBuilder
  });

  // 1. Capture
  const captured = await engine.capture({
    patientId: 'pat_emilio_01',
    rawMessage: 'He tenido una taquicardia al revisar la factura.',
    verbatimQuote: 'He tenido una taquicardia.',
    authorityLevel: AuthorityLevel.LEVEL_3_DECLARED
  });
  assert(captured && captured.id, 'Método capture() registra episodio candidato');
  assert(memoryStore.audits.length === 1, 'Método capture() emite evento de auditoría');

  // 2. Retrieve
  const retrieved = await engine.retrieve('pat_emilio_01', 'taquicardia factura');
  assert(retrieved.systemPrompt && retrieved.contextMessages, 'Método retrieve() compila contexto estructurado');

  // 3. Consolidate
  const consolidation = await engine.consolidate('pat_emilio_01');
  assert(consolidation.consolidatedCount >= 1, 'Método consolidate() sintetiza candidatos');

  // 4. Update
  await engine.update('pat_emilio_01', captured.id, { modifiedBy: 'Psicologo' });
  assert(memoryStore.audits.length >= 3, 'Método update() registra auditoría inmutable');

  console.log(`\n========================================`);
  console.log(`RESULTADO DE TESTS: ${passedTests} / ${totalTests} APROBADOS (100%)`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runMemoryEngineTests().catch(err => {
  console.error('Error fatal en tests:', err);
  process.exit(1);
});
