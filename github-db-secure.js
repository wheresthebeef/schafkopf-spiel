// github-db-secure.js - Secure GitHub Database with comprehensive protection
class SecureGitHubDatabase {
    constructor() {
        this.owner = 'wheresthebeef';
        this.repo = 'schafkopf-spiel';
        this.token = null;
        this.baseUrl = 'https://api.github.com';
        this.dataPath = 'training-data';
        
        // Security & Monitoring
        this.auditLog = [];
        this.suspiciousActivity = new Set();
        this.rateLimits = new Map();
        this.dailyStats = new Map();
        this.blockedSessions = new Set();
        
        // Validation rules
        this.validBots = ['Anna', 'Hans', 'Sepp'];
        this.validRatings = ['good', 'bad'];
        this.validCards = this.generateValidCards();
        this.validGameTypes = ['rufspiel', 'solo', 'wenz', 'geier'];
        this.validSuits = ['herz', 'eichel', 'gras', 'schellen'];
        
        // Rate limiting and caching
        this.requestCount = 0;
        this.lastResetTime = Date.now();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
        
        // Offline support
        this.isOnline = navigator.onLine;
        this.pendingWrites = JSON.parse(localStorage.getItem('pendingSecureWrites') || '[]');
        
        this.setupEventListeners();
        this.loadSecurityState();
        this.setupAutoBackup();
    }

    generateValidCards() {
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const values = ['7', '8', '9', '10', 'B', 'D', 'K', 'A'];
        const cards = [];
        suits.forEach(suit => {
            values.forEach(value => {
                cards.push(suit + value);
            });
        });
        return cards;
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingWrites();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        window.addEventListener('beforeunload', () => {
            this.saveSecurityState();
        });
    }

    loadSecurityState() {
        try {
            const savedState = localStorage.getItem('schafkopf_security_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.auditLog = state.auditLog || [];
                this.suspiciousActivity = new Set(state.suspiciousActivity || []);
                this.blockedSessions = new Set(state.blockedSessions || []);
                this.rateLimits = new Map(state.rateLimits || []);
                this.cleanOldRateLimits();
            }
        } catch (error) {
            console.warn('Failed to load security state:', error);
        }
    }

    saveSecurityState() {
        try {
            const state = {
                auditLog: this.auditLog.slice(-1000),
                suspiciousActivity: Array.from(this.suspiciousActivity),
                blockedSessions: Array.from(this.blockedSessions),
                rateLimits: Array.from(this.rateLimits.entries())
            };
            localStorage.setItem('schafkopf_security_state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save security state:', error);
        }
    }

    setupAutoBackup() {
        setInterval(() => {
            if (this.isOnline && this.token) {
                this.createBackup().catch(error => {
                    console.warn('Auto-backup failed:', error);
                });
            }
        }, 6 * 60 * 60 * 1000);
    }

    async init(token) {
        this.token = token;
        return this.testConnection();
    }

