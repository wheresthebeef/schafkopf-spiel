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
            lastUpdate: null
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
                    await this.processReview(review);
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

    async processReview(review) {
        if (!review.botName || !review.rating) return;
        
        const bot = this.qLearningBots.get(review.botName);
        if (!bot) {
            console.warn(`⚠️ Bot ${review.botName} nicht gefunden für Review-Processing`);
            return;
        }
        
        // Wandle Review in Q-Learning Signal um
        const reward = this.calculateRewardFromReview(review);
        const gameState = this.reconstructGameState(review);
        const action = this.encodeActionFromReview(review);
        
        // Erstelle Q-Learning Experience
        const experience = {
            state: gameState,
            action: action,
            reward: reward,
            nextState: null, // Nicht verfügbar aus Review
            done: false,
            source: 'community_review',
            reviewId: review.id || review.communityId,
            timestamp: new Date(review.timestamp).getTime()
        };
        
        // Füge Experience zum Bot hinzu
        bot.addExperience(
            experience.state,
            experience.action,
            experience.reward,
            experience.nextState,
            experience.done
        );
        
        // Update Statistiken
        this.updateLearningStats(review.rating, reward);
        
        console.log(`🧠 ${review.botName}: Review "${review.rating}" → Reward ${reward} → Q-Learning Update`);
    }

    calculateRewardFromReview(review) {
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
        
        // Bonus für detailliertes Reasoning
        if (review.reasoning && review.reasoning.length > 20) {
            baseReward += review.rating === 'good' ? 2 : -2;
        }
        
        // Kontext-Bonus: Schwierige Situationen sind wertvoller
        const contextBonus = this.calculateContextBonus(review);
        
        return baseReward + contextBonus;
    }

    calculateContextBonus(review) {
        let bonus = 0;
        
        // Späte Stiche sind wichtiger
        if (review.gameContext && review.gameContext.trickNumber >= 6) {
            bonus += 2;
        }
        
        // Komplexe Spielsituationen
        if (review.gameContext && review.gameContext.gameType !== 'rufspiel') {
            bonus += 1; // Solo, Wenz, etc.
        }
        
        // Trumpf-Entscheidungen sind kritisch
        if (review.cardPlayed && (
            review.cardPlayed.includes('O') || // Ober
            review.cardPlayed.includes('U') || // Unter
            review.cardPlayed.includes('♥️')   // Herz (oft Trump)
        )) {
            bonus += 1;
        }
        
        return bonus;
    }

    reconstructGameState(review) {
        // Rekonstruiere Game State aus Review-Daten
        const state = {
            trickNumber: review.gameContext?.trickNumber || 0,
            gameType: review.gameContext?.gameType || 'rufspiel',
            trumpSuit: review.gameContext?.trumpSuit || 'herz',
            position: review.gameContext?.position || 'unknown',
            cardPlayed: review.cardPlayed || '',
            playerSession: review.playerSession || 'unknown'
        };
        
        return JSON.stringify(state);
    }

    encodeActionFromReview(review) {
        // Kodiere gespielte Karte als Action
        if (!review.cardPlayed) return 'unknown_action';
        
        // Extrahiere Farbe und ungefähre Stärke
        const card = this.parseCard(review.cardPlayed);
        const strength = this.getCardStrength(card);
        
        return `${card.suit}_${strength}`;
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

    updateLearningStats(rating, reward) {
        this.learningStats.reviewsProcessed++;
        this.learningStats.lastUpdate = new Date().toISOString();
        
        // Speichere Stats periodisch
        if (this.learningStats.reviewsProcessed % 10 === 0) {
            this.saveLearningProgress();
        }
    }

    saveLearningProgress() {
        // Speichere Lernfortschritt
        localStorage.setItem('qlearning_bridge_stats', JSON.stringify(this.learningStats));
        
        // Speichere alle Q-Learning Bots
        for (const [name, bot] of this.qLearningBots.entries()) {
            bot.saveToStorage();
        }
        
        console.log(`💾 Q-Learning Fortschritt gespeichert: ${this.learningStats.reviewsProcessed} Reviews verarbeitet`);
    }

    loadLearningProgress() {
        const saved = localStorage.getItem('qlearning_bridge_stats');
        if (saved) {
            try {
                this.learningStats = JSON.parse(saved);
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
            botStats[name] = bot.getStats();
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
            lastUpdate: null
        };
        
        for (const [name, bot] of this.qLearningBots.entries()) {
            bot.reset();
        }
        
        localStorage.removeItem('qlearning_bridge_stats');
        console.log('🔄 Q-Learning System zurückgesetzt');
    }

    // Integration mit Spiel-Loop
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

// Global verfügbare Funktionen
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

console.log('🌉 Community-Q-Learning Bridge geladen - Reviews werden zu KI-Lernsignalen!');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunityQLearningBridge;
}