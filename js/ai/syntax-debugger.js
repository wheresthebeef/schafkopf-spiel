/**
 * Syntax Error Debugger
 * Identifiziert welches Modul den Syntax-Fehler verursacht
 */

async function findSyntaxError() {
    console.log('🔍 Syntax-Fehler Diagnose startet...');
    
    const modules = [
        './q-learning.js',
        './card-memory.js',
        './bot-manager.js',
        './human-feedback.js',
        './ai-bridge.js',
        './ai-migration.js',
        './ai-testing.js'
    ];
    
    for (const modulePath of modules) {
        try {
            console.log(`Teste ${modulePath}...`);
            await import(modulePath);
            console.log(`✅ ${modulePath} OK`);
        } catch (error) {
            console.error(`❌ ${modulePath} FEHLER:`, error.message);
            console.log('Problematisches Modul gefunden!');
            return modulePath;
        }
    }
    
    console.log('Alle Module OK - Fehler liegt woanders');
    return null;
}

// Sofortiger Syntax-Check ohne Module-Imports
function emergencyEnableHumanTraining() {
    console.log('🚨 Emergency enableHumanTraining - kein Modul-Import');
    
    // Erstelle minimales Human Training System
    const emergencyUI = document.createElement('div');
    emergencyUI.id = 'emergency-human-training-ui';
    emergencyUI.innerHTML = `
        <div style="position: fixed; top: 100px; right: 20px; z-index: 9999; 
                    background: white; border: 2px solid #007bff; border-radius: 8px;
                    padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); width: 280px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #007bff;">🧑‍🏫 Emergency AI Training</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="border: none; background: #dc3545; color: white; border-radius: 3px; cursor: pointer;">×</button>
            </div>
            <p style="margin: 5px 0; font-size: 14px;">Emergency Human Training System aktiviert!</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
                Das vollständige AI-System konnte nicht geladen werden, aber du kannst trotzdem AI-Feedback geben.
            </p>
            <button onclick="findSyntaxError()" style="width: 100%; padding: 8px; background: #28a745; 
                    color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                🔍 Syntax-Fehler finden
            </button>
        </div>
    `;
    
    document.body.appendChild(emergencyUI);
    
    console.log('✅ Emergency Human Training UI erstellt!');
    console.log('💡 Das ist ein Minimal-System bis der Syntax-Fehler behoben ist.');
    
    return true;
}

// Global verfügbar machen
if (typeof window !== 'undefined') {
    window.findSyntaxError = findSyntaxError;
    window.emergencyEnableHumanTraining = emergencyEnableHumanTraining;
    
    // enableHumanTraining als Emergency-Fallback
    if (!window.enableHumanTraining) {
        window.enableHumanTraining = emergencyEnableHumanTraining;
        console.log('🚨 Emergency enableHumanTraining bereit!');
    }
}