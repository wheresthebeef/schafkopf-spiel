/**
 * Community Training System - Clean Start Utility
 * Löscht alle lokalen Trainingsdaten für einen sauberen Neustart
 */

console.log('🧹 Clean Start Utility geladen');

// Funktion für kompletten Reset
window.cleanStartCommunityTraining = function() {
    console.log('🧹 Starte kompletten Reset der Community Training Daten...');
    
    let cleanedItems = [];
    
    // 1. Training Reviews löschen
    if (localStorage.getItem('training_reviews')) {
        const reviewCount = JSON.parse(localStorage.getItem('training_reviews') || '[]').length;
        localStorage.removeItem('training_reviews');
        cleanedItems.push(`${reviewCount} Training Reviews`);
    }
    
    // 2. Q-Learning Bridge Stats löschen
    if (localStorage.getItem('qlearning_bridge_stats')) {
        localStorage.removeItem('qlearning_bridge_stats');
        cleanedItems.push('Q-Learning Bridge Statistiken');
    }
    
    // 3. Q-Learning Bot Daten löschen
    const botNames = ['Anna', 'Hans', 'Sepp'];
    botNames.forEach(name => {
        const key = `qlearning_bot_${name}`;
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            cleanedItems.push(`Q-Learning Bot ${name}`);
        }
    });
    
    // 4. Weitere Training-bezogene Daten suchen und löschen
    const trainingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.includes('training') || 
            key.includes('qlearning') || 
            key.includes('community') ||
            key.includes('review') ||
            key.includes('bot_')
        )) {
            trainingKeys.push(key);
        }
    }
    
    trainingKeys.forEach(key => {
        localStorage.removeItem(key);
        if (!cleanedItems.some(item => item.includes(key))) {
            cleanedItems.push(`Weitere Daten: ${key}`);
        }
    });
    
    // 5. Q-Learning Bridge zurücksetzen falls verfügbar
    if (window.qLearningBridge) {
        window.qLearningBridge.resetLearning();
        cleanedItems.push('Q-Learning Bridge Memory');
    }
    
    // 6. Post-Game Training zurücksetzen falls verfügbar
    if (window.postGameTraining) {
        window.postGameTraining.currentRoundMoves = [];
        window.postGameTraining.isTrackingRound = false;
        cleanedItems.push('Post-Game Training Memory');
    }
    
    // Ergebnis anzeigen
    console.log('✅ Clean Start abgeschlossen!');
    console.log('🗑️ Gelöschte Daten:', cleanedItems);
    
    if (cleanedItems.length > 0) {
        alert(`🧹 Clean Start erfolgreich!\n\nGelöschte Daten:\n${cleanedItems.map(item => `• ${item}`).join('\n')}\n\nDas Community Training System startet jetzt sauber.`);
    } else {
        alert('✨ Keine alten Daten gefunden - System ist bereits sauber!');
    }
    
    // Dashboard neu laden falls verfügbar
    if (window.location.href.includes('training-progress-community.html')) {
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    return {
        success: true,
        cleanedItems: cleanedItems.length,
        details: cleanedItems
    };
};

// Funktion um aktuelle lokale Daten anzuzeigen
window.showLocalTrainingData = function() {
    console.log('📊 Aktuelle lokale Training-Daten:');
    
    const data = {};
    
    // Training Reviews
    const reviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
    data.trainingReviews = reviews.length;
    console.log(`📝 Training Reviews: ${reviews.length}`);
    
    // Q-Learning Stats
    const qStats = localStorage.getItem('qlearning_bridge_stats');
    if (qStats) {
        const parsed = JSON.parse(qStats);
        data.qLearningStats = parsed;
        console.log('🧠 Q-Learning Stats:', parsed);
    }
    
    // Bot Daten
    const botNames = ['Anna', 'Hans', 'Sepp'];
    data.botData = {};
    botNames.forEach(name => {
        const botData = localStorage.getItem(`qlearning_bot_${name}`);
        if (botData) {
            data.botData[name] = JSON.parse(botData);
            console.log(`🤖 Bot ${name}:`, JSON.parse(botData));
        }
    });
    
    // Alle Training-bezogenen Keys
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.includes('training') || 
            key.includes('qlearning') || 
            key.includes('community') ||
            key.includes('review') ||
            key.includes('bot_')
        )) {
            allKeys.push(key);
        }
    }
    data.allTrainingKeys = allKeys;
    console.log('🔑 Alle Training-Keys:', allKeys);
    
    return data;
};

// Auto-Export für Debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cleanStartCommunityTraining: window.cleanStartCommunityTraining,
        showLocalTrainingData: window.showLocalTrainingData
    };
}

console.log('✨ Clean Start Utility bereit!');
console.log('🧹 Verwende: cleanStartCommunityTraining() für kompletten Reset');
console.log('📊 Verwende: showLocalTrainingData() um aktuelle Daten zu sehen');
