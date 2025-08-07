/**
 * Bayerisches Schafkopf - AI Migration Helper
 * Migriert schrittweise von legacy strategic-bots.js zu neuem AI-System
 * Ermöglicht A/B Testing zwischen alter und neuer AI
 */

// Legacy-Bot-System importieren
import '../strategic-bots.js';

// Neues AI-System importieren
import { selectCardWithAI, notifyAITrickCompleted, notifyAIGameCompleted } from './ai-bridge.js';

// Migration-Konfiguration
const MIGRATION_CONFIG = {
    useNewAI: true,                    // false = legacy bots, true = neue AI
    hybridMode: false,                 // true = 50/50 zwischen alt und neu
    migratedPlayers: [1, 2, 3],       // Welche Spieler verwenden neue AI
    fallbackToLegacy: true             // Bei AI-Fehlern zu Legacy fallback
};

/**
 * Migrierte Bot-Kartenauswahl
 * Routing zwischen legacy und neuer AI
 */
export function selectBotCard(playableCards, playerIndex, gameContext = null) {
    // Validierung
    if (!playableCards || playableCards.length === 0) {
        console.error('❌ Migration: Keine spielbaren Karten verfügbar');
        return null;
    }
    
    if (playableCards.length === 1) {
        return playableCards[0];
    }
    
    // Migration-Logik
    const useNewAI = shouldUseNewAI(playerIndex);
    
    if (useNewAI) {
        try {
            // Neue AI verwenden
            const selectedCard = selectCardWithAI(playableCards, playerIndex, gameContext);
            
            if (selectedCard) {
                console.log(`🧠 Migration: Spieler ${playerIndex} verwendet neue AI`);
                return selectedCard;
            } else if (MIGRATION_CONFIG.fallbackToLegacy) {
                console.warn(`⚠️ Migration: Neue AI versagte, Fallback zu Legacy für Spieler ${playerIndex}`);
                return selectLegacyBot(playableCards, playerIndex, gameContext);
            }
        } catch (error) {
            console.error(`❌ Migration: Neue AI Fehler für Spieler ${playerIndex}:`, error);
            
            if (MIGRATION_CONFIG.fallbackToLegacy) {
                console.log(`🔄 Migration: Fallback zu Legacy für Spieler ${playerIndex}`);
                return selectLegacyBot(playableCards, playerIndex, gameContext);
            }
        }
    } else {
        // Legacy AI verwenden
        console.log(`📉 Migration: Spieler ${playerIndex} verwendet Legacy-Bot`);
        return selectLegacyBot(playableCards, playerIndex, gameContext);
    }
    
    // Emergency fallback
    console.warn(`🚨 Migration: Emergency fallback für Spieler ${playerIndex}`);
    return playableCards[0];
}

/**
 * Entscheidet ob neue AI für Spieler verwendet werden soll
 */
function shouldUseNewAI(playerIndex) {
    // Grundeinstellung
    if (!MIGRATION_CONFIG.useNewAI) {
        return false;
    }
    
    // Player-spezifische Migration
    if (!MIGRATION_CONFIG.migratedPlayers.includes(playerIndex)) {
        return false;
    }
    
    // Hybrid-Modus: 50/50 Zufall
    if (MIGRATION_CONFIG.hybridMode) {
        return Math.random() < 0.5;
    }
    
    return true;
}

/**
 * Legacy-Bot Aufruf
 */
function selectLegacyBot(playableCards, playerIndex, gameContext) {
    // Aufruf der globalen selectCardWithBot Funktion aus strategic-bots.js
    if (typeof window !== 'undefined' && typeof selectCardWithBot !== 'undefined') {
        return selectCardWithBot(playableCards, playerIndex, gameContext);
    }
    
    // Einfache Fallback-Logik falls Legacy nicht verfügbar
    console.warn('⚠️ Migration: Legacy-Bot nicht verfügbar, verwende Fallback');
    return simpleBot(playableCards, gameContext);
}

/**
 * Einfacher Fallback-Bot
 */
