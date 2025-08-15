// Enhanced Community Database System - SHA-Conflict Resolver
// Replaces the simulated stats with real GitHub-based community data

class CommunityDatabaseSystem {
    constructor() {
        this.githubDB = null;
        this.isEnabled = false;
        this.autoSyncInterval = null;
        this.pendingUploads = [];
        
        // Community tracking
        this.contributionStats = {
            sessionsUploaded: 0,
            reviewsContributed: 0,
            lastContribution: null
        };
        
        this.initializeSystem();
    }

    async initializeSystem() {
        console.log('🌍 Initializing Community Database System...');
        
        // Check for existing GitHub integration
        const token = this.getStoredToken();
        if (token) {
            await this.connectToGitHub(token);
        }
        
        // Load contribution history
        this.loadContributionStats();
        
        // Setup auto-sync for pending reviews
        this.setupAutoSync();
        
        // Listen for new reviews
        this.setupReviewListener();
    }

    getStoredToken() {
        return localStorage.getItem('github_token') || 
               localStorage.getItem('schafkopf_github_token');
    }

    async connectToGitHub(token) {
        try {
            if (window.SecureGitHubDB) {
                this.githubDB = new window.SecureGitHubDB();
                const connected = await this.githubDB.init(token);
                
                if (connected) {
                    this.isEnabled = true;
                    console.log('✅ Community Database connected to GitHub');
                    
                    // Auto-upload any pending local reviews
                    await this.uploadPendingReviews();
                    
                    return true;
                } else {
                    console.warn('⚠️ GitHub connection failed');
                    return false;
                }
            } else {
                console.warn('⚠️ SecureGitHubDB not available');
                return false;
            }
        } catch (error) {
            console.error('❌ GitHub connection error:', error);
            return false;
        }
    }

    setupReviewListener() {
        // Listen for training reviews from the game
        window.addEventListener('trainingReview', async (event) => {
            await this.handleNewReview(event.detail);
        });
        
        // Also listen for direct submission calls
        if (window.submitSecureTrainingReview) {
            const originalSubmit = window.submitSecureTrainingReview;
            window.submitSecureTrainingReview = async (reviewData) => {
                originalSubmit(reviewData);
                await this.handleNewReview(reviewData);
            };
        }
    }

    async handleNewReview(reviewData) {
        console.log('🌍 Community: Processing new review for upload:', reviewData);
        
        // Always save locally first
        this.saveLocalReview(reviewData);
        
        // Try to upload to community database
        if (this.isEnabled && this.githubDB) {
            try {
                const uploadResult = await this.uploadReviewToCommunity(reviewData);
                if (uploadResult.success) {
                    console.log('✅ Review uploaded to community database');
                    this.contributionStats.reviewsContributed++;
                    this.contributionStats.lastContribution = new Date().toISOString();
                    this.saveContributionStats();
                } else {
                    console.log('⏳ Review queued for later upload');
                    this.addToPendingUploads(reviewData);
                }
            } catch (error) {
                console.error('Failed to upload review:', error);
                this.addToPendingUploads(reviewData);
            }
        } else {
            console.log('📱 Review saved locally - will upload when connected');
            this.addToPendingUploads(reviewData);
        }
    }

