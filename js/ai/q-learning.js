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
     * Hauptfunktion: Wählt optimale Karte basierend auf Q-Learning
     */
    selectCard(playableCards, gameContext) {
        if (!playableCards || playableCards.length === 0) {
            console.warn('❌ Q-Learning: Keine spielbaren Karten');
            return null;
        }
        
        if (playableCards.length === 1) {
            return playableCards[0];
        }
        
        // Game State in kompakte Repräsentation umwandeln
        const state = this.encodeGameState(gameContext);
        
        // Epsilon-Greedy Strategie: Exploration vs Exploitation
        if (Math.random() < this.explorationRate) {
            // Exploration: Zufällige Aktion
            const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
            console.log(`🔀 Q-Learning Player ${this.playerId}: Exploration (ε=${this.explorationRate.toFixed(3)})`);
            return randomCard;
        }
        
        // Exploitation: Beste bekannte Aktion
        const bestCard = this.getBestAction(state, playableCards);
        console.log(`🎯 Q-Learning Player ${this.playerId}: Exploitation - beste Karte`);
        return bestCard;
    }
    
    /**
     * Kodiert den aktuellen Spielzustand in kompakte Darstellung
     * Kritisch für Q-Learning: Zustand muss vergleichbar und diskret sein
     */
    encodeGameState(gameContext) {
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
     * Findet beste Aktion für gegebenen Zustand
     */
    getBestAction(state, playableCards) {
        let bestCard = playableCards[0];
        let bestValue = -Infinity;
        
        for (const card of playableCards) {
            const actionKey = this.encodeAction(card);
            const qValue = this.getQValue(state, actionKey);
            
            if (qValue > bestValue) {
                bestValue = qValue;
                bestCard = card;
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
     * Kodiert Karten-Aktion in kompakte Darstellung
     */
    encodeAction(card) {
        // Vereinfachte Aktion: Karten-Typ + ungefähre Stärke
        return `${card.suit}_${this.getCardStrength(card)}`;
    }
    
    /**
     * Q-Learning Update nach gespieltem Trick
     * Das Herzstück des Lernalgorithmus
     */
    updateQValues(experience) {
        const { state, action, reward, nextState, done } = experience;
        
        const currentQ = this.getQValue(state, action);
        
        let maxNextQ = 0;
        if (!done && nextState) {
            // Finde maximalen Q-Wert für nächsten Zustand
            maxNextQ = Math.max(...this.getAllPossibleActions(nextState)
                .map(a => this.getQValue(nextState, a)));
        }
        
        // Q-Learning Update Formel: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        const newQ = currentQ + this.learningRate * 
            (reward + this.discountFactor * maxNextQ - currentQ);
        
        this.setQValue(state, action, newQ);
        
        // Debugging für wichtige Updates
        if (Math.abs(reward) > 10) {
            console.log(`📚 Q-Update: R=${reward}, Q: ${currentQ.toFixed(3)} → ${newQ.toFixed(3)}`);
        }
    }
    
    /**
     * Sammelt Erfahrung für späteres Training
     */
    addExperience(state, action, reward, nextState, done) {
        const experience = { state, action, reward, nextState, done, timestamp: Date.now() };
        
        this.experiences.push(experience);
        
        // Memory Management: Begrenzte Erfahrungen
        if (this.experiences.length > this.maxExperiences) {
            this.experiences.shift(); // Älteste Erfahrung entfernen
        }
        
        // Sofortiges Update
        this.updateQValues(experience);
    }
    
    /**
     * Berechnet Belohnung basierend auf Spielergebnis
     */
    calculateReward(trickResult, gameResult = null) {
        let reward = 0;
        
        // Stich-basierte Belohnungen
        if (trickResult) {
            if (trickResult.winner === this.playerId) {
                reward += 5; // Stich gewonnen
                
                // Bonus für wertvolle Stiche
                const trickValue = trickResult.cards.reduce((sum, card) => 
                    sum + this.getCardPoints(card), 0);
                reward += trickValue * 0.1;
            } else {
                reward -= 1; // Stich verloren
            }
            
            // Strategie-Bonus: Trump sparen für späte Stiche
            if (trickResult.trumpsPlayed > 2 && gameContext.trickNumber > 5) {
                reward += 2;
            }
        }
        
        // Spiel-Ende Belohnungen
        if (gameResult) {
            if (gameResult.won) {
                reward += 20; // Spiel gewonnen
                reward += gameResult.score * 0.1; // Score-Bonus
            } else {
                reward -= 10; // Spiel verloren
            }
            
            // Team-Spiel Boni (Rufspiel)
            if (gameContext.gameType === 'rufspiel' && gameResult.teamWin) {
                reward += 15; // Team-Sieg
            }
        }
        
        return reward;
    }
    
    /**
     * Training nach Spielende
     */
    trainAfterGame(gameResult) {
        this.gamesPlayed++;
        this.lastGameScore = gameResult.score;
        
        // Statistiken aktualisieren
        if (gameResult.won) {
            this.wins++;
        }
        this.averageScore = (this.averageScore * (this.gamesPlayed - 1) + gameResult.score) / this.gamesPlayed;
        
        // Exploration Rate reduzieren
        this.explorationRate = Math.max(
            this.minExploration,
            this.explorationRate * this.explorationDecay
        );
        
        // Batch-Training auf recent experiences
        this.performBatchTraining(50); // Letzten 50 Erfahrungen
        
        console.log(`🎓 Q-Learning ${this.playerId} Training: ` +
            `Games=${this.gamesPlayed}, Wins=${this.wins}, ` +
            `WinRate=${(this.wins/this.gamesPlayed*100).toFixed(1)}%, ` +
            `ε=${this.explorationRate.toFixed(3)}`);
    }
    
    /**
     * Batch-Training auf gespeicherten Erfahrungen
     */
    performBatchTraining(batchSize = 100) {
        const recentExperiences = this.experiences.slice(-batchSize);
        
        // Replay wichtiger Erfahrungen
        const importantExperiences = recentExperiences.filter(exp => 
            Math.abs(exp.reward) > 5 // Nur bedeutsame Erfahrungen
        );
        
        importantExperiences.forEach(exp => {
            this.updateQValues(exp);
        });
        
        if (importantExperiences.length > 0) {
            console.log(`🔄 Batch-Training: ${importantExperiences.length} wichtige Erfahrungen`);
        }
    }
    
    /**
     * HILFSFUNKTIONEN für State-Encoding
     */
    
    getTrickPosition(gameContext) {
        return gameContext.currentTrick ? gameContext.currentTrick.length : 0;
    }
    
    getHandSize(gameContext) {
        const player = gameContext.players[this.playerId];
        return player ? player.hand.length : 8;
    }
    
    estimateTrumpsLeft(gameContext) {
        // Zähle gespielte Trümpfe basierend auf Kartengedächtnis
        return this.cardMemory.estimateRemainingTrumps(gameContext);
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
        // Vereinfachte Score-Position: führend, gleichauf, zurückliegend
        const scores = gameContext.players.map(p => p.totalScore || 0);
        const myScore = scores[this.playerId];
        const maxScore = Math.max(...scores);
        
        if (myScore === maxScore) return 'leading';
        if (myScore >= maxScore - 10) return 'close';
        return 'behind';
    }
    
    getCardStrength(card) {
        // Vereinfachte Kartenstärke: schwach(0), mittel(1), stark(2)
        const cardOrder = ['7', '8', '9', 'unter', 'ober', '10', 'ass', 'könig'];
        const index = cardOrder.indexOf(card.value.toLowerCase());
        
        if (index <= 2) return 'weak';
        if (index <= 5) return 'medium';
        return 'strong';
    }
    
    getCardPoints(card) {
        // Standard Schafkopf Punkte
        const points = {
            'ass': 11, '10': 10, 'könig': 4, 'ober': 3, 'unter': 2,
            '9': 0, '8': 0, '7': 0
        };
        return points[card.value.toLowerCase()] || 0;
    }
    
    isTrump(card, gameContext) {
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
    
    /**
     * Speichert und lädt Q-Table (Persistierung)
     */
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
    
    /**
     * Debugging: Q-Table Statistiken
     */
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
    
    /**
     * Reset für neue Lernphase
     */
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
 * Verfolgt gespielte Karten und schätzt Wahrscheinlichkeiten
 */
class CardMemory {
    constructor() {
        this.playedCards = new Set();
        this.cardsByPlayer = new Map(); // playerId -> [cards]
        this.trickHistory = [];
        this.suitDistribution = new Map(); // suit -> player count estimates
    }
    
    recordCard(card, playerId, trickNumber) {
        const cardKey = `${card.suit}_${card.value}`;
        this.playedCards.add(cardKey);
        
        if (!this.cardsByPlayer.has(playerId)) {
            this.cardsByPlayer.set(playerId, []);
        }
        this.cardsByPlayer.get(playerId).push({ card, trickNumber });
        
        // Farb-Verteilung analysieren
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
        
        // Zähle gespielte Trümpfe
        for (const cardKey of this.playedCards) {
            const [suit, value] = cardKey.split('_');
            if (suit === trumpSuit || value === 'ober' || value === 'unter') {
                playedTrumps++;
            }
        }
        
        // Standard: 14 Trümpfe im Spiel (6 Ober + 6 Unter + 2 Herz beim Rufspiel)
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
 * Utility: Q-Learning Performance Monitoring
 */
class QLearningMonitor {
    constructor() {
        this.performanceHistory = [];
        this.winRateWindow = 100; // Sliding window für Win-Rate
    }
    
    recordGame(aiId, result) {
        this.performanceHistory.push({
            aiId,
            timestamp: Date.now(),
            won: result.won,
            score: result.score,
            explorationRate: result.explorationRate
        });
        
        // Memory Management
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
    
    shouldIncreaseDifficulty(aiId) {
        const winRate = this.getRecentWinRate(aiId);
        return winRate > 0.7; // Wenn AI zu oft gewinnt
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
                averageScore: recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length,
                learningProgress: this.calculateLearningProgress(games)
            };
        }
        
        return report;
    }
    
    calculateLearningProgress(games) {
        if (games.length < 20) return 'insufficient_data';
        
        const early = games.slice(0, 10);
        const recent = games.slice(-10);
        
        const earlyWinRate = early.filter(g => g.won).length / early.length;
        const recentWinRate = recent.filter(g => g.won).length / recent.length;
        
        const improvement = recentWinRate - earlyWinRate;
        
        if (improvement > 0.2) return 'strong_improvement';
        if (improvement > 0.05) return 'gradual_improvement';
        if (improvement > -0.05) return 'stable';
        return 'declining';
    }
}

// Browser-globale Verfügbarkeit
if (typeof window !== 'undefined') {
    window.SchafkopfQLearning = SchafkopfQLearning;
    window.CardMemory = CardMemory;
    window.QLearningMonitor = QLearningMonitor;
    
    // Global Monitor Instance
    window.qLearningMonitor = new QLearningMonitor();
    
    console.log('🔧 Q-Learning Klassen an window exportiert');
}
