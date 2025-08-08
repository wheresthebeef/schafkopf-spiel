/**
 * Bayerisches Schafkopf - AI Testing & Validation
 * Testet das neue Q-Learning AI-System umfassend
 * Browser-basierte Tests ohne externe Dependencies
 */

import { SchafkopfQLearning, qLearningMonitor } from './q-learning.js';
import { BotManager } from './bot-manager.js';
import { SchafkopfCardMemory } from './card-memory.js';

/**
 * AI-Test-Suite
 */
export class AITestSuite {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        
        console.log('🧪 AI-Test-Suite initialisiert');
    }
    
    /**
     * Führt alle Tests aus
     */
    async runAllTests() {
        console.log('🚀 Starte umfassende AI-Tests...');
        
        // Basis-Tests
        await this.testQLearning_Initialization();
        await this.testCardMemory();
        await this.testBotManager();
        
        // Integration-Tests
        await this.testAICardSelection();
        await this.testLearningProcess();
        await this.testPersistence();
        
        // Performance-Tests
        await this.testPerformance();
        await this.testStressTest();
        
        // Spiellogik-Tests
        await this.testGameIntegration();
        
        this.printTestResults();
        
        return {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            success: this.passedTests === this.totalTests,
            results: this.testResults
        };
    }
    
    /**
     * Test-Helper: Ausführung und Protokollierung
     */
    async runTest(testName, testFunction) {
        this.totalTests++;
        
        try {
            const startTime = performance.now();
            await testFunction();
            const duration = performance.now() - startTime;
            
            this.passedTests++;
            this.testResults.push({
                name: testName,
                status: 'PASS',
                duration: Math.round(duration),
                error: null
            });
            
            console.log(`✅ ${testName} (${Math.round(duration)}ms)`);
        } catch (error) {
            this.testResults.push({
                name: testName,
                status: 'FAIL',
                duration: 0,
                error: error.message
            });
            
            console.error(`❌ ${testName}: ${error.message}`);
        }
    }
    
    /**
     * Test 1: Q-Learning Initialisierung
     */
    async testQLearning_Initialization() {
        await this.runTest('Q-Learning Initialisierung', () => {
            const ai = new SchafkopfQLearning(1, {
                learningRate: 0.1,
                explorationRate: 0.3
            });
            
            // Validierungen
            if (ai.playerId !== 1) throw new Error('Player ID falsch');
            if (ai.learningRate !== 0.1) throw new Error('Learning Rate falsch');
            if (ai.qTable.size !== 0) throw new Error('Q-Table sollte leer sein');
            if (!ai.cardMemory) throw new Error('Card Memory fehlt');
            
            console.log('  🧠 Q-Learning AI erfolgreich initialisiert');
        });
    }
    
    /**
     * Test 2: Card Memory System
     */
    async testCardMemory() {
        await this.runTest('Card Memory System', () => {
            const memory = new SchafkopfCardMemory();
            
            // Test: Karte registrieren
            const testCard = { suit: 'herz', value: 'ass' };
            memory.recordCard(testCard, 1, 0);
            
            if (!memory.hasCardBeenPlayed(testCard)) {
                throw new Error('Karte wurde nicht korrekt registriert');
            }
            
            if (memory.getCardPlayedBy(testCard) !== 1) {
                throw new Error('Spieler-Zuordnung falsch');
            }
            
            // Test: Trump-Schätzung
            const gameContext = { gameType: 'rufspiel', trumpSuit: 'herz' };
            const remainingTrumps = memory.estimateRemainingTrumps(gameContext);
            
            if (remainingTrumps !== 13) { // 14 - 1 (Herz Ass gespielt)
                throw new Error(`Trump-Schätzung falsch: ${remainingTrumps} statt 13`);
            }
            
            console.log('  🧠 Card Memory funktioniert korrekt');
        });
    }
    
    /**
     * Test 3: Bot Manager
     */
    async testBotManager() {
        await this.runTest('Bot Manager', () => {
            const botManager = new BotManager();
            
            // Test: AI initialisieren
            const ai = botManager.initializeAI(1, 'qlearning', { learningRate: 0.15 });
            
            if (!ai) throw new Error('AI-Initialisierung fehlgeschlagen');
            if (ai.learningRate !== 0.15) throw new Error('Konfiguration nicht übernommen');
            
            // Test: Mehrere AIs (aber nur für Spieler 1-3, da Spieler 0 = Mensch)
            botManager.initializeAI(2, 'qlearning');
            botManager.initializeAI(3, 'qlearning');
            
            if (botManager.aiPlayers.size !== 3) { // Nur 3 Bots (Spieler 1,2,3)
                throw new Error(`Falsche Anzahl AIs: ${botManager.aiPlayers.size}`);
            }
            
            console.log('  🤖 Bot Manager funktioniert korrekt');
        });
    }
    
    /**
     * Test 4: AI Kartenauswahl
     */
    async testAICardSelection() {
        await this.runTest('AI Kartenauswahl', () => {
            const ai = new SchafkopfQLearning(1);
            
            // Mock-Karten (korrekte Struktur)
            const playableCards = [
                { suit: 'herz', value: 'ass', points: 11, isTrump: true },
                { suit: 'gras', value: '7', points: 0, isTrump: false },
                { suit: 'eichel', value: 'ober', points: 3, isTrump: true }
            ];
            
            // Mock-Spielkontext (vollständig)
            const gameContext = {
                currentTrick: [],
                trickNumber: 0,
                players: [
                    { hand: [], totalScore: 0, isHuman: true },
                    { hand: [], totalScore: 0, isHuman: false },
                    { hand: [], totalScore: 0, isHuman: false },
                    { hand: [], totalScore: 0, isHuman: false }
                ],
                gameType: 'rufspiel',
                trumpSuit: 'herz',
                calledAce: null,
                caller: 0
            };
            
            // Test: Kartenauswahl
            const selectedCard = ai.selectCard(playableCards, gameContext);
            
            if (!selectedCard) throw new Error('Keine Karte ausgewählt');
            if (!playableCards.includes(selectedCard)) {
                throw new Error('Ungültige Karte ausgewählt');
            }
            
            console.log(`  🎯 AI wählte: ${selectedCard.suit} ${selectedCard.value}`);
        });
    }
    
    /**
     * Test 5: Learning Process
     */
    async testLearningProcess() {
        await this.runTest('Learning Process', () => {
            const ai = new SchafkopfQLearning(1, { explorationRate: 0.0 }); // Kein Zufall
            
            const gameContext = {
                currentTrick: [],
                trickNumber: 0,
                players: [
                    { hand: [], totalScore: 0, isHuman: true },
                    { hand: [], totalScore: 0, isHuman: false },
                    { hand: [], totalScore: 0, isHuman: false },
                    { hand: [], totalScore: 0, isHuman: false }
                ],
                gameType: 'rufspiel',
                trumpSuit: 'herz',
                calledAce: null,
                caller: 0
            };
            
            const state = ai.encodeGameState(gameContext);
            const action = 'herz_strong';
            
            // Initial Q-Value sollte 0 sein
            const initialQ = ai.getQValue(state, action);
            if (initialQ !== 0) throw new Error(`Initial Q-Value falsch: ${initialQ}`);
            
            // Experience hinzufügen
            ai.addExperience(state, action, 10, state, false);
            
            // Q-Value sollte sich geändert haben
            const updatedQ = ai.getQValue(state, action);
            if (updatedQ === 0) throw new Error('Q-Value wurde nicht aktualisiert');
            
            console.log(`  📚 Q-Value Update: ${initialQ} → ${updatedQ.toFixed(3)}`);
        });
    }
    
    /**
     * Test 6: Persistierung
     */
    async testPersistence() {
        await this.runTest('Persistierung', () => {
            const ai1 = new SchafkopfQLearning(99); // Unique ID für Test
            
            // Trainiere AI ein wenig
            ai1.gamesPlayed = 5;
            ai1.wins = 3;
            ai1.setQValue('test_state', 'test_action', 0.75);
            
            // Speichern
            ai1.saveToStorage();
            
            // Neue AI-Instanz laden
            const ai2 = new SchafkopfQLearning(99);
            const loaded = ai2.loadFromStorage();
            
            if (!loaded) throw new Error('Laden fehlgeschlagen');
            if (ai2.gamesPlayed !== 5) throw new Error('Games played nicht geladen');
            if (ai2.wins !== 3) throw new Error('Wins nicht geladen');
            
            const qValue = ai2.getQValue('test_state', 'test_action');
            if (Math.abs(qValue - 0.75) > 0.001) {
                throw new Error(`Q-Value nicht korrekt geladen: ${qValue}`);
            }
            
            console.log('  💾 Persistierung funktioniert korrekt');
        });
    }
    
    /**
     * Test 7: Performance
     */
    async testPerformance() {
        await this.runTest('Performance', () => {
            const ai = new SchafkopfQLearning(1);
            const iterations = 1000;
            
            // Mock-Daten (korrekte Struktur)
            const playableCards = [
                { suit: 'herz', value: 'ass', points: 11, isTrump: true },
                { suit: 'gras', value: '7', points: 0, isTrump: false }
            ];
            
            const gameContext = {
                currentTrick: [],
                trickNumber: 0,
                players: [
                    { hand: [], totalScore: 0, isHuman: true },
                    { hand: [], totalScore: 0, isHuman: false },
                    { hand: [], totalScore: 0, isHuman: false },
                    { hand: [], totalScore: 0, isHuman: false }
                ],
                gameType: 'rufspiel',
                trumpSuit: 'herz',
                calledAce: null,
                caller: 0
            };
            
            // Performance-Test
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                ai.selectCard(playableCards, gameContext);
            }
            
            const duration = performance.now() - startTime;
            const avgTime = duration / iterations;
            
            if (avgTime > 10) { // Max 10ms pro Kartenauswahl
                throw new Error(`Performance zu langsam: ${avgTime.toFixed(2)}ms pro Auswahl`);
            }
            
            console.log(`  ⚡ Performance: ${avgTime.toFixed(2)}ms pro Kartenauswahl`);
        });
    }
    
    /**
     * Test 8: Stress Test
     */
    async testStressTest() {
        await this.runTest('Stress Test', () => {
            const botManager = new BotManager();
            botManager.initializeAllBots('qlearning');
            
            // Simuliere viele Spiele
            for (let game = 0; game < 10; game++) {
                for (let trick = 0; trick < 8; trick++) {
                    // Simuliere Trick für alle Bots
                    for (let player = 1; player <= 3; player++) {
                        const playableCards = [
                            { suit: 'herz', value: 'ass', points: 11, isTrump: true },
                            { suit: 'gras', value: '7', points: 0, isTrump: false }
                        ];
                        
                        const gameContext = {
                            currentTrick: [],
                            trickNumber: trick,
                            players: [
                                { hand: [], totalScore: 0, isHuman: true },
                                { hand: [], totalScore: 0, isHuman: false },
                                { hand: [], totalScore: 0, isHuman: false },
                                { hand: [], totalScore: 0, isHuman: false }
                            ],
                            gameType: 'rufspiel',
                            trumpSuit: 'herz',
                            calledAce: null,
                            caller: 0
                        };
                        
                        const card = botManager.selectCard(player, playableCards, gameContext);
                        if (!card) throw new Error(`Bot ${player} konnte keine Karte wählen`);
                    }
                }
                
                // Simuliere Spielende
                const gameResult = {
                    winners: [1],
                    scores: [0, 50, -20, -30],
                    gameType: 'rufspiel'
                };
                
                botManager.onGameCompleted(gameResult);
            }
            
            console.log('  🔥 Stress Test erfolgreich (10 Spiele simuliert)');
        });
    }
    
    /**
     * Test 9: Spiel-Integration
     */
    async testGameIntegration() {
        await this.runTest('Spiel-Integration', () => {
            // Test ob die globalen Funktionen verfügbar sind
            if (typeof window !== 'undefined') {
                // Browser-Environment
                if (!window.aiDebug) throw new Error('aiDebug nicht global verfügbar');
                if (!window.aiStats) throw new Error('aiStats nicht global verfügbar');
            }
            
            console.log('  🎮 Spiel-Integration korrekt');
        });
    }
    
    /**
     * Druckt Test-Ergebnisse
     */
    printTestResults() {
        console.log('\n📊 AI-TEST ERGEBNISSE');
        console.log('='.repeat(50));
        console.log(`Tests gesamt: ${this.totalTests}`);
        console.log(`Tests bestanden: ${this.passedTests}`);
        console.log(`Tests fehlgeschlagen: ${this.totalTests - this.passedTests}`);
        console.log(`Erfolgsrate: ${(this.passedTests / this.totalTests * 100).toFixed(1)}%`);
        
        if (this.passedTests === this.totalTests) {
            console.log('✅ ALLE TESTS BESTANDEN!');
        } else {
            console.log('❌ EINIGE TESTS FEHLGESCHLAGEN:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
        
        console.log('='.repeat(50));
    }
    
    /**
     * Performance-Benchmark
     */
    async runPerformanceBenchmark() {
        console.log('🏎️ Performance-Benchmark startet...');
        
        const ai = new SchafkopfQLearning(1, { explorationRate: 0.5 });
        const iterations = 10000;
        
        const playableCards = [
            { suit: 'herz', value: 'ass', points: 11, isTrump: true },
            { suit: 'gras', value: '7', points: 0, isTrump: false },
            { suit: 'eichel', value: 'ober', points: 3, isTrump: true },
            { suit: 'schellen', value: '10', points: 10, isTrump: false }
        ];
        
        const gameContext = {
            currentTrick: [],
            trickNumber: 3,
            players: [
                { hand: [], totalScore: 0, isHuman: true },
                { hand: [], totalScore: 0, isHuman: false },
                { hand: [], totalScore: 0, isHuman: false },
                { hand: [], totalScore: 0, isHuman: false }
            ],
            gameType: 'rufspiel',
            trumpSuit: 'herz',
            calledAce: null,
            caller: 0
        };
        
        // Benchmark 1: Kartenauswahl
        let startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            ai.selectCard(playableCards, gameContext);
        }
        let duration = performance.now() - startTime;
        console.log(`  Kartenauswahl: ${(duration / iterations).toFixed(3)}ms/op (${iterations} ops)`);
        
        // Benchmark 2: State Encoding
        startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            ai.encodeGameState(gameContext);
        }
        duration = performance.now() - startTime;
        console.log(`  State Encoding: ${(duration / iterations).toFixed(3)}ms/op (${iterations} ops)`);
        
        // Benchmark 3: Q-Learning Updates
        startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
            ai.addExperience('test_state', 'test_action', Math.random() * 10, 'test_next', false);
        }
        duration = performance.now() - startTime;
        console.log(`  Q-Learning Update: ${(duration / iterations).toFixed(3)}ms/op (${iterations} ops)`);
        
        console.log('🏁 Performance-Benchmark abgeschlossen');
    }
}

