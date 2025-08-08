/**
 * Bayerisches Schafkopf - Human-in-the-Loop AI Training
 * Ermöglicht menschliches Feedback für bessere AI-Strategien
 * Interactive Learning durch Spieler-Anmerkungen
 */

import { botManager } from './bot-manager.js';

/**
 * Human Feedback Learning System
 * Verbessert AI durch Spieler-Feedback
 */
export class HumanFeedbackLearning {
    constructor() {
        // Feedback-Speicher
        this.feedbackHistory = [];
        this.pendingFeedback = new Map(); // trick -> feedback
        
        // Learning-Parameter
        this.feedbackWeight = 2.0; // Menschliches Feedback zählt doppelt
        this.suggestionReward = 10; // Bonus für befolgte Vorschläge
        this.negativeWeight = -5; // Malus für schlechte Züge
        
        // UI-Elemente
        this.feedbackUI = null;
        this.isEnabled = false;
        
        console.log('Human-in-the-Loop Learning initialisiert');
    }
    
    /**
     * Aktiviert das Feedback-System
     */
    enable() {
        this.isEnabled = true;
        this.createFeedbackUI();
        console.log('Human Feedback Learning aktiviert');
    }
    
    /**
     * Deaktiviert das Feedback-System
     */
    disable() {
        this.isEnabled = false;
        this.removeFeedbackUI();
        console.log('Human Feedback Learning deaktiviert');
    }
    
    /**
     * Registriert AI-Zug für mögliches Feedback
     */
    recordAIMove(playerId, selectedCard, playableCards, gameContext) {
        if (!this.isEnabled) return;
        
        const moveRecord = {
            playerId,
            selectedCard,
            playableCards: [...playableCards],
            gameContext: {...gameContext},
            timestamp: Date.now(),
            trickNumber: gameContext.trickNumber
        };
        
        // Speichere für mögliches Feedback
        this.pendingFeedback.set(`trick_${gameContext.trickNumber}_player_${playerId}`, moveRecord);
        
        // Zeige Feedback-UI für diesen Zug
        this.showFeedbackForMove(moveRecord);
    }
    
    /**
     * Verarbeitet positives Feedback
     */
    recordPositiveFeedback(moveKey, comment = '') {
        const move = this.pendingFeedback.get(moveKey);
        if (!move) return;
        
        const feedback = {
            type: 'positive',
            move,
            comment,
            timestamp: Date.now(),
            reward: +8 // Positive Belohnung
        };
        
        this.applyFeedback(feedback);
        this.feedbackHistory.push(feedback);
        
        console.log(`Positives Feedback für ${move.selectedCard.suit} ${move.selectedCard.value}`);
        this.showFeedbackMessage('Zug als gut markiert!', 'success');
    }
    
    /**
     * Verarbeitet negatives Feedback
     */
    recordNegativeFeedback(moveKey, comment = '') {
        const move = this.pendingFeedback.get(moveKey);
        if (!move) return;
        
        const feedback = {
            type: 'negative',
            move,
            comment,
            timestamp: Date.now(),
            reward: -10 // Negative Belohnung
        };
        
        this.applyFeedback(feedback);
        this.feedbackHistory.push(feedback);
        
        console.log(`Negatives Feedback für ${move.selectedCard.suit} ${move.selectedCard.value}`);
        this.showFeedbackMessage('Zug als schlecht markiert!', 'warning');
    }
    
    /**
     * Verarbeitet Vorschlag für besseren Zug
     */
    recordAlternativeSuggestion(moveKey, suggestedCard, reason = '') {
        const move = this.pendingFeedback.get(moveKey);
        if (!move) return;
        
        const feedback = {
            type: 'suggestion',
            move,
            suggestedCard,
            reason,
            timestamp: Date.now(),
            reward: -8 // Bestrafung für schlechten Zug
        };
        
        this.applyFeedback(feedback);
        this.feedbackHistory.push(feedback);
        
        // Lerne auch den besseren Zug
        this.learnSuggestedMove(move, suggestedCard);
        
        console.log(`Vorschlag: ${suggestedCard.suit} ${suggestedCard.value} statt ${move.selectedCard.suit} ${move.selectedCard.value}`);
        this.showFeedbackMessage(`Vorschlag registriert: ${suggestedCard.suit} ${suggestedCard.value}!`, 'info');
    }
    
