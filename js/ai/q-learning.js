/**
 * Q-Learning AI für Schafkopf
 * Lernt optimale Strategien durch Verstärkungslernen
 * Browser-Script Version (ohne ES6 imports/exports)
 */

// Dependencies erwartet als window-globals:
// - window.SchafkopfCardMemory (aus card-memory.js)

/**
 * Q-Learning AI für Schafkopf
 * Lernt optimale Strategien durch Verstärkungslernen
 */
class SchafkopfQLearning {
    constructor(playerId, config = {}) {
        this.playerId = playerId;
        
        // Q-Learning Parameter
        this.learningRate = config.learningRate || 0.1;    // Alpha: Lerngeschwindigkeit
        this.discountFactor = config.discountFactor || 0.9; // Gamma: Zukunftsbewertung  
        this.explorationRate = config.explorationRate || 0.3; // Epsilon: Exploration vs Exploitation
        this.explorationDecay = config.explorationDecay || 0.995;
        this.minExploration = config.minExploration || 0.05;
        
        // Q-Table: State -> Action -> Value
        this.qTable = new Map();
        
        // Erfahrungsspeicher für Training
        this.experiences = [];
        this.maxExperiences = config.maxExperiences || 10000;
        
        // Spielstatistiken
        this.gamesPlayed = 0;
        this.wins = 0;
        this.averageScore = 0;
        this.lastGameScore = 0;
        
        // Kartengedächtnis
        this.cardMemory = new window.SchafkopfCardMemory();
        
        console.log(`🧠 Q-Learning AI ${playerId} initialisiert`);
    }
    
    /**
     * 🛡️ FIXED: Hauptfunktion mit robuster Null-Check Logic
     */
    selectCard(playableCards, gameContext) {
        // 🛡️ SAFETY: Input Validation
        if (!playableCards || !Array.isArray(playableCards) || playableCards.length === 0) {
            console.error(`❌ Q-Learning ${this.playerId}: Keine gültigen spielbaren Karten erhalten:`, playableCards);
            return null;
        }
        
        // 🛡️ SAFETY: Validate each card in playableCards
        const validCards = playableCards.filter(card => 
            card && typeof card === 'object' && card.suit && card.value
        );
        
        if (validCards.length === 0) {
            console.error(`❌ Q-Learning ${this.playerId}: Alle Karten in playableCards sind invalid`);
            return null;
        }
        
        if (validCards.length === 1) {
            console.log(`🎯 Q-Learning ${this.playerId}: Nur eine gültige Karte verfügbar`);
            return validCards[0];
        }
        
        // 🛡️ SAFETY: Validate gameContext
        if (!gameContext) {
            console.warn(`⚠️ Q-Learning ${this.playerId}: Kein gameContext, verwende erste gültige Karte`);
            return validCards[0];
        }
        
        // Game State in kompakte Repräsentation umwandeln
        let state;
        try {
            state = this.encodeGameState(gameContext);
        } catch (error) {
            console.error(`❌ Q-Learning ${this.playerId}: encodeGameState Fehler:`, error);
            return validCards[0];
        }
        
        // Epsilon-Greedy Strategie: Exploration vs Exploitation
        if (Math.random() < this.explorationRate) {
            // Exploration: Zufällige Aktion
            const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
            console.log(`🔀 Q-Learning Player ${this.playerId}: Exploration (ε=${this.explorationRate.toFixed(3)})`);
            return randomCard;
        }
        
        // Exploitation: Beste bekannte Aktion
        let bestCard;
        try {
            bestCard = this.getBestAction(state, validCards);
        } catch (error) {
            console.error(`❌ Q-Learning ${this.playerId}: getBestAction Fehler:`, error);
            bestCard = validCards[0];
        }
        
        // 🛡️ FINAL SAFETY CHECK: Ensure bestCard is valid
        if (!bestCard || !bestCard.suit || !bestCard.value) {
            console.warn(`⚠️ Q-Learning ${this.playerId}: getBestAction gab invalide Karte zurück, verwende Fallback`);
            return validCards[0];
        }
        
        console.log(`🎯 Q-Learning Player ${this.playerId}: Exploitation - beste Karte: ${bestCard.suit} ${bestCard.value}`);
        return bestCard;
    }
    
