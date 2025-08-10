/**
 * Bayerisches Schafkopf - Modern ES6 Entry Point
 * Refactored Main Module for coordinating all game systems
 */

// Development flag for refactoring phase
const REFACTORING_MODE = true;
const CURRENT_PHASE = 1;

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
        
        console.log('🎮 SchafkopfGameSystem initializing...');
    }
    
    /**
     * Initialize the game system
     */
    async init() {
        console.log('📦 Phase', this.phase, '- System Setup');
        
        try {
            // Phase 1: Preparation only
            await this.setupPhase1();
            
            // Mark system as ready
            this.ready = true;
            console.log('✅ Main system ready for Phase 2');
            
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
     * Phase 1 setup - prepare for future module loading
     */
    async setupPhase1() {
        console.log('🔧 Phase 1: Setup & Structure');
        
        // Detect browser capabilities
        this.browserCapabilities = {
            esModules: this.supportsESModules(),
            asyncAwait: this.supportsAsyncAwait(),
            classes: this.supportsClasses()
        };
        
        console.log('🔍 Browser capabilities:', this.browserCapabilities);
        
        // Prepare for legacy integration
        this.prepareLegacyIntegration();
        
        // Setup module loading infrastructure
        this.setupModuleLoader();
        
        console.log('✅ Phase 1 setup complete');
    }
    
    /**
     * Check ES modules support
     */
    supportsESModules() {
        try {
            new Function('import("data:text/javascript,export default 1")');
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
            ready: false,
            modules: new Set(),
            bridge: {
                // Will be populated in future phases
                game: null,
                cards: null,
                rules: null,
                ai: null,
                ui: null
            }
        };
        
        console.log('🔗 Legacy bridge prepared');
    }
    
    /**
     * Setup module loading infrastructure
     */
    setupModuleLoader() {
        this.moduleLoader = {
            loadOrder: [
                // Phase 2: Core modules
                'cards', 'rules',
                // Phase 3: Game engine
                'game',
                // Phase 4: AI system
                'ai',
                // Phase 5: UI system
                'ui'
            ],
            loaded: new Set(),
            errors: new Map()
        };
        
        console.log('📋 Module loader ready for Phase 2');
    }
    
    /**
     * Future method: Load a specific module
     */
    async loadModule(moduleName) {
        console.log(`📦 [Future] Loading module: ${moduleName}`);
        // Implementation will be added in Phase 2
        return Promise.resolve({ name: moduleName, loaded: false, phase: 'future' });
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
            capabilities: this.browserCapabilities
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

console.log('📋 main.js loaded - waiting for DOM ready');