    /**
     * Wendet Feedback auf AI-Learning an
     */
    applyFeedback(feedback) {
        const aiData = botManager.aiPlayers.get(feedback.move.playerId);
        if (!aiData || aiData.type !== 'qlearning') return;
        
        const ai = aiData.instance;
        
        // State und Action aus dem Move
        const state = ai.encodeGameState(feedback.move.gameContext);
        const action = ai.encodeAction(feedback.move.selectedCard);
        
        // Verstärktes Learning durch menschliches Feedback
        const enhancedReward = feedback.reward * this.feedbackWeight;
        
        // Direktes Q-Value Update
        const currentQ = ai.getQValue(state, action);
        const newQ = currentQ + (ai.learningRate * enhancedReward);
        ai.setQValue(state, action, newQ);
        
        console.log(`Q-Update durch Feedback: ${currentQ.toFixed(3)} -> ${newQ.toFixed(3)}`);
    }
    
    /**
     * Lernt von vorgeschlagenem besseren Zug
     */
    learnSuggestedMove(originalMove, suggestedCard) {
        const aiData = botManager.aiPlayers.get(originalMove.playerId);
        if (!aiData || aiData.type !== 'qlearning') return;
        
        const ai = aiData.instance;
        
        // State und bessere Action
        const state = ai.encodeGameState(originalMove.gameContext);
        const betterAction = ai.encodeAction(suggestedCard);
        
        // Belohne den besseren Zug
        const currentQ = ai.getQValue(state, betterAction);
        const newQ = currentQ + (ai.learningRate * this.suggestionReward);
        ai.setQValue(state, betterAction, newQ);
        
        console.log(`Besserer Zug gelernt: ${suggestedCard.suit} ${suggestedCard.value}`);
    }
    