    /**
     * Kodiert den aktuellen Spielzustand in kompakte Darstellung
     * Kritisch für Q-Learning: Zustand muss vergleichbar und diskret sein
     */
    encodeGameState(gameContext) {
        // 🛡️ SAFETY: Provide defaults for missing gameContext properties
        const state = {
            // Trick-Information
            trickNumber: Math.min(gameContext.trickNumber || 0, 7), // 0-7
            trickSize: gameContext.currentTrick ? gameContext.currentTrick.length : 0, // 0-3
            position: this.getTrickPosition(gameContext), // 0-3
            
            // Spielmodus
            gameType: gameContext.gameType || 'rufspiel',
            trumpSuit: gameContext.trumpSuit || 'herz',
            
            // Kartenverteilung (vereinfacht)
            cardsInHand: this.getHandSize(gameContext),
            trumpsLeft: this.estimateTrumpsLeft(gameContext),
            
            // Stich-Kontext
            leadCard: this.getLeadCardType(gameContext),
            strongestCard: this.getStrongestCardType(gameContext),
            
            // Partner-Information (bei Rufspiel)
            partnerKnown: this.isPartnerKnown(gameContext),
            partnerPosition: this.getPartnerPosition(gameContext),
            
            // Score-Situation
            scorePosition: this.getScorePosition(gameContext)
        };
        
        // Konvertiere zu String für Map-Key
        return JSON.stringify(state);
    }
    
    /**
     * 🛡️ FIXED: Findet beste Aktion für gegebenen Zustand mit robuster Validation
     */
    getBestAction(state, playableCards) {
        // 🛡️ SAFETY: Input validation
        if (!playableCards || playableCards.length === 0) {
            console.error(`❌ getBestAction ${this.playerId}: Keine playableCards`);
            return null;
        }
        
        let bestCard = null;
        let bestValue = -Infinity;
        
        for (const card of playableCards) {
            // 🛡️ SAFETY: Validate each card before processing
            if (!card || !card.suit || !card.value) {
                console.warn(`⚠️ getBestAction ${this.playerId}: Überspringe invalide Karte:`, card);
                continue;
            }
            
            try {
                const actionKey = this.encodeAction(card);
                const qValue = this.getQValue(state, actionKey);
                
                if (qValue > bestValue) {
                    bestValue = qValue;
                    bestCard = card;
                }
            } catch (error) {
                console.error(`❌ getBestAction ${this.playerId}: Fehler bei Karte ${card.suit} ${card.value}:`, error);
                continue;
            }
        }
        
        // 🛡️ SAFETY: Fallback if no valid card found
        if (!bestCard) {
            const firstValidCard = playableCards.find(card => 
                card && card.suit && card.value
            );
            
            if (firstValidCard) {
                console.warn(`⚠️ getBestAction ${this.playerId}: Kein Q-Value gefunden, verwende erste gültige Karte`);
                return firstValidCard;
            } else {
                console.error(`❌ getBestAction ${this.playerId}: Keine gültige Karte in playableCards gefunden`);
                return null;
            }
        }
        
        return bestCard;
    }
    
    /**
     * Holt Q-Wert für State-Action Paar
     */
    getQValue(state, action) {
        const key = `${state}|${action}`;
        return this.qTable.get(key) || 0.0;
    }
    
    /**
     * Setzt Q-Wert für State-Action Paar
     */
    setQValue(state, action, value) {
        const key = `${state}|${action}`;
        this.qTable.set(key, value);
    }
    
    /**
     * 🛡️ FIXED: Kodiert Karten-Aktion mit Null-Safety
     */
    encodeAction(card) {
        // 🛡️ SAFETY: Validate card before encoding
        if (!card || typeof card !== 'object') {
            console.error(`❌ encodeAction ${this.playerId}: Card ist null oder kein Objekt:`, card);
            return 'invalid_null';
        }
        
        if (!card.suit || !card.value) {
            console.error(`❌ encodeAction ${this.playerId}: Card fehlt suit oder value:`, card);
            return `invalid_${card.suit || 'nosuit'}_${card.value || 'novalue'}`;
        }
        
        try {
            // Vereinfachte Aktion: Karten-Typ + ungefähre Stärke
            const strength = this.getCardStrength(card);
            return `${card.suit}_${strength}`;
        } catch (error) {
            console.error(`❌ encodeAction ${this.playerId}: getCardStrength Fehler:`, error);
            return `fallback_${card.suit}_unknown`;
        }
    }
    
    /**
     * HILFSFUNKTIONEN für State-Encoding
     */
    
    getTrickPosition(gameContext) {
        return gameContext.currentTrick ? gameContext.currentTrick.length : 0;
    }
    
    getHandSize(gameContext) {
        // 🛡️ SAFETY: Handle missing player data
        if (!gameContext.players || !gameContext.players[this.playerId]) {
            return 8; // Default hand size
        }
        
        const player = gameContext.players[this.playerId];
        return player.hand ? player.hand.length : (player.cards ? player.cards.length : 8);
    }
    
