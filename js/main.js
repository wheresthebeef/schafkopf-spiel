/**
 * Bayerisches Schafkopf - Modern ES6 Entry Point
 * Refactored Main Module for coordinating all game systems
 * Phase 2: Cards Module Integration
 */

// Development flag for refactoring phase
const REFACTORING_MODE = true;
const CURRENT_PHASE = 2;

console.log('🏗️ Schafkopf Main Module (Refactored) - Phase', CURRENT_PHASE);

/**
 * System initialization and module coordination
 */
class SchafkopfGameSystem {
    constructor() {
        this.phase = CURRENT_PHASE;
        this.legacyActive = true;
        this.modulesLoaded = new Set();
        this.moduleErrors = new Map();
        this.cardsModule = null;
        this.rulesModule = null;
        
        console.log('🎮 SchafkopfGameSystem initializing Phase', this.phase, '...');
    }
    
    /**
     * Initialize the game system
     */
    async init() {
        console.log('📦 Phase', this.phase, '- Core Module Integration');
        
        try {
            // Phase 2: Load core modules
            await this.setupPhase2();
            
            // Mark system as ready
            this.ready = true;
            console.log('✅ Main system ready for Phase 3');
            
            // Expose global for debugging
            window.schafkopfMain = this;
            
            return true;
        } catch (error) {
            console.error('❌ Main system initialization failed:', error);
            this.fallbackToLegacy();
            return false;
        }
    }
    
    /**
     * Phase 2 setup - load cards and rules modules
     */
    async setupPhase2() {
        console.log('🔧 Phase 2: Core Module Integration');
        
        // Detect browser capabilities
        this.browserCapabilities = {
            esModules: this.supportsESModules(),
            asyncAwait: this.supportsAsyncAwait(),
            classes: this.supportsClasses()
        };
        
        console.log('🔍 Browser capabilities:', this.browserCapabilities);
        
        if (!this.browserCapabilities.esModules) {
            throw new Error('ES Modules not supported - falling back to legacy');
        }
        
        // Load Cards Module
        await this.loadCardsModule();
        
        // Load Rules Module (placeholder)
        await this.loadRulesModule();
        
        // Prepare for legacy integration
        this.prepareLegacyIntegration();
        
        // Setup module loader for future phases
        this.setupModuleLoader();
        
        console.log('✅ Phase 2 setup complete');
    }
    
    /**
     * Load the new Cards module system
     */
    async loadCardsModule() {
        try {
            console.log('📦 Loading Cards module...');
            
            // Dynamic import of cards module
            this.cardsModule = await import('./cards/index.js');
            
            // Test the cards system
            const testResult = this.cardsModule.testCardSystem();
            
            if (testResult.validation.valid) {
                this.modulesLoaded.add('cards');
                console.log('✅ Cards module loaded and tested successfully');
                
                // Update legacy bridge
                window.modernSystem.bridge.cards = this.cardsModule;
                
                return true;
            } else {
                throw new Error('Cards module validation failed');
            }
            
        } catch (error) {
            console.error('❌ Failed to load Cards module:', error);
            this.moduleErrors.set('cards', error);
            throw error;
        }
    }
    
    /**
     * Load the Rules module (placeholder in Phase 2)
     */
    async loadRulesModule() {
        try {
            console.log('📦 Loading Rules module (placeholder)...');
            
            // Dynamic import of rules module
            this.rulesModule = await import('./rules/index.js');
            
            this.modulesLoaded.add('rules');
            console.log('✅ Rules module loaded (placeholder)');
            
            // Update legacy bridge
            window.modernSystem.bridge.rules = this.rulesModule;
            
            return true;
            
        } catch (error) {
            console.error('⚠️ Rules module placeholder load failed:', error);
            this.moduleErrors.set('rules', error);
            // Don't throw - rules is still placeholder
            return false;
        }
    }
    