    /**
     * Erstellt das Feedback-UI
     */
    createFeedbackUI() {
        // Container für Feedback-UI
        const feedbackContainer = document.createElement('div');
        feedbackContainer.id = 'feedback-container';
        feedbackContainer.className = 'feedback-container';
        
        feedbackContainer.innerHTML = `
            <div class="feedback-header">
                <h3>AI-Training</h3>
                <button class="btn-close" onclick="humanFeedback.disable()">×</button>
            </div>
            <div class="feedback-content" id="feedback-content">
                <p>Spiele ein paar Züge - dann kannst du die AI-Entscheidungen bewerten!</p>
            </div>
            <div class="feedback-stats" id="feedback-stats">
                Feedback gegeben: <span id="feedback-count">0</span>
            </div>
        `;
        
        // CSS-Styles hinzufügen
        const style = document.createElement('style');
        style.textContent = `
            .feedback-container {
                position: fixed;
                top: 100px;
                right: 20px;
                width: 300px;
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid #007bff;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 1000;
                font-family: Arial, sans-serif;
            }
            .feedback-header {
                background: #007bff;
                color: white;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 6px 6px 0 0;
            }
            .feedback-header h3 {
                margin: 0;
                font-size: 14px;
            }
            .btn-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
            }
            .feedback-content {
                padding: 15px;
                max-height: 200px;
                overflow-y: auto;
            }
            .feedback-stats {
                background: #f8f9fa;
                padding: 8px 15px;
                font-size: 12px;
                border-radius: 0 0 6px 6px;
                border-top: 1px solid #dee2e6;
            }
            .move-feedback {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 10px;
                margin: 8px 0;
            }
            .move-info {
                font-weight: bold;
                color: #495057;
                margin-bottom: 8px;
            }
            .feedback-buttons {
                display: flex;
                gap: 5px;
                margin-bottom: 8px;
            }
            .feedback-btn {
                flex: 1;
                padding: 4px 8px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            }
            .btn-good { background: #28a745; color: white; }
            .btn-bad { background: #dc3545; color: white; }
            .btn-suggest { background: #ffc107; color: black; }
            .alternative-cards {
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
                margin-top: 5px;
            }
            .alt-card {
                background: #007bff;
                color: white;
                border: none;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                cursor: pointer;
            }
            .feedback-message {
                position: fixed;
                top: 70px;
                right: 20px;
                padding: 10px 15px;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                z-index: 1001;
                animation: fadeInOut 3s ease-in-out;
            }
            .feedback-message.success { background: #28a745; }
            .feedback-message.warning { background: #dc3545; }
            .feedback-message.info { background: #17a2b8; }
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(100%); }
                20% { opacity: 1; transform: translateX(0); }
                80% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(100%); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(feedbackContainer);
        
        this.feedbackUI = feedbackContainer;
    }
    
    /**
     * Zeigt Feedback-Optionen für einen Zug
     */
    showFeedbackForMove(moveRecord) {
        const content = document.getElementById('feedback-content');
        if (!content) return;
        
        const moveKey = `trick_${moveRecord.trickNumber}_player_${moveRecord.playerId}`;
        const playerName = this.getPlayerName(moveRecord.playerId);
        
        const moveDiv = document.createElement('div');
        moveDiv.className = 'move-feedback';
        
        moveDiv.innerHTML = `
            <div class="move-info">
                ${playerName}: ${moveRecord.selectedCard.suit} ${moveRecord.selectedCard.value}
            </div>
            <div class="feedback-buttons">
                <button class="feedback-btn btn-good" onclick="humanFeedback.recordPositiveFeedback('${moveKey}')">
                    Gut
                </button>
                <button class="feedback-btn btn-bad" onclick="humanFeedback.recordNegativeFeedback('${moveKey}')">
                    Schlecht
                </button>
                <button class="feedback-btn btn-suggest" onclick="humanFeedback.showAlternatives('${moveKey}')">
                    Besser wäre...
                </button>
            </div>
            <div class="alternative-cards" id="alternatives-${moveKey}" style="display: none;">
                ${moveRecord.playableCards.filter(card => 
                    card.suit !== moveRecord.selectedCard.suit || 
                    card.value !== moveRecord.selectedCard.value
                ).map(card => 
                    `<button class="alt-card" onclick="humanFeedback.recordAlternativeSuggestion('${moveKey}', {suit:'${card.suit}', value:'${card.value}'})">
                        ${card.suit} ${card.value}
                    </button>`
                ).join('')}
            </div>
        `;
        
        // Füge am Anfang hinzu (neueste Züge oben)
        content.insertBefore(moveDiv, content.firstChild);
        
        // Entferne alte Einträge (max 5)
        while (content.children.length > 6) { // +1 für Info-Text
            content.removeChild(content.lastChild);
        }
    }
    
    /**
     * Zeigt alternative Karten für Vorschlag
     */
    showAlternatives(moveKey) {
        const alternatives = document.getElementById(`alternatives-${moveKey}`);
        if (alternatives) {
            alternatives.style.display = alternatives.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    /**
     * Zeigt Feedback-Nachricht
     */
    showFeedbackMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `feedback-message ${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // Automatisch entfernen
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
    
    /**
     * Entfernt das Feedback-UI
     */
    removeFeedbackUI() {
        if (this.feedbackUI) {
            this.feedbackUI.remove();
            this.feedbackUI = null;
        }
    }
    
    /**
     * Hilfsfunktionen
     */
    getPlayerName(playerId) {
        const names = ['Du', 'Anna', 'Bert', 'Clara'];
        return names[playerId] || `Bot ${playerId}`;
    }
    
    updateFeedbackCount() {
        const countElement = document.getElementById('feedback-count');
        if (countElement) {
            countElement.textContent = this.feedbackHistory.length;
        }
    }
    
    /**
     * Statistiken und Analyse
     */
    getFeedbackStats() {
        const stats = {
            totalFeedback: this.feedbackHistory.length,
            positive: this.feedbackHistory.filter(f => f.type === 'positive').length,
            negative: this.feedbackHistory.filter(f => f.type === 'negative').length,
            suggestions: this.feedbackHistory.filter(f => f.type === 'suggestion').length,
            byPlayer: {}
        };
        
        // Stats per Player
        for (const feedback of this.feedbackHistory) {
            const playerId = feedback.move.playerId;
            if (!stats.byPlayer[playerId]) {
                stats.byPlayer[playerId] = { positive: 0, negative: 0, suggestions: 0 };
            }
            stats.byPlayer[playerId][feedback.type]++;
        }
        
        return stats;
    }
    
    /**
     * Export/Import für Persistierung
     */
    exportFeedback() {
        return {
            feedbackHistory: this.feedbackHistory,
            timestamp: Date.now(),
            version: '1.0'
        };
    }
    
    importFeedback(data) {
        if (data && data.feedbackHistory) {
            this.feedbackHistory = data.feedbackHistory;
            this.updateFeedbackCount();
            console.log(`${this.feedbackHistory.length} Feedback-Einträge geladen`);
        }
    }
    
    /**
     * Persistierung
     */
    save() {
        const data = this.exportFeedback();
        localStorage.setItem('schafkopf_human_feedback', JSON.stringify(data));
        console.log('Human Feedback gespeichert');
    }
    
    load() {
        const saved = localStorage.getItem('schafkopf_human_feedback');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.importFeedback(data);
                return true;
            } catch (error) {
                console.error('Fehler beim Laden des Human Feedback:', error);
            }
        }
        return false;
    }
}

// Global verfügbar machen
export const humanFeedback = new HumanFeedbackLearning();

// Browser-globale Funktionen
if (typeof window !== 'undefined') {
    window.humanFeedback = humanFeedback;
    
    // Convenience-Funktionen
    window.enableHumanTraining = () => humanFeedback.enable();
    window.disableHumanTraining = () => humanFeedback.disable();
    window.getFeedbackStats = () => humanFeedback.getFeedbackStats();
    window.saveFeedback = () => humanFeedback.save();
    window.loadFeedback = () => humanFeedback.load();
}