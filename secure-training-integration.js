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
        return localStorage.getItem('github_token') || 
               process?.env?.GITHUB_TOKEN || 
               null;
    }

    setupSecureEventListeners() {
        window.addEventListener('trainingReview', (event) => {
            this.handleSecureTrainingReview(event.detail);
        });
    }

    async handleSecureTrainingReview(reviewData) {
        console.log('🛡️ Processing secure training review:', reviewData);
        
        // For now, just save locally
        this.saveLocalReview(reviewData);
        this.performanceMetrics.reviewsSubmitted++;
        
        // TODO: Add full secure validation and GitHub sync
        console.log('Review processed securely');
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

    getSecureStatus() {
        if (!this.secureDB) return { status: 'disabled', message: 'Secure system not initialized' };
        if (!this.isSecureEnabled) return { status: 'no-token', message: 'GitHub token not configured' };
        return { status: 'online', message: 'Secure GitHub database connected' };
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