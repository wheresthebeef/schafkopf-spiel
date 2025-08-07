/**
 * Bayerisches Schafkopf - AI Integration Bridge
 * Verbindet neue ML-AI mit bestehendem Legacy-System
 * Stellt einheitliche Bot-Interface bereit
 */

import { botManager } from './ai/bot-manager.js';

/**
 * Legacy-kompatible Bot-Funktion
 * Ersetzt die alte selectCardWithBot aus strategic-bots.js
 */
export function selectCardWithAI(playableCards, playerIndex, gameContext = null) {
    // Validierung
    if (!playableCards || playableCards.length === 0) {
        console.error('❌ AI-Bridge: Keine spielbaren Karten verfügbar');
        return null;
    }
    
    if (playableCards.length === 1) {
        return playableCards[0];
    }
    
    // Spieler 0 = Mensch, 1-3 = Bots
    if (playerIndex === 0) {
        console.warn('⚠️ AI-Bridge: Versuch menschlichen Spieler durch AI zu ersetzen');
        return playableCards[0]; // Fallback
    }
    
    try {
        // Game Context vorbereiten
        const context = gameContext || buildGameContext();
        
        // Bot-Manager aufrufen
        const selectedCard = botManager.selectCard(playerIndex, playableCards, context);
        
        if (!selectedCard) {
            console.warn(`⚠️ AI-Bridge: Bot ${playerIndex} konnte keine Karte wählen`);
            return playableCards[0]; // Emergency fallback
        }
        
        console.log(`🤖 AI-Bridge: Bot ${playerIndex} wählt ${selectedCard.suit} ${selectedCard.value}`);
        return selectedCard;
        
    } catch (error) {
        console.error(`❌ AI-Bridge Fehler für Bot ${playerIndex}:`, error);
        return playableCards[0]; // Emergency fallback
    }
}

/**
 * Baut Game Context aus globalem gameState
 */
function buildGameContext() {
    // Zugriff auf globalen gameState (falls verfügbar)
    if (typeof window !== 'undefined' && window.gameState) {
        const gs = window.gameState;
        
        return {
            currentTrick: gs.currentTrick || [],
            trickNumber: gs.trickNumber || 0,
            players: gs.players || [],
            completedTricks: gs.completedTricks || [],
            gameType: gs.gameType || 'rufspiel',
            trumpSuit: gs.trumpSuit || 'herz',
            calledAce: gs.calledAce,
            calledAcePlayer: gs.calledAcePlayer,
            caller: gs.caller
        };
    }
    
    // Fallback für Testing/Debugging
    return {
        currentTrick: [],
        trickNumber: 0,
        players: [
            { hand: [], totalScore: 0 },
            { hand: [], totalScore: 0 },
            { hand: [], totalScore: 0 },
            { hand: [], totalScore: 0 }
        ],
        completedTricks: [],
        gameType: 'rufspiel',
        trumpSuit: 'herz',
        calledAce: null,
        calledAcePlayer: -1,
        caller: 0
    };
}

/**
 * Benachrichtigt AI über abgeschlossenen Trick
 */
export function notifyAITrickCompleted(trickResult) {
    try {
        const context = buildGameContext();
        botManager.onTrickCompleted(trickResult, context);
        
        console.log('📝 AI-Bridge: Trick-Ergebnis an alle AIs übermittelt');
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler bei Trick-Benachrichtigung:', error);
    }
}

/**
 * Benachrichtigt AI über abgeschlossenes Spiel
 */
export function notifyAIGameCompleted(gameResult) {
    try {
        botManager.onGameCompleted(gameResult);
        
        console.log('🏁 AI-Bridge: Spiel-Ergebnis an alle AIs übermittelt');
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler bei Spiel-Benachrichtigung:', error);
    }
}

/**
 * Initialisiert AI-System
 */
export function initializeAISystem(config = {}) {
    try {
        const defaultConfig = {
            aiType: 'qlearning',
            playerConfigs: {
                1: { explorationRate: 0.3, learningRate: 0.1 },
                2: { explorationRate: 0.25, learningRate: 0.12 },
                3: { explorationRate: 0.35, learningRate: 0.08 }
            }
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        botManager.initializeAllBots(finalConfig.aiType, finalConfig.playerConfigs);
        
        console.log('🚀 AI-Bridge: AI-System erfolgreich initialisiert');
        return true;
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler bei AI-Initialisierung:', error);
        return false;
    }
}

/**
 * Wechselt AI-Typ für bestimmten Bot
 */
export function switchBotAI(playerId, aiType, config = {}) {
    try {
        botManager.switchAIType(playerId, aiType, config);
        console.log(`🔄 AI-Bridge: Bot ${playerId} auf ${aiType} umgestellt`);
        return true;
    } catch (error) {
        console.error(`❌ AI-Bridge: Fehler beim AI-Wechsel für Bot ${playerId}:`, error);
        return false;
    }
}

/**
 * Holt AI-Performance Statistiken
 */
export function getAIStats() {
    try {
        return botManager.getFullReport();
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler beim Abrufen der Statistiken:', error);
        return null;
    }
}

/**
 * Speichert alle AI-Daten
 */
export function saveAIData() {
    try {
        botManager.saveAll();
        console.log('💾 AI-Bridge: Alle AI-Daten gespeichert');
        return true;
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler beim Speichern:', error);
        return false;
    }
}

/**
 * Lädt alle AI-Daten
 */
export function loadAIData() {
    try {
        botManager.loadAll();
        console.log('📂 AI-Bridge: Alle AI-Daten geladen');
        return true;
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler beim Laden:', error);
        return false;
    }
}

/**
 * Reset aller AIs (für neue Trainingsphase)
 */
export function resetAllAIs() {
    try {
        botManager.resetAllAIs();
        console.log('🔄 AI-Bridge: Alle AIs zurückgesetzt');
        return true;
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler beim Reset:', error);
        return false;
    }
}

/**
 * Legacy-Kompatibilität: Alte Funktionsnamen
 */
export function selectCardWithBot(playableCards, playerIndex, gameContext) {
    return selectCardWithAI(playableCards, playerIndex, gameContext);
}

/**
 * Debug-Funktionen für Entwicklung
 */
export function debugAI() {
    const stats = getAIStats();
    console.log('🔍 AI-Bridge Debug Report:', stats);
    
    if (typeof window !== 'undefined') {
        window.aiStats = stats;
        console.log('Debug-Daten in window.aiStats verfügbar');
    }
    
    return stats;
}

/**
 * Batch-Training aller AIs
 */
export function trainAllAIs(iterations = 100) {
    try {
        botManager.performBatchTraining(iterations);
        console.log(`🎓 AI-Bridge: Batch-Training (${iterations} Iterationen) abgeschlossen`);
        return true;
    } catch (error) {
        console.error('❌ AI-Bridge: Fehler beim Batch-Training:', error);
        return false;
    }
}

// Browser-globale Funktionen verfügbar machen
if (typeof window !== 'undefined') {
    window.aiDebug = debugAI;
    window.aiStats = getAIStats;
    window.aiSave = saveAIData;
    window.aiLoad = loadAIData;
    window.aiReset = resetAllAIs;
    window.aiTrain = trainAllAIs;
    window.aiSwitch = switchBotAI;
}