    estimateTrumpsLeft(gameContext) {
        // Zähle gespielte Trümpfe basierend auf Kartengedächtnis
        try {
            return this.cardMemory.estimateRemainingTrumps(gameContext);
        } catch (error) {
            console.warn(`⚠️ estimateTrumpsLeft ${this.playerId} Fehler:`, error);
            return 7; // Default estimate
        }
    }
    
    getLeadCardType(gameContext) {
        if (!gameContext.currentTrick || gameContext.currentTrick.length === 0) {
            return 'none';
        }
        
        const leadCard = gameContext.currentTrick[0].card;
        if (this.isTrump(leadCard, gameContext)) {
            return 'trump';
        } else {
            return leadCard.suit;
        }
    }
    
    getStrongestCardType(gameContext) {
        if (!gameContext.currentTrick || gameContext.currentTrick.length === 0) {
            return 'none';
        }
        
        // Finde stärkste Karte im aktuellen Stich
        let strongest = gameContext.currentTrick[0].card;
        for (const play of gameContext.currentTrick) {
            if (this.isStronger(play.card, strongest, gameContext)) {
                strongest = play.card;
            }
        }
        
        return this.isTrump(strongest, gameContext) ? 'trump' : strongest.suit;
    }
    
    isPartnerKnown(gameContext) {
        if (gameContext.gameType !== 'rufspiel') return false;
        
        // Partner ist bekannt wenn das gerufene Ass bereits gespielt wurde
        return this.cardMemory.hasCardBeenPlayed(gameContext.calledAce);
    }
    
    getPartnerPosition(gameContext) {
        if (gameContext.gameType !== 'rufspiel' || !this.isPartnerKnown(gameContext)) {
            return -1; // Unbekannt
        }
        
        // Finde Partner basierend auf gespieltem gerufenen Ass
        return this.cardMemory.getCardPlayedBy(gameContext.calledAce);
    }
    
    getScorePosition(gameContext) {
        // 🛡️ SAFETY: Handle missing players data
        if (!gameContext.players || gameContext.players.length <= this.playerId) {
            return 'unknown';
        }
        
        // Vereinfachte Score-Position: führend, gleichauf, zurückliegend
        const scores = gameContext.players.map(p => p.totalScore || 0);
        const myScore = scores[this.playerId];
        const maxScore = Math.max(...scores);
        
        if (myScore === maxScore) return 'leading';
        if (myScore >= maxScore - 10) return 'close';
        return 'behind';
    }
    
    getCardStrength(card) {
        // 🛡️ SAFETY: Handle missing card data
        if (!card || !card.value) {
            return 'unknown';
        }
        
        // Vereinfachte Kartenstärke: schwach(0), mittel(1), stark(2)
        const cardOrder = ['7', '8', '9', 'unter', 'ober', '10', 'ass', 'könig'];
        const value = card.value.toLowerCase();
        const index = cardOrder.indexOf(value);
        
        if (index <= 2) return 'weak';
        if (index <= 5) return 'medium';
        return 'strong';
    }
    
    getCardPoints(card) {
        // 🛡️ SAFETY: Handle missing card data
        if (!card || !card.value) {
            return 0;
        }
        
        // Standard Schafkopf Punkte
        const points = {
            'ass': 11, '10': 10, 'könig': 4, 'ober': 3, 'unter': 2,
            '9': 0, '8': 0, '7': 0
        };
        return points[card.value.toLowerCase()] || 0;
    }
    
    isTrump(card, gameContext) {
        // 🛡️ SAFETY: Handle missing data
        if (!card || !gameContext) {
            return false;
        }
        
        // Trump-Logik je nach Spielmodus
        const trumpSuit = gameContext.trumpSuit;
        
        // Ober und Unter sind immer Trump
        if (card.value === 'ober' || card.value === 'unter') {
            return true;
        }
        
        // Bei Wenz nur Unter
        if (gameContext.gameType === 'wenz') {
            return card.value === 'unter';
        }
        
        // Bei Farbsolo oder Rufspiel: entsprechende Farbe
        return card.suit === trumpSuit;
    }
    
    isStronger(card1, card2, gameContext) {
        // 🛡️ SAFETY: Handle missing data
        if (!card1 || !card2 || !gameContext) {
            return false;
        }
        
        // Vereinfachte Stärke-Vergleich (Trump schlägt Farbe, höhere Karte schlägt niedrigere)
        const trump1 = this.isTrump(card1, gameContext);
        const trump2 = this.isTrump(card2, gameContext);
        
        if (trump1 && !trump2) return true;
        if (!trump1 && trump2) return false;
        
        // Beide Trump oder beide Farbe: nach Kartenwert
        const order = ['7', '8', '9', 'unter', 'ober', '10', 'ass', 'könig'];
        const strength1 = order.indexOf(card1.value.toLowerCase());
        const strength2 = order.indexOf(card2.value.toLowerCase());
        
        return strength1 > strength2;
    }
    
