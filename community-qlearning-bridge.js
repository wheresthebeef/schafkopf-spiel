// Community-Q-Learning Bridge - Fixed Initialization
// Wandelt Community-Feedback in Q-Learning Belohnungen um

class CommunityQLearningBridge {
    constructor() {
        this.isActive = false;
        this.processedReviews = new Set();
        this.learningStats = {
            reviewsProcessed: 0,
            positiveSignals: 0,
            negativeSignals: 0,
            lastUpdate: null,
            positionAnalysis: {
                ausspieler: { good: 0, bad: 0 },
                zweiter: { good: 0, bad: 0 },
                dritter: { good: 0, bad: 0 },
                letzter: { good: 0, bad: 0 }
            },
            roleAnalysis: {
                Spieler: { good: 0, bad: 0 },
                Mitspieler: { good: 0, bad: 0 },
                Gegner: { good: 0, bad: 0 }
            }
        };
        
        // Q-Learning Instanzen (werden dynamisch geladen)
        this.qLearningBots = new Map();
        
        console.log('🌉 Community-Q-Learning Bridge initialisiert');
        
        // FIXED: Delayed initialization to wait for all systems
        setTimeout(() => {
            this.initializeBridge();
        }, 2000);
    }

    async initializeBridge() {
        console.log('🔄 Q-Learning Bridge: Warte auf Systeme...');
        
        // Warte auf Q-Learning System
        const qLearningFound = await this.waitForQLearning();
        
        if (qLearningFound) {
            // Starte Review-Processing
            this.startReviewProcessing();
            console.log('✅ Bridge aktiv - Community-Reviews werden zu KI-Lernsignalen');
        } else {
            console.log('📝 Bridge im Fallback-Modus - Community-Reviews werden protokolliert');
            this.startFallbackMode();
        }
    }

    async waitForQLearning() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // Reduziert von 30
            