    async uploadReviewToCommunity(reviewData) {
        console.log('📤 Starting upload for review:', reviewData.botName, reviewData.rating);
        
        if (!this.githubDB) {
            console.error('❌ Upload failed: No GitHub connection');
            return { success: false, reason: 'No GitHub connection' };
        }

        try {
            // Enhance review data with community metadata
            const communityReview = {
                ...reviewData,
                communityId: this.generateCommunityId(),
                uploadedAt: new Date().toISOString(),
                playerSession: this.getPlayerSessionId(),
                version: '1.0'
            };

            console.log('📋 Prepared community review data:', communityReview);
            
            const result = await this.githubDB.addTrainingReview(communityReview);
            
            console.log('📊 GitHub upload result:', result);
            
            if (result.success) {
                console.log('✅ Review successfully uploaded to GitHub');
            } else {
                console.error('❌ GitHub upload failed:', result.reason);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Exception during upload:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            return { success: false, reason: error.message };
        }
    }

    saveLocalReview(reviewData) {
        const existingReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
        const enhancedReview = {
            ...reviewData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            source: 'local',
            communityPending: !this.isEnabled // Mark if pending community upload
        };
        
        existingReviews.push(enhancedReview);
        localStorage.setItem('training_reviews', JSON.stringify(existingReviews));
    }

    addToPendingUploads(reviewData) {
        this.pendingUploads.push({
            ...reviewData,
            queuedAt: new Date().toISOString()
        });
        
        // Persist pending uploads
        localStorage.setItem('community_pending_uploads', 
                           JSON.stringify(this.pendingUploads));
        console.log(`📥 Added to pending uploads queue. Total pending: ${this.pendingUploads.length}`);
    }

    // FIXED: SHA-Conflict Resolver - Upload reviews with fresh SHA
    async uploadPendingReviews() {
        console.log('🔄 uploadPendingReviews() called');
        
        if (!this.isEnabled) {
            console.log('❌ Upload aborted: Community integration not enabled');
            return;
        }
        
        if (this.pendingUploads.length === 0) {
            console.log('ℹ️ No pending uploads to process');
            return;
        }

        console.log(`🔄 Uploading ${this.pendingUploads.length} pending reviews to community...`);
        
        let uploadedCount = 0;
        const failedUploads = [];

        // FIXED: Process reviews sequentially with SHA refresh
        for (let i = 0; i < this.pendingUploads.length; i++) {
            const review = this.pendingUploads[i];
            console.log(`📤 Processing review ${i + 1}/${this.pendingUploads.length}:`, review.botName, review.rating);
            
            try {
                // FIXED: For each review, let GitHub handle SHA internally
                const result = await this.uploadReviewToCommunityWithRetry(review);
                console.log(`📊 Upload result for review ${i + 1}:`, result);
                
                if (result.success) {
                    uploadedCount++;
                    console.log(`✅ Review ${i + 1} uploaded successfully`);
                    
                    // Small delay to prevent GitHub rate limiting stress
                    if (i < this.pendingUploads.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } else {
                    console.error(`❌ Review ${i + 1} upload failed:`, result.reason);
                    failedUploads.push(review);
                }
            } catch (error) {
                console.error(`❌ Exception during review ${i + 1} upload:`, error);
                failedUploads.push(review);
            }
        }

        console.log(`📊 Upload summary: ${uploadedCount} successful, ${failedUploads.length} failed`);

        this.pendingUploads = failedUploads;
        localStorage.setItem('community_pending_uploads', 
                           JSON.stringify(this.pendingUploads));

        if (uploadedCount > 0) {
            console.log(`✅ Successfully uploaded ${uploadedCount} reviews to community`);
            this.contributionStats.sessionsUploaded++;
            this.contributionStats.reviewsContributed += uploadedCount;
            this.contributionStats.lastContribution = new Date().toISOString();
            this.saveContributionStats();
        } else {
            console.warn('⚠️ No reviews were successfully uploaded');
        }
    }

    // FIXED: Retry mechanism for SHA conflicts
    async uploadReviewToCommunityWithRetry(reviewData, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`📤 Upload attempt ${attempt}/${maxRetries} for review:`, reviewData.botName);
            
            const result = await this.uploadReviewToCommunity(reviewData);
            
            if (result.success) {
                return result;
            }
            
            // Check if it's a SHA conflict (409 error)
            if (result.reason && result.reason.includes('409') && attempt < maxRetries) {
                console.log(`🔄 SHA conflict detected, retrying in 1 second (attempt ${attempt}/${maxRetries})`);
                
                // Wait a bit for GitHub to settle
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Clear cache to force fresh SHA fetch
                if (this.githubDB && this.githubDB.cache) {
                    this.githubDB.cache.delete('file:training-data/reviews.json');
                }
                
                continue;
            }
            
            // If not a SHA conflict or max retries reached, return the error
            return result;
        }
        
        return { 
            success: false, 
            reason: `Failed after ${maxRetries} attempts with SHA conflicts` 
        };
    }

    setupAutoSync() {
        // Auto-sync every 5 minutes
        this.autoSyncInterval = setInterval(async () => {
            if (this.isEnabled && this.pendingUploads.length > 0) {
                console.log('⏰ Auto-sync triggered');
                await this.uploadPendingReviews();
            }
        }, 5 * 60 * 1000);
    }

    // CORE: Get REAL community stats instead of simulated - FIXED VERSION
    async getRealCommunityStats() {
        try {
            console.log('🌍 Fetching REAL community stats from GitHub...');
            
            if (!this.isEnabled || !this.githubDB) {
                console.log('⚠️ No GitHub connection - using enhanced local simulation');
                return this.generateEnhancedLocalStats();
            }

            // Get actual global stats from GitHub
            const globalStats = await this.githubDB.getGlobalStats();
            console.log('📊 Real GitHub stats received:', globalStats);

            // FIXED: Check if we actually have real data in GitHub
            if (globalStats && globalStats.totalReviews >= 0) {
                // Even if totalReviews is 0, it's still real GitHub data
                return {
                    totalReviews: globalStats.totalReviews,
                    totalPlayers: globalStats.totalPlayers,
                    averagePositiveRate: globalStats.averagePositiveRate,
                    lastUpdated: globalStats.lastUpdated,
                    dataSource: 'real_github',
                    isReal: true  // ALWAYS true if we get data from GitHub
                };
            } else {
                console.log('⚠️ Failed to get GitHub stats - using enhanced local simulation');
                return this.generateEnhancedLocalStats();
            }
            
        } catch (error) {
            console.error('❌ Failed to get real community stats:', error);
            return this.generateEnhancedLocalStats();
        }
    }

