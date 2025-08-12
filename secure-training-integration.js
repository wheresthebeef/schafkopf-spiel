// secure-training-integration.js - Secure integration with comprehensive monitoring
class SecureTrainingIntegration {
    constructor() {
        this.secureDB = null;
        this.isSecureEnabled = false;
        this.syncMode = 'secure';
        this.monitoringEnabled = true;
        
        // Security monitoring
        this.securityAlerts = [];
        this.performanceMetrics = {
            reviewsSubmitted: 0,
            reviewsAccepted: 0,
            reviewsRejected: 0,
            averageResponseTime: 0,
            lastSyncTime: null
        };
        
        this.initializeSecureSystem();
    }

    async initializeSecureSystem() {
        console.log('🛡️ Initializing Secure Training System...');
        
        // Initialize secure GitHub database
        this.secureDB = new SecureGitHubDatabase();
        
        // Try to get GitHub token
        const token = this.getGitHubToken();
        if (token) {
            const connected = await this.secureDB.init(token);
            this.isSecureEnabled = connected;
            
            if (connected) {
                console.log('✅ Secure GitHub integration enabled');
            }
        }
        
        this.setupSecureEventListeners();
    }

    getGitHubToken() {
        // Browser-safe token retrieval - no process dependency
        return localStorage.getItem('github_token') || null;
    }

    setupSecureEventListeners() {
        window.addEventListener('trainingReview', (event) => {
            this.handleSecureTrainingReview(event.detail);
        });
    }

    async handleSecureTrainingReview(reviewData) {
        console.log('🛡️ Processing secure training review:', reviewData);
        
        // Always save locally first
        this.saveLocalReview(reviewData);
        this.performanceMetrics.reviewsSubmitted++;
        
        // Try to save to GitHub if available
        if (this.isSecureEnabled && this.syncMode !== 'local') {
            try {
                const result = await this.secureDB.addTrainingReview(reviewData);
                if (result.success) {
                    this.performanceMetrics.reviewsAccepted++;
                    this.performanceMetrics.lastSyncTime = new Date().toISOString();
                    console.log('✅ Review saved to secure GitHub database');
                } else {
                    this.performanceMetrics.reviewsRejected++;
                    console.log('⏳ Review queued for sync:', result.reason);
                }
            } catch (error) {
                this.performanceMetrics.reviewsRejected++;
                console.error('GitHub sync failed:', error);
            }
        } else {
            console.log('📱 Review saved locally - will sync when GitHub is available');
        }
    }

    saveLocalReview(reviewData) {
        const existingReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
        existingReviews.push({
            ...reviewData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            source: 'secure'
        });
        localStorage.setItem('training_reviews', JSON.stringify(existingReviews));
    }

    getLocalStats() {
        const reviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
        const positiveReviews = reviews.filter(r => r.rating === 'good').length;
        
        return {
            totalReviews: reviews.length,
            positiveRate: reviews.length > 0 ? (positiveReviews / reviews.length * 100).toFixed(1) : 0,
            lastReview: reviews.length > 0 ? reviews[reviews.length - 1].timestamp : null
        };
    }

    calculateAcceptanceRate() {
        const total = this.performanceMetrics.reviewsAccepted + this.performanceMetrics.reviewsRejected;
        return total > 0 ? 
            (this.performanceMetrics.reviewsAccepted / total * 100).toFixed(1) : 100;
    }

    // NEW: Generate simulated global stats based on local data and realistic multipliers
    generateSimulatedGlobalStats() {
        const localStats = this.getLocalStats();
        
        // Simulate realistic global multipliers
        const playerMultiplier = Math.floor(Math.random() * 50) + 20; // 20-70 other players
        const reviewsMultiplier = Math.floor(Math.random() * 100) + 50; // 50-150x local reviews
        
        const simulatedGlobal = {
            totalReviews: Math.max(localStats.totalReviews * reviewsMultiplier, localStats.totalReviews + 500),
            totalPlayers: Math.max(playerMultiplier, 25),
            averagePositiveRate: Math.max(
                parseFloat(localStats.positiveRate) + (Math.random() * 10 - 5), // ±5% variance
                40 // minimum realistic positive rate
            ).toFixed(1),
            lastUpdated: new Date().toISOString(),
            dataSource: 'simulated' // Mark as simulated
        };
        
        return simulatedGlobal;
    }

    async getCombinedSecureStats() {
        const localStats = this.getLocalStats();
        let globalStats = null;
        let securityStats = null;
        
        if (this.isSecureEnabled) {
            try {
                globalStats = await this.secureDB.getGlobalStats();
                securityStats = this.secureDB.getSecurityStats();
            } catch (error) {
                console.error('Failed to get global stats:', error);
                // Fallback to simulated stats
                globalStats = this.generateSimulatedGlobalStats();
            }
        } else {
            // Generate simulated global stats when not connected to GitHub
            globalStats = this.generateSimulatedGlobalStats();
            console.log('📊 Using simulated global stats (GitHub not connected)');
        }
        
        return {
            local: localStats,
            global: globalStats,
            security: securityStats,
            performance: this.performanceMetrics,
            combined: globalStats ? this.combineSecureStats(localStats, globalStats) : null
        };
    }