/**
 * Schnell-Test für Entwicklung
 */
export async function quickTest() {
    console.log('⚡ Quick-Test startet...');
    
    try {
        // Basis-Funktionalität testen
        const ai = new SchafkopfQLearning(1);
        const playableCards = [
            { suit: 'herz', value: 'ass', points: 11, isTrump: true }
        ];
        const gameContext = {
            currentTrick: [],
            trickNumber: 0,
            players: [
                { hand: [], totalScore: 0, isHuman: true },
                { hand: [], totalScore: 0, isHuman: false },
                { hand: [], totalScore: 0, isHuman: false },
                { hand: [], totalScore: 0, isHuman: false }
            ],
            gameType: 'rufspiel',
            trumpSuit: 'herz',
            calledAce: null,
            caller: 0
        };
        
        const card = ai.selectCard(playableCards, gameContext);
        
        if (card) {
            console.log('✅ Quick-Test erfolgreich');
            return true;
        } else {
            console.error('❌ Quick-Test fehlgeschlagen');
            return false;
        }
    } catch (error) {
        console.error('❌ Quick-Test Fehler:', error);
        return false;
    }
}

// Browser-globale Test-Funktionen
if (typeof window !== 'undefined') {
    window.runAITests = async () => {
        const suite = new AITestSuite();
        return await suite.runAllTests();
    };
    
    window.aiQuickTest = quickTest;
    
    window.aiPerformanceBenchmark = async () => {
        const suite = new AITestSuite();
        return await suite.runPerformanceBenchmark();
    };
    
    // Auto-Test beim Laden (nur in Debug-Modus)
    if (window.location.search.includes('aitest=true')) {
        window.addEventListener('load', () => {
            setTimeout(async () => {
                console.log('🧪 Auto-Test gestartet (aitest=true Parameter erkannt)');
                await window.runAITests();
            }, 2000);
        });
    }
}