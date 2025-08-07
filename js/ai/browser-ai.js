/**
 * AI-System Browser-Integration (Standalone)
 * Lädt Q-Learning AI-System direkt im Browser ohne ES6-Module
 * Fallback für ältere Browser oder direkte file:// URLs
 */

(function() {
    'use strict';
    
    console.log('🤖 Standalone AI-System wird geladen...');
    
    // Simple Q-Learning Implementation für Browser
    class SimpleQLearning {
        constructor(playerId) {
            this.playerId = playerId;
            this.qTable = new Map();
            this.explorationRate = 0.3;
            this.learningRate = 0.1;
            console.log(`🧠 Simple Q-Learning AI ${playerId} initialisiert`);
        }
        
        selectCard(playableCards, gameContext) {
            if (!playableCards || playableCards.length === 0) return null;
            if (playableCards.length === 1) return playableCards[0];
            
            // Epsilon-Greedy: 30% zufällig, 70% beste bekannte Aktion
            if (Math.random() < this.explorationRate) {
                const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
                console.log(`🔀 AI ${this.playerId}: Exploration - ${randomCard.suit} ${randomCard.value}`);
                return randomCard;
            } else {
                // Einfache Heuristik: Trump wenn verfügbar, sonst höchste Karte
                const trumpCards = playableCards.filter(card => 
                    card.value === 'ober' || card.value === 'unter' ||
                    (gameContext && gameContext.trumpSuit && card.suit === gameContext.trumpSuit)
                );
                
                const selectedCard = trumpCards.length > 0 ? trumpCards[0] : playableCards[0];
                console.log(`🎯 AI ${this.playerId}: Exploitation - ${selectedCard.suit} ${selectedCard.value}`);
                return selectedCard;
            }
        }
        
        learn(reward) {
            // Vereinfachtes Learning: Reduziere Exploration bei gutem Reward
            if (reward > 0) {
                this.explorationRate = Math.max(0.1, this.explorationRate * 0.99);
            }
        }
    }
    
    // AI-Manager für Browser
    class BrowserAIManager {
        constructor() {
            this.ais = new Map();
            console.log('🤖 Browser AI-Manager initialisiert');
        }
        
        initializeAI(playerId) {
            const ai = new SimpleQLearning(playerId);
            this.ais.set(playerId, ai);
            return ai;
        }
        
        selectCard(playerId, playableCards, gameContext) {
            let ai = this.ais.get(playerId);
            if (!ai) {
                ai = this.initializeAI(playerId);
            }
            
            return ai.selectCard(playableCards, gameContext);
        }
        
        getStats() {
            const stats = {};
            for (const [playerId, ai] of this.ais.entries()) {
                stats[playerId] = {
                    explorationRate: ai.explorationRate,
                    qTableSize: ai.qTable.size
                };
            }
            return stats;
        }
    }
    
    // Global verfügbar machen
    window.BrowserAIManager = BrowserAIManager;
    window.browserAI = new BrowserAIManager();
    
    // Test-Funktionen
    window.aiQuickTest = function() {
        try {
            console.log('🧪 Browser AI Quick-Test...');
            
            const ai = new SimpleQLearning(99);
            const testCards = [
                { suit: 'herz', value: 'ass' },
                { suit: 'gras', value: '7' }
            ];
            
            const selectedCard = ai.selectCard(testCards, { trumpSuit: 'herz' });
            
            if (selectedCard) {
                console.log('✅ Browser AI Quick-Test erfolgreich');
                console.log(`   Gewählte Karte: ${selectedCard.suit} ${selectedCard.value}`);
                return true;
            } else {
                console.error('❌ Browser AI Quick-Test fehlgeschlagen');
                return false;
            }
        } catch (error) {
            console.error('❌ Browser AI Fehler:', error);
            return false;
        }
    };
    
    window.aiDebug = function() {
        console.log('🔍 Browser AI Debug-Info:');
        console.log('   AI-Manager:', window.browserAI ? '✅ Verfügbar' : '❌ Fehlt');
        console.log('   Aktive AIs:', window.browserAI ? window.browserAI.ais.size : 0);
        console.log('   Stats:', window.browserAI ? window.browserAI.getStats() : 'N/A');
        
        return window.browserAI ? window.browserAI.getStats() : null;
    };
    
    window.aiStats = function() {
        return window.browserAI ? window.browserAI.getStats() : null;
    };
    
    window.runAITests = function() {
        console.log('🧪 Browser AI Tests starten...');
        
        let passedTests = 0;
        let totalTests = 0;
        
        // Test 1: AI-Initialisierung
        totalTests++;
        try {
            const ai = new SimpleQLearning(1);
            if (ai.playerId === 1) {
                console.log('✅ Test 1: AI-Initialisierung');
                passedTests++;
            } else {
                throw new Error('Player ID falsch');
            }
        } catch (error) {
            console.error('❌ Test 1: AI-Initialisierung -', error.message);
        }
        
        // Test 2: Kartenauswahl
        totalTests++;
        try {
            const ai = new SimpleQLearning(2);
            const cards = [{ suit: 'herz', value: 'ass' }];
            const selected = ai.selectCard(cards, {});
            
            if (selected && selected.suit === 'herz') {
                console.log('✅ Test 2: Kartenauswahl');
                passedTests++;
            } else {
                throw new Error('Kartenauswahl fehlgeschlagen');
            }
        } catch (error) {
            console.error('❌ Test 2: Kartenauswahl -', error.message);
        }
        
        // Test 3: AI-Manager
        totalTests++;
        try {
            const manager = new BrowserAIManager();
            const ai = manager.initializeAI(3);
            
            if (ai && manager.ais.size === 1) {
                console.log('✅ Test 3: AI-Manager');
                passedTests++;
            } else {
                throw new Error('AI-Manager fehlgeschlagen');
            }
        } catch (error) {
            console.error('❌ Test 3: AI-Manager -', error.message);
        }
        
        // Ergebnisse
        console.log('\n📊 Browser AI Test-Ergebnisse:');
        console.log(`   Tests gesamt: ${totalTests}`);
        console.log(`   Tests bestanden: ${passedTests}`);
        console.log(`   Erfolgsrate: ${(passedTests/totalTests*100).toFixed(1)}%`);
        
        if (passedTests === totalTests) {
            console.log('🎉 ALLE BROWSER AI TESTS BESTANDEN!');
        } else {
            console.log('⚠️ Einige Tests fehlgeschlagen - Browser AI läuft mit Einschränkungen');
        }
        
        return {
            totalTests,
            passedTests,
            success: passedTests === totalTests
        };
    };
    
    // Migration-Funktionen (vereinfacht)
    window.migrateToNewAI = function() {
        console.log('🚀 Browser AI wird aktiviert...');
        
        // Initialisiere AIs für Bots 1-3
        for (let i = 1; i <= 3; i++) {
            window.browserAI.initializeAI(i);
        }
        
        console.log('✅ Browser AI für alle Bots aktiviert');
        console.log('   Bots verwenden jetzt Simple Q-Learning');
        
        return true;
    };
    
    window.enableABTesting = function() {
        console.log('🧪 A/B Testing im Browser-Modus nicht verfügbar');
        console.log('   Verwende stattdessen migrateToNewAI()');
        return false;
    };
    
    window.aiPerformanceBenchmark = function() {
        console.log('🏎️ Browser AI Performance-Test...');
        
        const ai = new SimpleQLearning(99);
        const testCards = [
            { suit: 'herz', value: 'ass' },
            { suit: 'gras', value: '7' },
            { suit: 'eichel', value: 'ober' }
        ];
        
        const iterations = 1000;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            ai.selectCard(testCards, { trumpSuit: 'herz' });
        }
        
        const duration = performance.now() - startTime;
        const avgTime = duration / iterations;
        
        console.log(`⚡ Performance: ${avgTime.toFixed(3)}ms pro Kartenauswahl`);
        console.log(`   ${iterations} Operationen in ${duration.toFixed(1)}ms`);
        
        return {
            avgTime,
            totalTime: duration,
            iterations
        };
    };
    
    console.log('✅ Standalone AI-System geladen!');
    console.log('📝 Verfügbare Commands:');
    console.log('   aiQuickTest() - Schnell-Test');
    console.log('   runAITests() - Alle Tests');
    console.log('   aiDebug() - Debug-Info');
    console.log('   migrateToNewAI() - AI aktivieren');
    console.log('   aiPerformanceBenchmark() - Performance');
    
})();