    generateEnhancedLocalStats() {
        const localStats = this.getLocalStats();
        
        // Create realistic community simulation based on local data
        const baseMultiplier = Math.max(localStats.totalReviews, 1);
        const communityMultiplier = 25 + Math.floor(Math.random() * 40); // 25-65 players
        
        return {
            totalReviews: Math.max(
                baseMultiplier * communityMultiplier,
                1200 + Math.floor(Math.random() * 1800) // 1200-3000 base
            ),
            totalPlayers: communityMultiplier,
            averagePositiveRate: Math.max(
                parseFloat(localStats.positiveRate) + (Math.random() * 10 - 5), // ±5% variance
                50 // minimum 50%
            ).toFixed(1),
            lastUpdated: new Date().toISOString(),
            dataSource: 'enhanced_simulation',
            isReal: false  // CLEARLY marked as simulation
        };
    }

    getLocalStats() {
        const reviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
        const positiveReviews = reviews.filter(r => r.rating === 'good').length;
        
        return {
            totalReviews: reviews.length,
            positiveRate: reviews.length > 0 ? 
                (positiveReviews / reviews.length * 100).toFixed(1) : 65.0,
            lastReview: reviews.length > 0 ? 
                reviews[reviews.length - 1].timestamp : null
        };
    }

    loadContributionStats() {
        const saved = localStorage.getItem('community_contribution_stats');
        if (saved) {
            this.contributionStats = JSON.parse(saved);
        }
        
        // Load pending uploads
        const pending = localStorage.getItem('community_pending_uploads');
        if (pending) {
            this.pendingUploads = JSON.parse(pending);
            console.log(`📂 Loaded ${this.pendingUploads.length} pending uploads from storage`);
        }
    }

    saveContributionStats() {
        localStorage.setItem('community_contribution_stats', 
                           JSON.stringify(this.contributionStats));
    }

    generateCommunityId() {
        return 'comm_' + Date.now().toString(36) + '_' + 
               Math.random().toString(36).substring(2, 8);
    }

    getPlayerSessionId() {
        let sessionId = localStorage.getItem('schafkopf_session_id');
        if (!sessionId) {
            sessionId = 'player_' + Date.now().toString(36) + '_' + 
                       Math.random().toString(36).substring(2, 8);
            localStorage.setItem('schafkopf_session_id', sessionId);
        }
        return sessionId;
    }

    // Public API for dashboard integration
    async getCommunityDashboardData() {
        const [communityStats, localStats] = await Promise.all([
            this.getRealCommunityStats(),
            Promise.resolve(this.getLocalStats())
        ]);

        return {
            community: communityStats,
            local: localStats,
            contribution: this.contributionStats,
            connection: {
                isConnected: this.isEnabled,
                pendingUploads: this.pendingUploads.length,
                status: this.getConnectionStatus()
            }
        };
    }

    getConnectionStatus() {
        if (!this.isEnabled) {
            return { 
                status: 'disconnected', 
                message: 'Nicht mit GitHub verbunden',
                action: 'Token konfigurieren'
            };
        }
        
        if (this.pendingUploads.length > 0) {
            return { 
                status: 'syncing', 
                message: `${this.pendingUploads.length} Reviews in der Warteschlange`,
                action: 'Synchronisierung läuft'
            };
        }
        
        return { 
            status: 'connected', 
            message: 'Vollständig synchronisiert',
            action: 'Aktiv'
        };
    }

    // Setup methods for dashboard
    async enableCommunityIntegration(token) {
        localStorage.setItem('github_token', token);
        localStorage.setItem('schafkopf_github_token', token);
        
        const connected = await this.connectToGitHub(token);
        
        if (connected) {
            // Upload all existing local reviews
            const localReviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
            console.log(`📋 Adding ${localReviews.length} local reviews to pending uploads`);
            this.pendingUploads = [...localReviews, ...this.pendingUploads];
            await this.uploadPendingReviews();
        }
        
        return connected;
    }

    disableCommunityIntegration() {
        this.isEnabled = false;
        this.githubDB = null;
        localStorage.removeItem('github_token');
        localStorage.removeItem('schafkopf_github_token');
        
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
    }

    // Testing and diagnostics
    async testConnection() {
        console.log('🧪 Testing GitHub connection...');
        
        if (!this.githubDB) {
            console.log('❌ No GitHub database instance');
            return { success: false, message: 'Keine GitHub-Verbindung verfügbar' };
        }
        
        try {
            const result = await this.githubDB.testConnection();
            console.log('🧪 GitHub test connection result:', result);
            
            if (result) {
                // Test if we can actually read the community data
                const stats = await this.githubDB.getGlobalStats();
                console.log('🧪 Test: Community stats from GitHub:', stats);
                return { 
                    success: true, 
                    message: `Verbindung erfolgreich! ${stats.totalReviews} Reviews in Community-DB` 
                };
            } else {
                return { success: false, message: 'Verbindungstest fehlgeschlagen' };
            }
        } catch (error) {
            console.error('❌ Test connection error:', error);
            return { success: false, message: error.message };
        }
    }
}

// Initialize the community database system
window.communityDB = new CommunityDatabaseSystem();

// Enhanced global functions for better integration
window.getCommunityStats = async function() {
    return await window.communityDB.getCommunityDashboardData();
};

window.setupCommunityIntegration = async function(token) {
    return await window.communityDB.enableCommunityIntegration(token);
};

window.testCommunityConnection = async function() {
    return await window.communityDB.testConnection();
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunityDatabaseSystem;
}
