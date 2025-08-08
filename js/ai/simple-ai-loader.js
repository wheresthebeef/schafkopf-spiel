/**
 * Simplified AI Loader - Behebt Syntax-Fehler beim Modul-Import
 * Lädt AI-Module einzeln und mit besserer Fehlerbehandlung
 */

let aiSystemLoaded = false;

/**
 * Lädt AI-System mit robustem Error-Handling
 */
export async function loadAISystem() {
    if (aiSystemLoaded) {
        console.log('AI-System bereits geladen');
        return true;
    }

    console.log('Lade Q-Learning AI-System...');

    try {
        // Lade Module einzeln mit Error-Handling
        console.log('Lade AI-Testing...');
        const aiTesting = await import('./ai-testing.js').catch(err => {
            console.error('Fehler beim Laden von ai-testing.js:', err.message);
            return null;
        });

        console.log('Lade AI-Bridge...');
        const aiBridge = await import('./ai-bridge.js').catch(err => {
            console.error('Fehler beim Laden von ai-bridge.js:', err.message);
            return null;
        });

        console.log('Lade AI-Migration...');
        const aiMigration = await import('./ai-migration.js').catch(err => {
            console.error('Fehler beim Laden von ai-migration.js:', err.message);
            return null;
        });

        console.log('Lade Human-Feedback...');
        const humanFeedback = await import('./human-feedback.js').catch(err => {
            console.error('Fehler beim Laden von human-feedback.js:', err.message);
            return null;
        });

        console.log('Lade Bot-Manager...');
        const botManager = await import('./bot-manager.js').catch(err => {
            console.error('Fehler beim Laden von bot-manager.js:', err.message);
            return null;
        });

        console.log('AI-Module geladen, registriere Funktionen...');

        // Registriere verfügbare Funktionen
        if (aiTesting && aiTesting.runAITests) {
            window.runAITests = aiTesting.runAITests;
            window.aiQuickTest = aiTesting.quickTest;
            window.aiPerformanceBenchmark = aiTesting.performanceBenchmark;
            console.log('AI-Testing Funktionen registriert');
        }

        if (aiBridge) {
            if (aiBridge.debugAI) window.aiDebug = aiBridge.debugAI;
            if (aiBridge.getAIStats) window.aiStats = aiBridge.getAIStats;
            if (aiBridge.saveAIData) window.aiSave = aiBridge.saveAIData;
            if (aiBridge.loadAIData) window.aiLoad = aiBridge.loadAIData;
            if (aiBridge.resetAllAIs) window.aiReset = aiBridge.resetAllAIs;
            if (aiBridge.trainAllAIs) window.aiTrain = aiBridge.trainAllAIs;
            if (aiBridge.switchBotAI) window.aiSwitch = aiBridge.switchBotAI;
            
            // Human Training
            if (aiBridge.enableHumanTraining) window.enableHumanTraining = aiBridge.enableHumanTraining;
            if (aiBridge.disableHumanTraining) window.disableHumanTraining = aiBridge.disableHumanTraining;
            if (aiBridge.getHumanFeedbackStats) window.getHumanFeedbackStats = aiBridge.getHumanFeedbackStats;
            if (aiBridge.saveHumanFeedback) window.saveHumanFeedback = aiBridge.saveHumanFeedback;
            if (aiBridge.loadHumanFeedback) window.loadHumanFeedback = aiBridge.loadHumanFeedback;
            
            console.log('AI-Bridge Funktionen registriert');
        }

        if (aiMigration) {
            if (aiMigration.configureMigration) window.migrationConfig = aiMigration.configureMigration;
            if (aiMigration.getMigrationStatus) window.migrationStatus = aiMigration.getMigrationStatus;
            if (aiMigration.enableABTesting) window.enableABTesting = aiMigration.enableABTesting;
            if (aiMigration.migrateToNewAI) window.migrateToNewAI = aiMigration.migrateToNewAI;
            if (aiMigration.rollbackToLegacy) window.rollbackToLegacy = aiMigration.rollbackToLegacy;
            console.log('AI-Migration Funktionen registriert');
        }

        if (humanFeedback && humanFeedback.humanFeedback) {
            window.humanFeedback = humanFeedback.humanFeedback;
            console.log('Human-Feedback direkt registriert');
        }

        if (botManager && botManager.botManager) {
            window.botManager = botManager.botManager;
            console.log('Bot-Manager registriert');
        }

        aiSystemLoaded = true;
        
        console.log('AI-System erfolgreich geladen!');
        console.log('Verfuegbare Commands:');
        console.log('   runAITests() - Test-Suite');
        console.log('   enableHumanTraining() - Human Training');
        console.log('   aiDebug() - Debug Info');
        console.log('   migrateToNewAI() - Q-Learning aktivieren');

        return true;

    } catch (error) {
        console.error('Schwerer Fehler beim AI-System laden:', error);
        return false;
    }
}

/**
 * Emergency-Fix speziell für enableHumanTraining
 */
export async function fixHumanTraining() {
    try {
        console.log('Emergency-Fix fuer enableHumanTraining...');
        
        const humanFeedback = await import('./human-feedback.js');
        
        if (humanFeedback && humanFeedback.humanFeedback) {
            window.humanFeedback = humanFeedback.humanFeedback;
            window.enableHumanTraining = () => humanFeedback.humanFeedback.enable();
            window.disableHumanTraining = () => humanFeedback.humanFeedback.disable();
            window.getHumanFeedbackStats = () => humanFeedback.humanFeedback.getFeedbackStats();
            
            console.log('enableHumanTraining Emergency-Fix erfolgreich!');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Emergency-Fix fehlgeschlagen:', error);
        return false;
    }
}

export function isAISystemLoaded() {
    return aiSystemLoaded;
}

export function reloadAISystem() {
    aiSystemLoaded = false;
    return loadAISystem();
}

// Browser-globale Funktionen
if (typeof window !== 'undefined') {
    window.loadAISystem = loadAISystem;
    window.fixHumanTraining = fixHumanTraining;
    window.isAISystemLoaded = isAISystemLoaded;
    window.reloadAISystem = reloadAISystem;
}