    getAllPossibleActions(state) {
        // Alle möglichen Karten-Typen die gespielt werden können
        const suits = ['herz', 'gras', 'eichel', 'schellen'];
        const strengths = ['weak', 'medium', 'strong'];
        
        const actions = [];
        for (const suit of suits) {
            for (const strength of strengths) {
                actions.push(`${suit}_${strength}`);
            }
        }
        
        return actions;
    }
    
    // [Rest der Q-Learning Methoden - verkürzt für Platz]
    updateQValues(experience) {
        const { state, action, reward, nextState, done } = experience;
        const currentQ = this.getQValue(state, action);
        
        let maxNextQ = 0;
        if (!done && nextState) {
            maxNextQ = Math.max(...this.getAllPossibleActions(nextState)
                .map(a => this.getQValue(nextState, a)));
        }
        
        const newQ = currentQ + this.learningRate * 
            (reward + this.discountFactor * maxNextQ - currentQ);
        
        this.setQValue(state, action, newQ);
    }
    
    addExperience(state, action, reward, nextState, done) {
        const experience = { state, action, reward, nextState, done, timestamp: Date.now() };
        this.experiences.push(experience);
        
        if (this.experiences.length > this.maxExperiences) {
            this.experiences.shift();
        }
        
        this.updateQValues(experience);
    }
    
    calculateReward(trickResult, gameResult = null) {
        let reward = 0;
        
        if (trickResult) {
            if (trickResult.winner === this.playerId) {
                reward += 5;
                const trickValue = trickResult.cards.reduce((sum, card) => 
                    sum + this.getCardPoints(card), 0);
                reward += trickValue * 0.1;
            } else {
                reward -= 1;
            }
        }
        
        if (gameResult) {
            if (gameResult.won) {
                reward += 20;
                reward += gameResult.score * 0.1;
            } else {
                reward -= 10;
            }
        }
        
        return reward;
    }
    
    trainAfterGame(gameResult) {
        this.gamesPlayed++;
        this.lastGameScore = gameResult.score;
        
        if (gameResult.won) {
            this.wins++;
        }
        this.averageScore = (this.averageScore * (this.gamesPlayed - 1) + gameResult.score) / this.gamesPlayed;
        
        this.explorationRate = Math.max(
            this.minExploration,
            this.explorationRate * this.explorationDecay
        );
        
        console.log(`🎓 Q-Learning ${this.playerId} Training: ` +
            `Games=${this.gamesPlayed}, Wins=${this.wins}, ` +
            `WinRate=${(this.wins/this.gamesPlayed*100).toFixed(1)}%, ` +
            `ε=${this.explorationRate.toFixed(3)}`);
    }
    
    saveToStorage() {
        const data = {
            qTable: Array.from(this.qTable.entries()),
            gamesPlayed: this.gamesPlayed,
            wins: this.wins,
            averageScore: this.averageScore,
            explorationRate: this.explorationRate,
            cardMemory: this.cardMemory.save()
        };
        
        localStorage.setItem(`qlearning_${this.playerId}`, JSON.stringify(data));
        console.log(`💾 Q-Learning ${this.playerId}: Gespeichert (${this.qTable.size} Q-Werte)`);
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem(`qlearning_${this.playerId}`);
        if (!saved) return false;
        
        try {
            const data = JSON.parse(saved);
            this.qTable = new Map(data.qTable);
            this.gamesPlayed = data.gamesPlayed || 0;
            this.wins = data.wins || 0;
            this.averageScore = data.averageScore || 0;
            this.explorationRate = data.explorationRate || this.explorationRate;
            
            if (data.cardMemory) {
                this.cardMemory.load(data.cardMemory);
            }
            
            console.log(`📂 Q-Learning ${this.playerId}: Geladen (${this.qTable.size} Q-Werte, ${this.gamesPlayed} Spiele)`);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Q-Learning Daten:', error);
            return false;
        }
    }
    
    getStats() {
        return {
            playerId: this.playerId,
            qTableSize: this.qTable.size,
            gamesPlayed: this.gamesPlayed,
            winRate: this.gamesPlayed > 0 ? (this.wins / this.gamesPlayed) : 0,
            averageScore: this.averageScore,
            explorationRate: this.explorationRate,
            experienceCount: this.experiences.length
        };
    }
    