            const checkSystem = () => {
                // Prüfe verschiedene Q-Learning Quellen
                const qLearningAvailable = this.findQLearningSystem();
                
                if (qLearningAvailable) {
                    console.log('🧠 Q-Learning System gefunden');
                    this.initializeQLearningBots();
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`⏳ Q-Learning suchen... (${attempts}/${maxAttempts})`);
                    setTimeout(checkSystem, 500);
                } else {
                    console.log('⚠️ Q-Learning System nicht gefunden - Bridge im Fallback-Modus');
                    resolve(false);
                }
            };
            checkSystem();
        });
    }

    findQLearningSystem() {
        // FIXED: Verbesserte Erkennung von Q-Learning Systemen
        
        // 1. Direkter Check auf SchafkopfQLearning
        if (window.SchafkopfQLearning) {
            console.log('🎯 SchafkopfQLearning Klasse gefunden');
            return true;
        }
        
        // 2. Check auf Game State mit Q-Learning Bots
        if (window.gameState && window.gameState.players) {
            const hasQLearningBots = window.gameState.players.some(player => 
                player.ai && (player.ai.type === 'qlearning' || player.ai.qlearning)
            );
            if (hasQLearningBots) {
                console.log('🎯 Q-Learning Bots in Game State gefunden');
                return true;
            }
        }
        
        // 3. Check auf existierende Q-Learning Instanzen
        if (window.qLearningInstances || window.aiPlayers) {
            console.log('🎯 Q-Learning Instanzen gefunden');
            return true;
        }
        
        // 4. Check auf Training System mit Q-Learning Support
        if (window.postGameTraining && window.postGameTraining.hasQLearningSupport) {
            console.log('🎯 Q-Learning Support im Training System gefunden');
            return true;
        }
        
        return false;
    }

    initializeQLearningBots() {
        // FIXED: Flexiblere Bot-Initialisierung
        const botNames = ['Anna', 'Hans', 'Sepp'];
        
        botNames.forEach((name, index) => {
            const playerId = index + 1; // Player 0 ist Mensch
            
            // Versuche verschiedene Q-Learning Implementierungen
            if (this.createQLearningBot(name, playerId)) {
                console.log(`🤖 Q-Learning Bot ${name} (Player ${playerId}) initialisiert`);
            } else {
                // Fallback: Erstelle einfachen Mock-Bot für Statistiken
                this.qLearningBots.set(name, this.createMockBot(name, playerId));
                console.log(`📝 Mock-Bot ${name} für Statistiken erstellt`);
            }
        });
        
        this.isActive = this.qLearningBots.size > 0;
    }

    createQLearningBot(name, playerId) {
        try {
            if (window.SchafkopfQLearning) {
                const bot = new window.SchafkopfQLearning(playerId, {
                    learningRate: 0.15,
                    explorationRate: 0.2,
                    discountFactor: 0.9
                });
                
                // Versuche gespeicherte Daten zu laden
                if (bot.loadFromStorage) {
                    bot.loadFromStorage();
                }
                
                this.qLearningBots.set(name, bot);
                return true;
            }
            
            // Alternative Q-Learning Implementierung suchen
            if (window.createAIPlayer && window.createAIPlayer.qlearning) {
                const bot = window.createAIPlayer.qlearning(playerId);
                this.qLearningBots.set(name, bot);
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn(`⚠️ Fehler beim Erstellen von Q-Learning Bot ${name}:`, error);
            return false;
        }
    }

    createMockBot(name, playerId) {
        // Einfacher Mock-Bot für Statistiken auch ohne echtes Q-Learning
        return {
            playerId,
            name,
            stats: { experiences: 0, rewards: 0, penalties: 0 },
            addExperience: function(state, action, reward, nextState, done) {
                this.stats.experiences++;
                if (reward > 0) this.stats.rewards++;
                if (reward < 0) this.stats.penalties++;
            },
            getStats: function() { return this.stats; },
            saveToStorage: function() {
                localStorage.setItem(`mock_qlearning_${name}`, JSON.stringify(this.stats));
            },
            loadFromStorage: function() {
                const saved = localStorage.getItem(`mock_qlearning_${name}`);
                if (saved) this.stats = JSON.parse(saved);
            },
            reset: function() {
                this.stats = { experiences: 0, rewards: 0, penalties: 0 };
            }
        };
    }

    startFallbackMode() {
        // FIXED: Fallback-Modus für bessere Kompatibilität
        this.isActive = true; // Aktiviere Bridge auch ohne echtes Q-Learning
        console.log('📝 Fallback-Modus: Reviews werden protokolliert und für späteren Q-Learning Export gespeichert');
        
        // Erstelle Mock-Bots für Statistiken
        ['Anna', 'Hans', 'Sepp'].forEach((name, index) => {
            this.qLearningBots.set(name, this.createMockBot(name, index + 1));
        });
        
        this.startReviewProcessing();
    }

    startReviewProcessing() {
        // Verarbeite Reviews alle 10 Sekunden
        setInterval(() => {
            this.processNewReviews();
        }, 10000);
        
        // Sofortige erste Verarbeitung
        setTimeout(() => {
            this.processNewReviews();
        }, 2000);
    }

    async processNewReviews() {
        if (!this.isActive) return;
        
        try {
            // Hole neue Reviews aus der Community-Datenbank
            const reviews = await this.getCommunityReviews();
            
            if (!reviews || reviews.length === 0) return;
            
            let newReviewsCount = 0;
            
            for (const review of reviews) {
                const reviewId = review.id || review.communityId || `${review.botName}_${review.timestamp}`;
                
                if (!this.processedReviews.has(reviewId)) {
                    await this.processEnhancedReview(review);
                    this.processedReviews.add(reviewId);
                    newReviewsCount++;
                }
            }
            
            if (newReviewsCount > 0) {
                console.log(`🎓 ${newReviewsCount} neue Reviews zu Q-Learning Signalen verarbeitet`);
                this.saveLearningProgress();
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Review-Processing:', error);
        }
    }

    async getCommunityReviews() {
        // FIXED: Robustere Review-Sammlung
        try {
            // 1. Aus Community Database System
            if (window.communityDB && window.communityDB.isEnabled && window.communityDB.githubDB) {
                try {
                    const stats = await window.communityDB.githubDB.getFile('training-data/reviews.json');
                    if (stats && stats.content && stats.content.reviews) {
                        return stats.content.reviews;
                    }
                } catch (error) {
                    console.log('⚠️ Konnte GitHub Reviews nicht laden:', error.message);
                }
            }
            
            // 2. Aus lokalem Storage (Fallback)
            const localReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
            if (localReviews.length > 0) {
                console.log(`📱 ${localReviews.length} lokale Reviews gefunden`);
                return localReviews;
            }
            
            return [];
            
        } catch (error) {
            console.warn('⚠️ Konnte keine Reviews laden:', error);
            return [];
        }
    }

    async processEnhancedReview(review) {
        if (!review.botName || !review.rating) return;
        
        const bot = this.qLearningBots.get(review.botName);
        if (!bot) {
            console.log(`ℹ️ Bot ${review.botName} nicht gefunden für Review-Processing`);
            return;
        }
        
        // ERWEITERTE Review-Verarbeitung mit gameContext
        const gameContext = review.gameContext || {};
        const reward = this.calculateEnhancedReward(review, gameContext);
        const gameState = this.reconstructEnhancedGameState(review, gameContext);
        const action = this.encodeEnhancedAction(review, gameContext);
        
        // Erstelle Q-Learning Experience mit erweiterten Daten
        const experience = {
            state: gameState,
            action: action,
            reward: reward,
            nextState: null, // Nicht verfügbar aus Review
            done: false,
            source: 'community_review_enhanced',
            reviewId: review.id || review.communityId,
            timestamp: new Date(review.timestamp).getTime(),
            
            // NEU: Strategische Meta-Daten
            strategicContext: {
                stichPosition: gameContext.stichPosition || 'unknown',
                playerRole: gameContext.playerRole || 'Gegner',
                gameType: gameContext.gameType || 'rufspiel',
                stichNumber: gameContext.stichNumber || 1
            }
        };
        
        // Füge Experience zum Bot hinzu
        if (bot.addExperience) {
            bot.addExperience(
                experience.state,
                experience.action,
                experience.reward,
                experience.nextState,
                experience.done
            );
        }
        
        // Update erweiterte Statistiken
        this.updateEnhancedLearningStats(review, gameContext, reward);
        
        console.log(`🧠 ${review.botName}: Review "${review.rating}" (${gameContext.stichPosition || 'unknown'}, ${gameContext.playerRole || 'unknown'}) → Reward ${reward}`);
    }

    calculateEnhancedReward(review, gameContext) {
        let baseReward = 0;
        
        // Grundbelohnung basierend auf Rating
        switch (review.rating) {
            case 'good':
                baseReward = 10;
                this.learningStats.positiveSignals++;
                break;
            case 'bad':
                baseReward = -10;
                this.learningStats.negativeSignals++;
                break;
            default:
                baseReward = 0;
        }
        
        // NEU: Position-basierte Reward-Modifikation
        const positionMultiplier = this.getPositionMultiplier(gameContext.stichPosition);
        baseReward *= positionMultiplier;
        
        // NEU: Rollen-basierte Reward-Modifikation
        const roleMultiplier = this.getRoleMultiplier(gameContext.playerRole);
        baseReward *= roleMultiplier;
        
        // Bonus für detailliertes Reasoning
        if (review.reasoning && review.reasoning.length > 20) {
            baseReward += review.rating === 'good' ? 3 : -3;
        }
        
        // Kontext-Bonus: Schwierige Situationen sind wertvoller
        const contextBonus = this.calculateEnhancedContextBonus(review, gameContext);
        
        return Math.round(baseReward + contextBonus);
    }

    // NEU: Position-basierte Reward-Multiplikatoren
    getPositionMultiplier(stichPosition) {
        const multipliers = {
            'ausspieler': 1.2,  // Ausspielen ist schwieriger (blind)
            'zweiter': 1.0,     // Standard
            'dritter': 1.1,     // Taktische Position
            'letzter': 0.9      // Einfacher (alle Karten sichtbar)
        };
        
        return multipliers[stichPosition] || 1.0;
    }

    // NEU: Rollen-basierte Reward-Multiplikatoren
    getRoleMultiplier(playerRole) {
        const multipliers = {
            'Spieler': 1.3,     // Spieler-Entscheidungen sind kritischer
            'Mitspieler': 1.2,  // Partner-Koordination wichtig
            'Gegner': 1.0       // Standard
        };
        
        return multipliers[playerRole] || 1.0;
    }

    calculateEnhancedContextBonus(review, gameContext) {
        let bonus = 0;
        
        // Späte Stiche sind wichtiger
        const stichNumber = gameContext.stichNumber || 1;
        if (stichNumber >= 6) {
            bonus += 3; // Endspiel-Bonus
        } else if (stichNumber >= 4) {
            bonus += 1; // Mittelspiel-Bonus
        }
        
        // Komplexe Spielsituationen
        if (gameContext.gameType && gameContext.gameType !== 'rufspiel') {
            bonus += 2; // Solo, Wenz, etc.
        }
        
        // Trumpf-Entscheidungen sind kritisch
        if (review.cardPlayed && this.isTrumpCard(review.cardPlayed)) {
            bonus += 2;
        }
        
        return bonus;
    }

    // NEU: Prüft ob Karte ein Trumpf ist
    isTrumpCard(cardString) {
        // Vereinfachte Trump-Erkennung
        return cardString.includes('♥️') || 
               cardString.includes('O') || 
               cardString.includes('U');
    }

    reconstructEnhancedGameState(review, gameContext) {
        // Erweiterte Game State Rekonstruktion
        const state = {
            // Basis-Daten
            stichNumber: gameContext.stichNumber || 1,
            gameType: gameContext.gameType || 'rufspiel',
            trumpSuit: gameContext.trumpSuit || 'herz',
            calledAce: gameContext.calledAce || null,
            
            // NEU: Strategische Position
            stichPosition: gameContext.stichPosition || 'unknown',
            playerRole: gameContext.playerRole || 'Gegner',
            
            // Karten-Information
            cardPlayed: review.cardPlayed || '',
            playerSession: review.playerSession || 'unknown',
            
            // NEU: Kontext-Hash für bessere State-Differenzierung
            contextHash: this.generateContextHash(gameContext)
        };
        
        return JSON.stringify(state);
    }

    // NEU: Generiert Hash für bessere State-Unterscheidung
    generateContextHash(gameContext) {
        const contextString = `${gameContext.stichPosition}_${gameContext.playerRole}_${gameContext.stichNumber}_${gameContext.gameType}`;
        return this.simpleHash(contextString);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    encodeEnhancedAction(review, gameContext) {
        // Erweiterte Action-Kodierung mit strategischen Informationen
        if (!review.cardPlayed) return 'unknown_action';
        
        const card = this.parseCard(review.cardPlayed);
        const strength = this.getCardStrength(card);
        const position = gameContext.stichPosition || 'unknown';
        const role = gameContext.playerRole || 'unknown';
        
        // Erweiterte Action-Kodierung: position_role_suit_strength
        return `${position}_${role}_${card.suit}_${strength}`;
    }

    parseCard(cardString) {
        // Parse Karte aus String (z.B. "♥️A" → {suit: "herz", value: "ass"})
        const suitMap = {
            '♥️': 'herz', '♦️': 'karo', '♣️': 'kreuz', '♠️': 'pik',
            '♥': 'herz', '♦': 'karo', '♣': 'kreuz', '♠': 'pik'
        };
        
        const valueMap = {
            'A': 'ass', 'K': 'könig', 'Q': 'dame', 'J': 'bube',
            'O': 'ober', 'U': 'unter', '10': '10', '9': '9', '8': '8', '7': '7'
        };
        
        // Extrahiere Farbe und Wert
        let suit = 'unknown';
        let value = 'unknown';
        
        for (const [symbol, suitName] of Object.entries(suitMap)) {
            if (cardString.includes(symbol)) {
                suit = suitName;
                break;
            }
        }
        
        for (const [symbol, valueName] of Object.entries(valueMap)) {
            if (cardString.includes(symbol)) {
                value = valueName;
                break;
            }
        }
        
        return { suit, value };
    }

    getCardStrength(card) {
        // Kartenstärke: schwach, mittel, stark
        const strongCards = ['ass', 'ober', '10'];
        const mediumCards = ['könig', 'unter', '9'];
        
        if (strongCards.includes(card.value)) return 'strong';
        if (mediumCards.includes(card.value)) return 'medium';
        return 'weak';
    }

    updateEnhancedLearningStats(review, gameContext, reward) {
        this.learningStats.reviewsProcessed++;
        this.learningStats.lastUpdate = new Date().toISOString();
        
        // NEU: Position-basierte Statistiken
        const position = gameContext.stichPosition;
        if (position && this.learningStats.positionAnalysis[position]) {
            this.learningStats.positionAnalysis[position][review.rating]++;
        }
        
        // NEU: Rollen-basierte Statistiken
        const role = gameContext.playerRole;
        if (role && this.learningStats.roleAnalysis[role]) {
            this.learningStats.roleAnalysis[role][review.rating]++;
        }
        
        // Speichere Stats periodisch
        if (this.learningStats.reviewsProcessed % 10 === 0) {
            this.saveLearningProgress();
        }
    }

    saveLearningProgress() {
        // Speichere erweiterten Lernfortschritt
        localStorage.setItem('qlearning_bridge_stats', JSON.stringify(this.learningStats));
        
        // Speichere alle Q-Learning Bots
        for (const [name, bot] of this.qLearningBots.entries()) {
            if (bot.saveToStorage) {
                bot.saveToStorage();
            }
        }
        
        console.log(`💾 Q-Learning Fortschritt gespeichert: ${this.learningStats.reviewsProcessed} Reviews verarbeitet`);
    }

    loadLearningProgress() {
        const saved = localStorage.getItem('qlearning_bridge_stats');
        if (saved) {
            try {
                this.learningStats = { ...this.learningStats, ...JSON.parse(saved) };
                console.log(`📂 Lernfortschritt geladen: ${this.learningStats.reviewsProcessed} Reviews`);
            } catch (error) {
                console.warn('⚠️ Konnte Lernfortschritt nicht laden:', error);
            }
        }
    }

    // Public API für Dashboard Integration
    getLearningStats() {
        const botStats = {};
        
        for (const [name, bot] of this.qLearningBots.entries()) {
            if (bot.getStats) {
                botStats[name] = bot.getStats();
            }
        }
        
        return {
            bridge: this.learningStats,
            bots: botStats,
            isActive: this.isActive,
            processedReviews: this.processedReviews.size
        };
    }

    // Manueller Review-Import für Testing
    async importReviewsManually() {
        console.log('🔄 Manueller Review-Import gestartet...');
        await this.processNewReviews();
    }

    // Reset für Debugging
    resetLearning() {
        this.processedReviews.clear();
        this.learningStats = {
            reviewsProcessed: 0,
            positiveSignals: 0,
            negativeSignals: 0,
            lastUpdate: null,
            positionAnalysis: {
                ausspieler: { good: 0, bad: 0 },
                zweiter: { good: 0, bad: 0 },
                dritter: { good: 0, bad: 0 },
                letzter: { good: 0, bad: 0 }
            },
            roleAnalysis: {
                Spieler: { good: 0, bad: 0 },
                Mitspieler: { good: 0, bad: 0 },
                Gegner: { good: 0, bad: 0 }
            }
        };
        
        for (const [name, bot] of this.qLearningBots.entries()) {
            if (bot.reset) {
                bot.reset();
            }
        }
        
        localStorage.removeItem('qlearning_bridge_stats');
        console.log('🔄 Q-Learning System zurückgesetzt');
    }
}

// FIXED: Wait for DOM before initializing
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Globale Bridge-Instanz
        if (!window.qLearningBridge) {
            window.qLearningBridge = new CommunityQLearningBridge();
        }
    }, 1000);
});

// Integration mit bestehendem Training-System
setTimeout(() => {
    if (window.submitSecureTrainingReview) {
        const originalSubmit = window.submitSecureTrainingReview;
        window.submitSecureTrainingReview = function(reviewData) {
            // Originale Funktion aufrufen
            originalSubmit(reviewData);
            
            // Bridge über neues Review informieren
            setTimeout(() => {
                if (window.qLearningBridge) {
                    window.qLearningBridge.processNewReviews();
                }
            }, 1000);
        };
    }
}, 3000);

// Global verfügbare Funktionen
window.getQLearningStats = function() {
    return window.qLearningBridge ? window.qLearningBridge.getLearningStats() : { bridge: { reviewsProcessed: 0, positiveSignals: 0, negativeSignals: 0 }, bots: {}, isActive: false };
};

window.importReviewsToQLearning = function() {
    if (window.qLearningBridge) {
        window.qLearningBridge.importReviewsManually();
    }
};

window.resetQLearning = function() {
    if (window.qLearningBridge) {
        window.qLearningBridge.resetLearning();
    }
};

console.log('🌉 Enhanced Community-Q-Learning Bridge geladen - Fixed Version');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunityQLearningBridge;
}
