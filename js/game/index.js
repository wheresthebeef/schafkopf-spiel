/**
 * Game Module Index
 * Central import/export point for all game modules
 * Provides unified access to game functionality
 */

// Import all game modules
import * as Flow from './flow.js';
import * as Bidding from './bidding.js';
import * as AI from './ai.js';
import * as Stats from './stats.js';
import * as Controls from './controls.js';

// Re-export Flow module functions
export const {
    newGame,
    playCard,
    evaluateTrick,
    endGame,
    continueAfterTrick,
    initializeGame,
    showContinueButton,
    hideContinueButton,
    exportGameData,
    importGameData
} = Flow;

// Re-export Bidding module functions
export const {
    showAceSelection,
    selectAceForCall,
    cancelAceSelection,
    getAvailableAcesForCall,
    findPartnerWithAce,
    startGameAfterAceSelection,
    showAceSelectionButtons,
    hideAceSelectionButtons,
    handleNoAceCallable
} = Bidding;

// Re-export AI module functions
export const {
    playCPUCard,
    selectCardWithAI,
    canPlayCard,
    selectLeadCard,
    selectFollowCard,
    selectSchmierCard,
    getCurrentTrickWinner,
    areTeammates,
    arePartnershipsKnown,
    getTrickPoints
} = AI;

// Re-export Stats module functions
export const {
    showStats,
    getGameStats,
    getGameLog,
    exportGameLog
} = Stats;

// Re-export Controls module functions
export const {
    showRules,
    toggleDebugMode,
    toggleCardImages,
    handleResize,
    initializeControls
} = Controls;

/**
 * Binds all functions to window for HTML compatibility
 * This ensures onclick handlers work properly
 */
export function bindWindowFunctions() {
    console.log('🔗 Binding game functions to window...');
    
    // Flow module functions
    window.newGame = newGame;
    window.playCard = playCard;
    window.continueAfterTrick = continueAfterTrick;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
    
    // Bidding module functions
    window.selectAceForCall = selectAceForCall;
    window.cancelAceSelection = cancelAceSelection;
    
    // Stats module functions
    window.showStats = showStats;
    
    // Controls module functions
    window.showRules = showRules;
    window.toggleDebugMode = toggleDebugMode;
    window.toggleCardImages = toggleCardImages;
    
    // External functions (from other modules)
    // These will be bound by their respective modules
    // window.closeModal = closeModal;
    // window.handleCardClick = handleCardClick;
    // window.handleImageError = handleImageError;
    
    console.log('✅ Window functions bound successfully');
}

/**
 * Initialize all game modules
 */
export async function initializeGameModules() {
    console.log('🚀 Initializing game modules...');
    
    try {
        // Initialize controls (keyboard shortcuts, etc.)
        initializeControls();
        
        // Bind window functions for HTML compatibility
        bindWindowFunctions();
        
        // Initialize the main game
        await initializeGame();
        
        console.log('✅ All game modules initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing game modules:', error);
        throw error;
    }
}

// Module metadata
export const MODULE_INFO = {
    version: '0.3.0',
    modules: ['flow', 'bidding', 'ai', 'stats', 'controls'],
    description: 'Modular Bayerisches Schafkopf game engine',
    dynamicImports: true,
    circularDependenciesResolved: true
};

console.log('🎮 Game modules loaded:', MODULE_INFO);

// Auto-initialize if this is the main entry point
if (typeof window !== 'undefined' && window.location) {
    // Check if we should auto-initialize
    const autoInit = !window.gameModulesInitialized;
    
    if (autoInit) {
        window.gameModulesInitialized = true;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeGameModules);
        } else {
            // DOM already loaded
            initializeGameModules();
        }
    }
}