    async testConnection() {
        try {
            const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}`);
            console.log('✅ Secure GitHub connection established');
            this.logAudit('connection', 'success', null);
            return true;
        } catch (error) {
            console.error('❌ Secure GitHub connection failed:', error);
            this.logAudit('connection', 'failed', null, error.message);
            return false;
        }
    }

    validateAndMonitor(reviewData) {
        const playerSession = reviewData.playerSession || this.getPlayerSessionId();
        
        if (this.blockedSessions.has(playerSession)) {
            return { 
                isValid: false, 
                reason: 'Session blocked due to suspicious activity',
                severity: 'high'
            };
        }

        const formatValidation = this.validateReviewFormat(reviewData);
        if (!formatValidation.isValid) {
            this.logSuspiciousActivity(playerSession, 'invalid_format', reviewData);
            return formatValidation;
        }

        const rateLimitCheck = this.checkRateLimit(playerSession);
        if (!rateLimitCheck.isValid) {
            this.logSuspiciousActivity(playerSession, 'rate_limit', reviewData);
            return rateLimitCheck;
        }

        const contentCheck = this.validateContent(reviewData);
        if (!contentCheck.isValid) {
            this.logSuspiciousActivity(playerSession, 'invalid_content', reviewData);
            return contentCheck;
        }

        return { isValid: true };
    }

    validateReviewFormat(review) {
        const required = ['botName', 'cardPlayed', 'rating'];
        const missing = required.filter(field => !review[field]);
        
        if (missing.length > 0) {
            return {
                isValid: false,
                reason: `Missing required fields: ${missing.join(', ')}`,
                severity: 'medium'
            };
        }

        if (typeof review.rating !== 'string' || 
            typeof review.botName !== 'string' ||
            typeof review.cardPlayed !== 'string') {
            return {
                isValid: false,
                reason: 'Invalid field types',
                severity: 'medium'
            };
        }

        return { isValid: true };
    }

    checkRateLimit(playerSession) {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;
        
        if (!this.rateLimits.has(playerSession)) {
            this.rateLimits.set(playerSession, []);
        }
        
        const timestamps = this.rateLimits.get(playerSession);
        const validTimestamps = timestamps.filter(ts => now - ts < oneDay);
        this.rateLimits.set(playerSession, validTimestamps);
        
        const hourlyCount = validTimestamps.filter(ts => now - ts < oneHour).length;
        if (hourlyCount >= 20) {
            return {
                isValid: false,
                reason: 'Hourly rate limit exceeded (20/hour)',
                severity: 'high'
            };
        }
        
        if (validTimestamps.length >= 200) {
            return {
                isValid: false,
                reason: 'Daily rate limit exceeded (200/day)',
                severity: 'high'
            };
        }
        
        validTimestamps.push(now);
        return { isValid: true };
    }

    validateContent(review) {
        if (!this.validBots.includes(review.botName)) {
            return {
                isValid: false,
                reason: `Invalid bot name: ${review.botName}`,
                severity: 'medium'
            };
        }
        
        if (!this.validRatings.includes(review.rating)) {
            return {
                isValid: false,
                reason: `Invalid rating: ${review.rating}`,
                severity: 'medium'
            };
        }
        
        if (!review.cardPlayed || review.cardPlayed.length < 2) {
            return {
                isValid: false,
                reason: `Invalid card format: ${review.cardPlayed}`,
                severity: 'medium'
            };
        }
        
        if (review.reasoning && review.reasoning.length > 500) {
            return {
                isValid: false,
                reason: 'Reasoning too long (max 500 characters)',
                severity: 'low'
            };
        }
        
        return { isValid: true };
    }

    async addTrainingReview(reviewData) {
        const playerSession = reviewData.playerSession || this.getPlayerSessionId();
        
        const validation = this.validateAndMonitor({
            ...reviewData,
            playerSession
        });
        
        if (!validation.isValid) {
            this.logAudit('review_rejected', validation.reason, playerSession, {
                severity: validation.severity,
                data: JSON.stringify(reviewData).substring(0, 100)
            });
            
            return { 
                success: false, 
                reason: validation.reason,
                severity: validation.severity 
            };
        }
        
        const secureReview = {
            id: this.generateSecureId(),
            timestamp: new Date().toISOString(),
            playerSession,
            botName: reviewData.botName,
            cardPlayed: reviewData.cardPlayed,
            gameContext: {
                trickNumber: Math.max(0, Math.min(8, reviewData.gameContext?.trickNumber || 0)),
                position: reviewData.gameContext?.position || 'unknown',
                trumpSuit: reviewData.gameContext?.trumpSuit || null,
                gameType: reviewData.gameContext?.gameType || 'rufspiel'
            },
            rating: reviewData.rating,
            reasoning: reviewData.reasoning ? 
                reviewData.reasoning.substring(0, 500).replace(/[<>]/g, '') : null,
            gameMetadata: {
                calledAce: reviewData.gameMetadata?.calledAce || null,
                gameType: reviewData.gameMetadata?.gameType || 'rufspiel'
            },
            securityHash: this.generateSecurityHash(reviewData, playerSession)
        };
        
        if (!this.isOnline) {
            this.addToPendingWrites(secureReview);
            this.logAudit('review_queued', 'offline', playerSession);
            return { success: false, reason: 'offline' };
        }

        try {
            const { content: database, sha } = await this.getFile(`${this.dataPath}/reviews.json`);
            
            database.reviews.push(secureReview);
            database.globalStats.totalReviews = database.reviews.length;
            database.globalStats.lastUpdated = new Date().toISOString();
            
            const positiveReviews = database.reviews.filter(r => r.rating === 'good').length;
            database.globalStats.averagePositiveRate = 
                parseFloat((positiveReviews / database.reviews.length * 100).toFixed(1));
            
            const uniquePlayers = new Set(database.reviews.map(r => r.playerSession)).size;
            database.globalStats.totalPlayers = uniquePlayers;

            const result = await this.updateFile(
                `${this.dataPath}/reviews.json`,
                database,
                sha,
                `Secure review: ${secureReview.botName} - ${secureReview.rating} [${secureReview.id}]`
            );

            if (result.success) {
                this.logAudit('review_added', 'success', playerSession, {
                    reviewId: secureReview.id,
                    botName: secureReview.botName,
                    rating: secureReview.rating
                });
                
                this.triggerStatsUpdate();
            } else {
                this.logAudit('review_failed', result.reason, playerSession);
            }

            return result;
            
        } catch (error) {
            this.logAudit('review_error', error.message, playerSession);
            this.addToPendingWrites(secureReview);
            return { success: false, reason: error.message };
        }
    }

    async getGlobalStats() {
        const { content: database } = await this.getFile(`${this.dataPath}/reviews.json`);
        return database.globalStats;
    }

    logAudit(action, result, playerSession, details = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            result,
            playerSession,
            details,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        this.auditLog.push(logEntry);
        
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
        
        if (this.auditLog.length % 10 === 0) {
            this.saveSecurityState();
        }
    }

    logSuspiciousActivity(playerSession, type, data) {
        this.suspiciousActivity.add(playerSession);
        
        const suspicionCount = this.getSuspicionCount(playerSession);
        
        if (suspicionCount >= 5) {
            this.blockedSessions.add(playerSession);
            console.warn(`🚫 Player session ${playerSession} blocked due to repeated suspicious activity`);
        }
        
        this.logAudit('suspicious_activity', type, playerSession, {
            type,
            data: JSON.stringify(data).substring(0, 200),
            suspicionCount
        });
    }

    getSuspicionCount(playerSession) {
        return this.auditLog.filter(entry => 
            entry.playerSession === playerSession && 
            entry.result.includes('suspicious') &&
            Date.now() - new Date(entry.timestamp).getTime() < 24 * 60 * 60 * 1000
        ).length;
    }

    async createBackup() {
        try {
            const { content: reviewsData } = await this.getFile(`${this.dataPath}/reviews.json`);
            const timestamp = new Date().toISOString().split('T')[0];
            const backupPath = `${this.dataPath}/backups/reviews-${timestamp}.json`;
            
            const backupData = {
                ...reviewsData,
                backupMetadata: {
                    timestamp: new Date().toISOString(),
                    totalReviews: reviewsData.reviews.length,
                    securityStats: {
                        suspiciousActivities: this.suspiciousActivity.size,
                        blockedSessions: this.blockedSessions.size,
                        auditLogEntries: this.auditLog.length
                    }
                }
            };
            
            const result = await this.updateFile(
                backupPath,
                backupData,
                null,
                `Automated backup: ${timestamp}`
            );
            
            if (result.success) {
                this.logAudit('backup_created', 'success', null, { timestamp });
                console.log(`✅ Backup created: ${backupPath}`);
            }
            
            return result;
            
        } catch (error) {
            this.logAudit('backup_failed', error.message, null);
            console.error('❌ Backup failed:', error);
            return { success: false, reason: error.message };
        }
    }

    generateSecureId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        const checksum = this.simpleChecksum(timestamp + random);
        return `${timestamp}_${random}_${checksum}`;
    }

    generateSecurityHash(reviewData, playerSession) {
        const hashInput = JSON.stringify({
            bot: reviewData.botName,
            card: reviewData.cardPlayed,
            rating: reviewData.rating,
            session: playerSession.substring(0, 8),
            timestamp: Math.floor(Date.now() / 1000)
        });
        return this.simpleChecksum(hashInput);
    }

    simpleChecksum(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    cleanOldRateLimits() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const [session, timestamps] of this.rateLimits.entries()) {
            const validTimestamps = timestamps.filter(ts => ts > oneDayAgo);
            if (validTimestamps.length === 0) {
                this.rateLimits.delete(session);
            } else {
                this.rateLimits.set(session, validTimestamps);
            }
        }
    }

    getSecurityStats() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        const recentAudit = this.auditLog.filter(entry => 
            now - new Date(entry.timestamp).getTime() < oneDay
        );
        
        const reviewsToday = recentAudit.filter(entry => 
            entry.action === 'review_added' && entry.result === 'success'
        ).length;
        
        const rejectionsToday = recentAudit.filter(entry => 
            entry.action === 'review_rejected'
        ).length;
        
        return {
            totalAuditEntries: this.auditLog.length,
            suspiciousActivities: this.suspiciousActivity.size,
            blockedSessions: this.blockedSessions.size,
            reviewsToday,
            rejectionsToday,
            rejectionRate: reviewsToday > 0 ? 
                ((rejectionsToday / (reviewsToday + rejectionsToday)) * 100).toFixed(1) : 0,
            activeSessions: this.rateLimits.size
        };
    }

    async makeRequest(endpoint, options = {}) {
        if (this.requestCount >= 4500) {
            const timeElapsed = Date.now() - this.lastResetTime;
            if (timeElapsed < 3600000) {
                throw new Error('Rate limit reached. Please wait before making more requests.');
            } else {
                this.requestCount = 0;
                this.lastResetTime = Date.now();
            }
        }

        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        this.requestCount++;
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    }

    async getFile(path) {
        const cacheKey = `file:${path}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}/contents/${path}`);
            const content = JSON.parse(atob(response.content));
            
            this.cache.set(cacheKey, {
                data: { content, sha: response.sha },
                timestamp: Date.now()
            });
            
            return { content, sha: response.sha };
        } catch (error) {
            if (error.message.includes('404')) {
                return { content: this.getEmptyDatabaseStructure(), sha: null };
            }
            throw error;
        }
    }

    async updateFile(path, content, sha, message) {
        try {
            const body = {
                message,
                content: btoa(JSON.stringify(content, null, 2)),
                branch: 'main'
            };
            
            if (sha) {
                body.sha = sha;
            }

            const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });

            this.cache.delete(`file:${path}`);
            return { success: true, sha: response.content.sha };
            
        } catch (error) {
            console.error('Failed to update file:', error);
            return { success: false, reason: error.message };
        }
    }

    getPlayerSessionId() {
        let sessionId = localStorage.getItem('schafkopf_session_id');
        if (!sessionId) {
            sessionId = 'player_' + this.generateSecureId();
            localStorage.setItem('schafkopf_session_id', sessionId);
        }
        return sessionId;
    }

    getEmptyDatabaseStructure() {
        return {
            globalStats: {
                totalReviews: 0,
                totalPlayers: 0,
                averagePositiveRate: 0,
                lastUpdated: new Date().toISOString()
            },
            reviews: []
        };
    }

    addToPendingWrites(reviewData) {
        this.pendingWrites.push({
            ...reviewData,
            queuedAt: new Date().toISOString()
        });
        localStorage.setItem('pendingSecureWrites', JSON.stringify(this.pendingWrites));
    }

    async processPendingWrites() {
        if (!this.isOnline || this.pendingWrites.length === 0) return;

        console.log(`🔄 Processing ${this.pendingWrites.length} pending secure writes...`);
        
        const processedWrites = [];
        
        for (const write of this.pendingWrites) {
            try {
                const result = await this.addTrainingReview(write);
                if (result.success) {
                    processedWrites.push(write);
                }
            } catch (error) {
                console.error('Failed to process pending write:', error);
            }
        }
        
        this.pendingWrites = this.pendingWrites.filter(write => 
            !processedWrites.includes(write)
        );
        localStorage.setItem('pendingSecureWrites', JSON.stringify(this.pendingWrites));
        
        console.log(`✅ Processed ${processedWrites.length} pending writes`);
    }

    triggerStatsUpdate() {
        window.dispatchEvent(new CustomEvent('trainingStatsUpdated', {
            detail: { source: 'github', timestamp: Date.now() }
        }));
    }

    isAvailable() {
        return this.token && this.isOnline;
    }

    getStatus() {
        if (!this.token) return { status: 'no-token', message: 'GitHub token not configured' };
        if (!this.isOnline) return { status: 'offline', message: 'Offline - reviews will sync when online' };
        return { status: 'online', message: 'Secure GitHub database connected' };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureGitHubDatabase;
}

// Global instance for browser usage
window.SecureGitHubDB = SecureGitHubDatabase;