    combineSecureStats(local, global) {
        return {
            localContribution: local.totalReviews,
            globalTotal: global.totalReviews,
            contributionPercentage: global.totalReviews > 0 ? 
                (local.totalReviews / global.totalReviews * 100).toFixed(2) : 0,
            globalPositiveRate: global.averagePositiveRate,
            totalPlayers: global.totalPlayers,
            acceptanceRate: this.calculateAcceptanceRate(),
            dataSource: global.dataSource || 'github'
        };
    }

    async enableSecureIntegration(token) {
        if (token) {
            localStorage.setItem('github_token', token);
            const connected = await this.secureDB.init(token);
            this.isSecureEnabled = connected;
            
            if (connected) {
                await this.syncLocalToSecure();
            }
            
            return connected;
        }
        return false;
    }

    disableSecureIntegration() {
        this.isSecureEnabled = false;
        localStorage.removeItem('github_token');
    }

    async syncLocalToSecure() {
        if (!this.isSecureEnabled) return;
        
        const localReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
        const unsyncedReviews = localReviews.filter(review => !review.secureSynced);
        
        if (unsyncedReviews.length === 0) return;
        
        console.log(`🔄 Syncing ${unsyncedReviews.length} local reviews to secure database...`);
        
        let syncedCount = 0;
        for (const review of unsyncedReviews) {
            try {
                const result = await this.secureDB.addTrainingReview(review);
                if (result.success) {
                    review.secureSynced = true;
                    syncedCount++;
                }
            } catch (error) {
                console.error('Failed to sync review:', error);
                break;
            }
        }
        
        localStorage.setItem('training_reviews', JSON.stringify(localReviews));
        
        if (syncedCount > 0) {
            console.log(`✅ ${syncedCount} reviews synced to secure database`);
        }
    }

    getSecureStatus() {
        if (!this.secureDB) return { status: 'disabled', message: 'Secure system not initialized' };
        if (!this.isSecureEnabled) return { status: 'no-token', message: 'GitHub token not configured' };
        return { status: 'online', message: 'Secure GitHub database connected' };
    }

    // Enhanced getGlobalStatsDisplay method for dashboard
    async getGlobalStatsDisplay() {
        const stats = await this.getCombinedSecureStats();
        
        if (stats.global) {
            const isSimulated = stats.global.dataSource === 'simulated';
            
            return {
                totalReviews: stats.global.totalReviews,
                totalPlayers: stats.global.totalPlayers,
                averagePositiveRate: stats.global.averagePositiveRate,
                lastUpdated: stats.global.lastUpdated,
                isSimulated: isSimulated,
                statusMessage: isSimulated ? 
                    'Simulierte Daten (GitHub nicht verbunden)' : 
                    'Live GitHub Daten',
                statusClass: isSimulated ? 'warning' : 'success'
            };
        }
        
        return {
            totalReviews: 0,
            totalPlayers: 0,
            averagePositiveRate: 0,
            lastUpdated: null,
            isSimulated: false,
            statusMessage: 'Keine Daten verfügbar',
            statusClass: 'error'
        };
    }

    // Public API methods for compatibility
    async performSecurityCheck() {
        if (!this.isSecureEnabled || !this.secureDB) return;
        
        try {
            const securityStats = this.secureDB.getSecurityStats();
            console.log('🛡️ Security check completed:', securityStats);
            return securityStats;
        } catch (error) {
            console.error('Security check failed:', error);
            return null;
        }
    }

    async getBotInsights(botName) {
        if (!this.isSecureEnabled) return null;
        
        try {
            // Simple bot insights from local data
            const reviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
            const botReviews = reviews.filter(r => r.botName === botName);
            
            if (botReviews.length === 0) {
                return { totalReviews: 0, positiveRate: 0, commonMistakes: [] };
            }

            const positiveReviews = botReviews.filter(r => r.rating === 'good').length;
            const positiveRate = (positiveReviews / botReviews.length * 100).toFixed(1);
            
            return {
                totalReviews: botReviews.length,
                positiveRate: parseFloat(positiveRate),
                commonMistakes: []
            };
        } catch (error) {
            console.error('Failed to get bot insights:', error);
            return null;
        }
    }

    async getCommunityInsights() {
        if (!this.isSecureEnabled) return null;
        
        try {
            const localReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
            const recentReviews = localReviews.slice(-5).reverse();
            
            // Simple bot performance analysis from local data
            const botPerformance = {};
            localReviews.forEach(review => {
                if (!botPerformance[review.botName]) {
                    botPerformance[review.botName] = { good: 0, bad: 0 };
                }
                if (review.rating === 'good' || review.rating === 'bad') {
                    botPerformance[review.botName][review.rating]++;
                }
            });
            
            return {
                recentReviews: recentReviews,
                botTrends: Object.entries(botPerformance).map(([name, stats]) => ({
                    name,
                    total: stats.good + stats.bad,
                    positiveRate: stats.good + stats.bad > 0 ? 
                        ((stats.good / (stats.good + stats.bad)) * 100).toFixed(1) : '0'
                }))
            };
        } catch (error) {
            console.error('Failed to get community insights:', error);
            return null;
        }
    }
}

// Initialize the secure training system
window.secureTrainingIntegration = new SecureTrainingIntegration();

// Enhanced review submission function
window.submitSecureTrainingReview = function(reviewData) {
    console.log('📝 Submitting secure review:', reviewData);
    
    // Dispatch to secure integration system
    window.dispatchEvent(new CustomEvent('trainingReview', {
        detail: reviewData
    }));
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureTrainingIntegration;
}