    /**
     * Check ES modules support
     */
    supportsESModules() {
        try {
            new Function('import("data:text/javascript,export default 1")')();
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Check async/await support
     */
    supportsAsyncAwait() {
        try {
            new Function('async function test() { await 1; }');
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Check class support
     */
    supportsClasses() {
        try {
            new Function('class Test {}');
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Prepare integration with legacy system
     */
    prepareLegacyIntegration() {
        // Create bridge for legacy compatibility
        window.modernSystem = {
            phase: this.phase,
            ready: this.ready || false,
            modules: this.modulesLoaded,
            bridge: {
                // Phase 2: Cards and Rules modules
                cards: this.cardsModule,
                rules: this.rulesModule,
                // Future phases
                game: null,
                ai: null,
                ui: null
            }
        };
        
        console.log('🔗 Legacy bridge updated for Phase 2');
    }
    
    /**
     * Setup module loading infrastructure for future phases
     */
    setupModuleLoader() {
        this.moduleLoader = {
            loadOrder: [
                // Phase 2: Core modules (COMPLETE)
                'cards', 'rules',
                // Phase 3: Game engine (PLANNED)
                'game',
                // Phase 4: AI system (PLANNED)
                'ai',
                // Phase 5: UI system (PLANNED)
                'ui'
            ],
            loaded: this.modulesLoaded,
            errors: this.moduleErrors
        };
        
        console.log('📋 Module loader ready for Phase 3');
    }
    
    /**
     * Test the loaded modules
     */
    async testModules() {
        console.log('🧪 Testing loaded modules...');
        
        const results = {
            cards: false,
            rules: false
        };
        
        // Test Cards Module
        if (this.cardsModule) {
            try {
                const testResult = this.cardsModule.testCardSystem();
                results.cards = testResult.validation.valid;
                console.log('🧪 Cards test:', results.cards ? 'PASSED' : 'FAILED');
            } catch (error) {
                console.error('🧪 Cards test failed:', error);
            }
        }
        
        // Test Rules Module (placeholder)
        if (this.rulesModule) {
            try {
                this.rulesModule.placeholder_validateCardPlay();
                results.rules = true;
                console.log('🧪 Rules test: PASSED (placeholder)');
            } catch (error) {
                console.error('🧪 Rules test failed:', error);
            }
        }
        
        return results;
    }
    
    /**
     * Get Cards API for external use
     */
    getCardsAPI() {
        if (!this.cardsModule) {
            console.warn('⚠️ Cards module not loaded');
            return null;
        }
        
        return {
            createDeck: this.cardsModule.createDeck,
            shuffleDeck: this.cardsModule.shuffleDeck,
            dealCards: this.cardsModule.dealCards,
            sortCardsForDisplay: this.cardsModule.sortCardsForDisplay,
            isCardHigher: this.cardsModule.isCardHigher,
            countPoints: this.cardsModule.countPoints,
            debugCards: this.cardsModule.debugCards,
            testSystem: this.cardsModule.testCardSystem
        };
    }
    
    /**
     * Fallback to legacy system
     */
    fallbackToLegacy() {
        console.log('🔄 Falling back to legacy system');
        this.legacyActive = true;
        this.modernActive = false;
        
        // Ensure legacy compatibility
        window.modernSystem.fallback = true;
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            phase: this.phase,
            ready: this.ready || false,
            legacyActive: this.legacyActive,
            modernActive: this.modernActive || false,
            modulesLoaded: Array.from(this.modulesLoaded),
            moduleErrors: Object.fromEntries(this.moduleErrors),
            capabilities: this.browserCapabilities,
            cardsLoaded: !!this.cardsModule,
            rulesLoaded: !!this.rulesModule
        };
    }
}

/**
 * Initialize the modern system
 */
async function initializeModernSystem() {
    const system = new SchafkopfGameSystem();
    const success = await system.init();
    
    if (success) {
        console.log('🎯 Modern system initialized successfully');
        console.log('📊 Status:', system.getStatus());
        
        // Run module tests
        const testResults = await system.testModules();
        console.log('🧪 Module tests:', testResults);
        
        // Expose Cards API globally for debugging
        window.CardsAPI = system.getCardsAPI();
        
    } else {
        console.log('⚠️ Modern system failed, using legacy');
    }
    
    return system;
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
    // Browser environment
    window.initializeModernSystem = initializeModernSystem;
    
    // Auto-init after DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModernSystem);
    } else {
        // DOM already loaded
        setTimeout(initializeModernSystem, 100);
    }
} else {
    // Node.js environment (for testing)
    module.exports = { SchafkopfGameSystem, initializeModernSystem };
}

console.log('📋 main.js Phase 2 loaded - cards integration ready');
