/**
 * AI System Debug Helper
 * Hilft beim Debugging von AI-Loading Problemen
 */

/**
 * Prüft den Status aller AI-Funktionen
 */
function checkAIFunctions() {
    console.log('🔍 AI-System Diagnose:');
    console.log('');
    
    const functions = [
        'runAITests',
        'aiQuickTest', 
        'aiPerformanceBenchmark',
        'aiDebug',
        'aiStats',
        'enableHumanTraining',
        'disableHumanTraining',
        'getHumanFeedbackStats',
        'migrateToNewAI',
        'enableABTesting'
    ];
    
    const status = {};
    let available = 0;
    
    functions.forEach(func => {
        const isAvailable = typeof window[func] === 'function';
        status[func] = isAvailable;
        if (isAvailable) available++;
        
        console.log(`   ${isAvailable ? '✅' : '❌'} ${func}()`);
    });
    
    console.log('');
    console.log(`📊 Status: ${available}/${functions.length} Funktionen verfügbar`);
    
    if (available === functions.length) {
        console.log('🎯 AI-System vollständig geladen!');
    } else if (available > 0) {
        console.log('⚠️ AI-System teilweise geladen');
        console.log('💡 Versuche: reloadAISystem()');
    } else {
        console.log('❌ AI-System nicht geladen');
        console.log('💡 Versuche: loadAISystem()');
    }
    
    return status;
}

/**
 * Versucht AI-System manuell zu laden
 */
async function forceLoadAI() {
    console.log('🔧 Versuche AI-System manuell zu laden...');
    
    try {
        if (window.loadAISystem) {
            const success = await window.loadAISystem();
            if (success) {
                console.log('✅ AI-System erfolgreich geladen!');
                checkAIFunctions();
            } else {
                console.log('❌ AI-System konnte nicht geladen werden');
            }
        } else {
            console.log('❌ loadAISystem() nicht verfügbar');
            console.log('💡 Versuche Seite neu zu laden');
        }
    } catch (error) {
        console.error('❌ Fehler beim manuellen Laden:', error);
    }
}

/**
 * Quick-Fix für enableHumanTraining
 */
function quickFixHumanTraining() {
    console.log('🔧 Quick-Fix für enableHumanTraining...');
    
    try {
        // Direkt aus dem Module laden
        import('./human-feedback.js').then(module => {
            window.humanFeedback = module.humanFeedback;
            window.enableHumanTraining = () => module.humanFeedback.enable();
            window.disableHumanTraining = () => module.humanFeedback.disable();
            window.getHumanFeedbackStats = () => module.humanFeedback.getFeedbackStats();
            
            console.log('✅ Human Training Quick-Fix erfolgreich!');
            console.log('💡 enableHumanTraining() sollte jetzt funktionieren');
        }).catch(error => {
            console.error('❌ Quick-Fix fehlgeschlagen:', error);
        });
    } catch (error) {
        console.error('❌ Quick-Fix Fehler:', error);
    }
}

// Global verfügbar machen
if (typeof window !== 'undefined') {
    window.checkAIFunctions = checkAIFunctions;
    window.forceLoadAI = forceLoadAI;
    window.quickFixHumanTraining = quickFixHumanTraining;
    
    // Auto-check nach 5 Sekunden
    setTimeout(() => {
        if (typeof window.enableHumanTraining !== 'function') {
            console.log('⚠️ enableHumanTraining nicht verfügbar');
            console.log('💡 Versuche: checkAIFunctions() oder quickFixHumanTraining()');
        }
    }, 5000);
}