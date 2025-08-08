/**
 * Global AI Loader - Stellt sicher, dass alle AI-Commands verfügbar sind
 * Lädt alle AI-Module und macht Funktionen global verfügbar
 */

// Flag um zu verhindern, dass Module mehrfach geladen werden
let aiSystemLoaded = false;

/**
 * Lädt das komplette AI-System und macht alle Funktionen global verfügbar
 */
export async function loadAISystem() {
    if (aiSystemLoaded) {
        console.log('⚠️ AI-System bereits geladen');
        return true;
    }

    try {
        console.log('🤖 Lade Q-Learning AI-System...');

        // Module importieren
        const aiTesting = await import('./ai-testing.js');
        const aiBridge = await import('./ai-bridge.js');
        const aiMigration = await import('./ai-migration.js');
        const humanFeedback = await import('./human-feedback.js');
        const botManager = await import('./bot-manager.js');

        console.log('✅ AI-Module geladen, registriere globale Funktionen...');

        // AI-Testing Funktionen
        window.runAITests = aiTesting.runAITests;
        window.aiQuickTest = aiTesting.quickTest;
        window.aiPerformanceBenchmark = aiTesting.performanceBenchmark;

        // AI-Bridge Funktionen
        window.aiDebug = aiBridge.debugAI;
        window.aiStats = aiBridge.getAIStats;
        window.aiSave = aiBridge.saveAIData;
        window.aiLoad = aiBridge.loadAIData;
        window.aiReset = aiBridge.resetAllAIs;
        window.aiTrain = aiBridge.trainAllAIs;
        window.aiSwitch = aiBridge.switchBotAI;

        // Human Training Funktionen
        window.enableHumanTraining = aiBridge.enableHumanTraining;
        window.disableHumanTraining = aiBridge.disableHumanTraining;
        window.getHumanFeedbackStats = aiBridge.getHumanFeedbackStats;
        window.saveHumanFeedback = aiBridge.saveHumanFeedback;
        window.loadHumanFeedback = aiBridge.loadHumanFeedback;

        // AI-Migration Funktionen
        window.migrationConfig = aiMigration.configureMigration;
        window.migrationStatus = aiMigration.getMigrationStatus;
        window.enableABTesting = aiMigration.enableABTesting;
        window.migrateToNewAI = aiMigration.migrateToNewAI;
        window.rollbackToLegacy = aiMigration.rollbackToLegacy;

        // Bot-Manager Funktionen
        window.botManager = botManager.botManager;

        // Direct access für Debugging
        window.humanFeedback = humanFeedback.humanFeedback;

        aiSystemLoaded = true;
        
        console.log('✅ AI-System erfolgreich geladen!');
        console.log('📝 Verfügbare Commands:');
        console.log('   runAITests() - Vollständige Test-Suite');
        console.log('   aiQuickTest() - Schnell-Test');
        console.log('   aiDebug() - AI-Status anzeigen');
        console.log('   aiStats() - Performance-Statistiken');
        console.log('   migrateToNewAI() - Auf Q-Learning umstellen');
        console.log('   enableABTesting() - A/B Testing aktivieren');
        console.log('   aiPerformanceBenchmark() - Performance-Tests');
        console.log('   🧑‍🏫 enableHumanTraining() - Human-in-the-Loop Learning');
        console.log('   getHumanFeedbackStats() - Feedback-Statistiken');

        return true;

    } catch (error) {
        console.error('❌ Fehler beim Laden der AI-Module:', error);
        return false;
    }
}

/**
 * Prüft ob AI-System geladen ist
 */
export function isAISystemLoaded() {
    return aiSystemLoaded;
}

/**
 * Force reload des AI-Systems
 */
export function reloadAISystem() {
    aiSystemLoaded = false;
    return loadAISystem();
}

// Auto-Load wenn im Browser
if (typeof window !== 'undefined') {
    window.loadAISystem = loadAISystem;
    window.isAISystemLoaded = isAISystemLoaded;
    window.reloadAISystem = reloadAISystem;
}