    reset() {
        this.qTable.clear();
        this.experiences = [];
        this.gamesPlayed = 0;
        this.wins = 0;
        this.averageScore = 0;
        this.explorationRate = 0.3;
        this.cardMemory.reset();
        
        console.log(`🔄 Q-Learning ${this.playerId}: Reset abgeschlossen`);
    }
}

/**
 * Kartengedächtnis-System für AI
 */
class CardMemory {
    constructor() {
        this.playedCards = new Set();
        this.cardsByPlayer = new Map();
        this.trickHistory = [];
        this.suitDistribution = new Map();
    }
    
    recordCard(card, playerId, trickNumber) {
        const cardKey = `${card.suit}_${card.value}`;
        this.playedCards.add(cardKey);
        
        if (!this.cardsByPlayer.has(playerId)) {
            this.cardsByPlayer.set(playerId, []);
        }
        this.cardsByPlayer.get(playerId).push({ card, trickNumber });
        
        this.updateSuitDistribution(card.suit, playerId);
    }
    
    hasCardBeenPlayed(card) {
        const cardKey = `${card.suit}_${card.value}`;
        return this.playedCards.has(cardKey);
    }
    
    getCardPlayedBy(card) {
        for (const [playerId, cards] of this.cardsByPlayer.entries()) {
            const found = cards.find(c => 
                c.card.suit === card.suit && c.card.value === card.value
            );
            if (found) return playerId;
        }
        return -1;
    }
    
    estimateRemainingTrumps(gameContext) {
        const trumpSuit = gameContext.trumpSuit;
        let playedTrumps = 0;
        
        for (const cardKey of this.playedCards) {
            const [suit, value] = cardKey.split('_');
            if (suit === trumpSuit || value === 'ober' || value === 'unter') {
                playedTrumps++;
            }
        }
        
        const totalTrumps = gameContext.gameType === 'wenz' ? 4 : 14;
        return Math.max(0, totalTrumps - playedTrumps);
    }
    
    updateSuitDistribution(suit, playerId) {
        if (!this.suitDistribution.has(playerId)) {
            this.suitDistribution.set(playerId, {});
        }
        
        const player = this.suitDistribution.get(playerId);
        player[suit] = (player[suit] || 0) + 1;
    }
    
    save() {
        return {
            playedCards: Array.from(this.playedCards),
            cardsByPlayer: Array.from(this.cardsByPlayer.entries()),
            suitDistribution: Array.from(this.suitDistribution.entries())
        };
    }
    
    load(data) {
        this.playedCards = new Set(data.playedCards);
        this.cardsByPlayer = new Map(data.cardsByPlayer);
        this.suitDistribution = new Map(data.suitDistribution);
    }
    
    reset() {
        this.playedCards.clear();
        this.cardsByPlayer.clear();
        this.suitDistribution.clear();
        this.trickHistory = [];
    }
}

/**
 * Q-Learning Performance Monitoring
 */
class QLearningMonitor {
    constructor() {
        this.performanceHistory = [];
        this.winRateWindow = 100;
    }
    
    recordGame(aiId, result) {
        this.performanceHistory.push({
            aiId,
            timestamp: Date.now(),
            won: result.won,
            score: result.score,
            explorationRate: result.explorationRate
        });
        
        if (this.performanceHistory.length > 1000) {
            this.performanceHistory.shift();
        }
    }
    
    getRecentWinRate(aiId) {
        const recent = this.performanceHistory
            .filter(h => h.aiId === aiId)
            .slice(-this.winRateWindow);
        
        if (recent.length === 0) return 0;
        
        const wins = recent.filter(h => h.won).length;
        return wins / recent.length;
    }
    
    getReport() {
        const aiIds = [...new Set(this.performanceHistory.map(h => h.aiId))];
        const report = {};
        
        for (const aiId of aiIds) {
            const games = this.performanceHistory.filter(h => h.aiId === aiId);
            const recentGames = games.slice(-this.winRateWindow);
            
            report[aiId] = {
                totalGames: games.length,
                recentWinRate: this.getRecentWinRate(aiId),
                averageScore: recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length
            };
        }
        
        return report;
    }
}

// Browser-globale Verfügbarkeit
if (typeof window !== 'undefined') {
    window.SchafkopfQLearning = SchafkopfQLearning;
    window.CardMemory = CardMemory;
    window.QLearningMonitor = QLearningMonitor;
    
    // Global Monitor Instance
    window.qLearningMonitor = new QLearningMonitor();
    
    console.log('🔧 Q-Learning Klassen an window exportiert (mit AI-Bug-Fix)');
}
