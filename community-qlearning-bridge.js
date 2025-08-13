// Community-Q-Learning Bridge - Verbindet Reviews mit KI-Learning
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
        this.initializeBridge();
    }

    async initializeBridge() {
        // Warte auf Q-Learning System
        await this.waitForQLearning();
        
        // Starte Review-Processing
        this.startReviewProcessing();
        
        console.log('✅ Bridge aktiv - Community-Reviews werden zu KI-Lernsignalen');
    }

    async waitForQLearning() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30;
            
            const checkSystem = () => {
                // Prüfe ob Q-Learning verfügbar ist
                if (window.SchafkopfQLearning || this.findQLearningBots()) {
                    console.log('🧠 Q-Learning System gefunden');
                    this.initializeQLearningBots();
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkSystem, 500);
                } else {
                    console.warn('⚠️ Q-Learning System nicht gefunden - Bridge im Fallback-Modus');
                    resolve(false);
                }
            };
            checkSystem();
        });
    }

    findQLearningBots() {
        // Suche nach existierenden Q-Learning Instanzen
        if (window.gameState && window.gameState.players) {
            return window.gameState.players.some(player => 
                player.ai && player.ai.type === 'qlearning'
            );
        }
        return false;
    }

    initializeQLearningBots() {
        // Initialisiere Q-Learning für alle Bot-Spieler
        const botNames = ['Anna', 'Hans', 'Sepp'];
        
        botNames.forEach((name, index) => {
            const playerId = index + 1; // Player 0 ist Mensch
            
            if (window.SchafkopfQLearning) {
                const bot = new window.SchafkopfQLearning(playerId, {
                    learningRate: 0.15,
                    explorationRate: 0.2,
                    discountFactor: 0.9
                });
                
                // Versuche gespeicherte Daten zu laden
                bot.loadFromStorage();
                
                this.qLearningBots.set(name, bot);
                console.log(`🤖 Q-Learning Bot ${name} (Player ${playerId}) initialisiert`);
            }
        });
        
        this.isActive = this.qLearningBots.size > 0;
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
                const reviewId = review.id || review.communityId;
                
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
        // Versuche Reviews aus verschiedenen Quellen zu holen
        try {
            // 1. Aus Community Database System
            if (window.communityDB && window.communityDB.isEnabled) {
                const stats = await window.communityDB.githubDB.getFile('training-data/reviews.json');
                return stats.content.reviews || [];
            }
            
            // 2. Aus lokalem Storage (Fallback)
            const localReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
            return localReviews;
            
        } catch (error) {
            console.warn('⚠️ Konnte keine Community-Reviews laden:', error);
            return [];
        }
    }

    async processEnhancedReview(review) {
        if (!review.botName || !review.rating) return;
        
        const bot = this.qLearningBots.get(review.botName);
        if (!bot) {
            console.warn(`⚠️ Bot ${review.botName} nicht gefunden für Review-Processing`);
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
        bot.addExperience(
            experience.state,
            experience.action,
            experience.reward,
            experience.nextState,
            experience.done
        );
        
        // Update erweiterte Statistiken
        this.updateEnhancedLearningStats(review, gameContext, reward);
        
        console.log(`🧠 ${review.botName}: Review "${review.rating}" (${gameContext.stichPosition}, ${gameContext.playerRole}) → Reward ${reward} → Q-Learning Update`);
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
        
        // Spezielle Rollen-Kontext-Boni
        if (gameContext.playerRole === 'Spieler' && stichNumber <= 2) {
            bonus += 1; // Frühe Spieler-Entscheidungen wichtig
        }
        
        if (gameContext.playerRole === 'Mitspieler' && this.isCalledSuit(review.cardPlayed, gameContext)) {
            bonus += 2; // Mitspieler spielt gerufene Farbe
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

    // NEU: Prüft ob Karte zur gerufenen Farbe gehört
    isCalledSuit(cardString, gameContext) {
        if (!gameContext.calledAce) return false;
        
        const suitMap = {
            'eichel': ['♣️', 'E'],
            'gras': ['♠️', 'G'], 
            'schellen': ['♦️', 'S']
        };
        
        const calledSuitSymbols = suitMap[gameContext.calledAce] || [];
        return calledSuitSymbols.some(symbol => cardString.includes(symbol));
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
            bot.saveToStorage();
        }
        
        console.log(`💾 Q-Learning Fortschritt gespeichert: ${this.learningStats.reviewsProcessed} Reviews verarbeitet`);
        
        // NEU: Erweiterte Statistik-Ausgabe
        if (this.learningStats.reviewsProcessed % 50 === 0) {
            this.logEnhancedStats();
        }
    }

    // NEU: Detaillierte Statistik-Ausgabe
    logEnhancedStats() {
        console.log('📊 Erweiterte Q-Learning Statistiken:');
        console.log('Position-Analyse:', this.learningStats.positionAnalysis);
        console.log('Rollen-Analyse:', this.learningStats.roleAnalysis);
        
        // Berechne Position-Performance
        Object.entries(this.learningStats.positionAnalysis).forEach(([position, stats]) => {
            const total = stats.good + stats.bad;
            if (total > 0) {
                const successRate = (stats.good / total * 100).toFixed(1);
                console.log(`${position}: ${successRate}% positive (${total} Reviews)`);
            }
        });
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

    // Public API für Dashboard Integration (ERWEITERT)
    getLearningStats() {
        const botStats = {};
        
        for (const [name, bot] of this.qLearningBots.entries()) {
            botStats[name] = bot.getStats();
        }
        
        return {
            bridge: this.learningStats,
            bots: botStats,
            isActive: this.isActive,
            processedReviews: this.processedReviews.size,
            
            // NEU: Erweiterte Statistiken
            strategicAnalysis: {
                positionPerformance: this.calculatePositionPerformance(),
                rolePerformance: this.calculateRolePerformance(),
                learningTrends: this.calculateLearningTrends()
            }
        };
    }

    // NEU: Berechnet Position-Performance
    calculatePositionPerformance() {
        const performance = {};
        
        Object.entries(this.learningStats.positionAnalysis).forEach(([position, stats]) => {
            const total = stats.good + stats.bad;
            performance[position] = {
                successRate: total > 0 ? (stats.good / total * 100).toFixed(1) : 0,
                totalReviews: total,
                confidence: total >= 10 ? 'high' : total >= 5 ? 'medium' : 'low'
            };
        });
        
        return performance;
    }

    // NEU: Berechnet Rollen-Performance
    calculateRolePerformance() {
        const performance = {};
        
        Object.entries(this.learningStats.roleAnalysis).forEach(([role, stats]) => {
            const total = stats.good + stats.bad;
            performance[role] = {
                successRate: total > 0 ? (stats.good / total * 100).toFixed(1) : 0,
                totalReviews: total,
                confidence: total >= 10 ? 'high' : total >= 5 ? 'medium' : 'low'
            };
        });
        
        return performance;
    }

    // NEU: Berechnet Lern-Trends
    calculateLearningTrends() {
        const recentPositiveRate = this.learningStats.positiveSignals / 
                                  Math.max(1, this.learningStats.reviewsProcessed) * 100;
        
        return {
            overallPositiveRate: recentPositiveRate.toFixed(1),
            totalSignals: this.learningStats.positiveSignals + this.learningStats.negativeSignals,
            learningVelocity: this.learningStats.reviewsProcessed > 0 ? 'active' : 'inactive'
        };
    }

    // Manueller Review-Import für Testing (ERWEITERT)
    async importReviewsManually() {
        console.log('🔄 Erweiteter manueller Review-Import gestartet...');
        await this.processNewReviews();
        this.logEnhancedStats();
    }

    // Reset für Debugging (ERWEITERT)
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
            bot.reset();
        }
        
        localStorage.removeItem('qlearning_bridge_stats');
        console.log('🔄 Erweitertes Q-Learning System zurückgesetzt');
    }

    // Integration mit Spiel-Loop (ERWEITERT)
    onTrickPlayed(trickResult) {
        // Wird vom Spiel aufgerufen wenn ein Stich gespielt wurde
        for (const [name, bot] of this.qLearningBots.entries()) {
            const reward = bot.calculateReward(trickResult);
            // Weitere Integration hier...
        }
    }

    onGameEnd(gameResult) {
        // Wird vom Spiel aufgerufen wenn ein Spiel endet
        for (const [name, bot] of this.qLearningBots.entries()) {
            bot.trainAfterGame(gameResult);
        }
        
        this.saveLearningProgress();
    }
}

// Globale Bridge-Instanz
window.qLearningBridge = new CommunityQLearningBridge();

// Integration mit bestehendem Training-System
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

// Global verfügbare Funktionen (ERWEITERT)
window.getQLearningStats = function() {
    return window.qLearningBridge ? window.qLearningBridge.getLearningStats() : null;
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

// NEU: Erweiterte Debug-Funktionen
window.debugQLearningPositions = function() {
    if (window.qLearningBridge) {
        console.log('🎯 Position-Performance:', window.qLearningBridge.calculatePositionPerformance());
        console.log('🎭 Rollen-Performance:', window.qLearningBridge.calculateRolePerformance());
    }
};

console.log('🌉 Enhanced Community-Q-Learning Bridge geladen - Reviews werden zu strategischen KI-Lernsignalen!');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunityQLearningBridge;
}