function simpleBot(playableCards, gameContext) {
    // Grundlegende Logik: Trumpf wenn vorhanden, sonst niedrigste Karte
    if (!gameContext) {
        return playableCards[0];
    }
    
    // Trump-Karten identifizieren
    const trumpCards = playableCards.filter(card => {
        if (card.value === 'ober' || card.value === 'unter') return true;
        if (gameContext.trumpSuit && card.suit === gameContext.trumpSuit) return true;
        return false;
    });
    
    if (trumpCards.length > 0) {
        // Niedrigsten Trump spielen
        return trumpCards.reduce((lowest, card) => 
            getCardValue(card) < getCardValue(lowest) ? card : lowest
        );
    }
    
    // Niedrigste Farbkarte
    return playableCards.reduce((lowest, card) => 
        getCardValue(card) < getCardValue(lowest) ? card : lowest
    );
}

/**
 * Einfache Kartenbewertung
 */
function getCardValue(card) {
    const values = {
        '7': 1, '8': 2, '9': 3, 'unter': 4, 'ober': 5,
        'zehn': 6, '10': 6, 'koenig': 7, 'könig': 7, 'ass': 8, 'sau': 8
    };
    return values[card.value.toLowerCase()] || 0;
}

/**
 * Migration: Trick-Ende Benachrichtigung
 */
export function notifyTrickCompleted(trickResult) {
    // Nur neue AI benachrichtigen (Legacy braucht das nicht)
    if (MIGRATION_CONFIG.useNewAI) {
        try {
            notifyAITrickCompleted(trickResult);
        } catch (error) {
            console.error('❌ Migration: Fehler bei Trick-Benachrichtigung:', error);
        }
    }
}

/**
 * Migration: Spiel-Ende Benachrichtigung
 */
export function notifyGameCompleted(gameResult) {
    // Nur neue AI benachrichtigen
    if (MIGRATION_CONFIG.useNewAI) {
        try {
            notifyAIGameCompleted(gameResult);
        } catch (error) {
            console.error('❌ Migration: Fehler bei Spiel-Benachrichtigung:', error);
        }
    }
}

/**
 * Migration-Konfiguration zur Laufzeit ändern
 */
export function configureMigration(config) {
    Object.assign(MIGRATION_CONFIG, config);
    console.log('⚙️ Migration: Konfiguration aktualisiert:', MIGRATION_CONFIG);
}

/**
 * A/B Testing: Aktiviert Hybrid-Modus
 */
export function enableABTesting() {
    MIGRATION_CONFIG.hybridMode = true;
    MIGRATION_CONFIG.useNewAI = true;
    console.log('🧪 Migration: A/B Testing aktiviert - 50% Legacy, 50% neue AI');
}

/**
 * Vollständige Migration zur neuen AI
 */
export function migrateToNewAI() {
    MIGRATION_CONFIG.useNewAI = true;
    MIGRATION_CONFIG.hybridMode = false;
    MIGRATION_CONFIG.migratedPlayers = [1, 2, 3];
    console.log('🚀 Migration: Vollständig auf neue AI migriert');
}

/**
 * Rollback zur Legacy AI
 */
export function rollbackToLegacy() {
    MIGRATION_CONFIG.useNewAI = false;
    MIGRATION_CONFIG.hybridMode = false;
    console.log('🔙 Migration: Rollback zu Legacy-Bots');
}

/**
 * Migration-Status abrufen
 */
export function getMigrationStatus() {
    return {
        ...MIGRATION_CONFIG,
        timestamp: new Date().toISOString()
    };
}

// Browser-globale Funktionen für Testing
if (typeof window !== 'undefined') {
    window.migrationConfig = configureMigration;
    window.migrationStatus = getMigrationStatus;
    window.enableABTesting = enableABTesting;
    window.migrateToNewAI = migrateToNewAI;
    window.rollbackToLegacy = rollbackToLegacy;
    
    // Legacy-Kompatibilität
    window.selectBotCard = selectBotCard;
}