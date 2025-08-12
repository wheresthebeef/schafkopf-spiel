        async function loadGlobalStats() {
            const globalStatsDiv = document.getElementById('global-stats');
            
            try {
                if (secureIntegration && typeof secureIntegration.getGlobalStatsDisplay === 'function') {
                    // Use the new getGlobalStatsDisplay method
                    const globalDisplay = await secureIntegration.getGlobalStatsDisplay();
                    
                    const badge = globalDisplay.isSimulated ? 
                        '<span class="simulated-badge">Simuliert</span>' : 
                        '<span class="live-badge">Live</span>';
                    
                    globalStatsDiv.innerHTML = `
                        <div class="stat-item">
                            <span>Gesamt-Bewertungen:</span>
                            <span class="stat-value">${globalDisplay.totalReviews.toLocaleString()}${badge}</span>
                        </div>
                        <div class="stat-item">
                            <span>Aktive Spieler:</span>
                            <span class="stat-value success">${globalDisplay.totalPlayers}</span>
                        </div>
                        <div class="stat-item">
                            <span>Globale Positive Rate:</span>
                            <span class="stat-value">${globalDisplay.averagePositiveRate}%</span>
                        </div>
                        <div class="stat-item">
                            <span>Datenquelle:</span>
                            <span class="stat-value ${globalDisplay.statusClass}">${globalDisplay.statusMessage}</span>
                        </div>
                    `;
                } else if (secureIntegration) {
                    // Fallback: Use getCombinedSecureStats directly
                    console.log('🔄 Using fallback method for global stats');
                    const stats = await secureIntegration.getCombinedSecureStats();
                    
                    if (stats.global) {
                        const badge = stats.global.dataSource === 'simulated' ? 
                            '<span class="simulated-badge">Simuliert</span>' : 
                            '<span class="live-badge">Live</span>';
                        
                        globalStatsDiv.innerHTML = `
                            <div class="stat-item">
                                <span>Gesamt-Bewertungen:</span>
                                <span class="stat-value">${stats.global.totalReviews.toLocaleString()}${badge}</span>
                            </div>
                            <div class="stat-item">
                                <span>Aktive Spieler:</span>
                                <span class="stat-value success">${stats.global.totalPlayers}</span>
                            </div>
                            <div class="stat-item">
                                <span>Globale Positive Rate:</span>
                                <span class="stat-value">${stats.global.averagePositiveRate}%</span>
                            </div>
                            <div class="stat-item">
                                <span>Datenquelle:</span>
                                <span class="stat-value warning">Simulierte Daten (GitHub nicht verbunden)</span>
                            </div>
                        `;
                    } else {
                        // Generate basic simulated stats manually
                        const localStats = secureIntegration.getLocalStats();
                        const simulated = generateManualSimulatedStats(localStats);
                        
                        globalStatsDiv.innerHTML = `
                            <div class="stat-item">
                                <span>Gesamt-Bewertungen:</span>
                                <span class="stat-value">${simulated.totalReviews.toLocaleString()}<span class="simulated-badge">Simuliert</span></span>
                            </div>
                            <div class="stat-item">
                                <span>Aktive Spieler:</span>
                                <span class="stat-value success">${simulated.totalPlayers}</span>
                            </div>
                            <div class="stat-item">
                                <span>Globale Positive Rate:</span>
                                <span class="stat-value">${simulated.averagePositiveRate}%</span>
                            </div>
                            <div class="stat-item">
                                <span>Datenquelle:</span>
                                <span class="stat-value warning">Manuell simuliert</span>
                            </div>
                        `;
                    }
                } else {
                    // Complete fallback for when integration is not available
                    const fallbackStats = generateFallbackGlobalStats();
                    globalStatsDiv.innerHTML = `
                        <div class="stat-item">
                            <span>Gesamt-Bewertungen:</span>
                            <span class="stat-value">${fallbackStats.totalReviews.toLocaleString()}<span class="simulated-badge">Fallback</span></span>
                        </div>
                        <div class="stat-item">
                            <span>Aktive Spieler:</span>
                            <span class="stat-value success">${fallbackStats.totalPlayers}</span>
                        </div>
                        <div class="stat-item">
                            <span>Status:</span>
                            <span class="stat-value error">Integration nicht verfügbar</span>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Failed to load global stats:', error);
                
                // Emergency fallback
                const emergencyStats = generateFallbackGlobalStats();
                globalStatsDiv.innerHTML = `
                    <div class="stat-item">
                        <span>Gesamt-Bewertungen:</span>
                        <span class="stat-value">${emergencyStats.totalReviews.toLocaleString()}<span class="simulated-badge">Notfall</span></span>
                    </div>
                    <div class="stat-item">
                        <span>Aktive Spieler:</span>
                        <span class="stat-value success">${emergencyStats.totalPlayers}</span>
                    </div>
                    <div class="stat-item">
                        <span>Fehler:</span>
                        <span class="stat-value error">${error.message}</span>
                    </div>
                `;
            }
        }

        function generateManualSimulatedStats(localStats) {
            // Manual simulation when automatic fails
            const multiplier = Math.floor(Math.random() * 100) + 50; // 50-150x
            const playerMultiplier = Math.floor(Math.random() * 50) + 20; // 20-70 players
            
            return {
                totalReviews: Math.max(localStats.totalReviews * multiplier, localStats.totalReviews + 1000),
                totalPlayers: Math.max(playerMultiplier, 25),
                averagePositiveRate: Math.max(
                    parseFloat(localStats.positiveRate) + (Math.random() * 10 - 5),
                    45
                ).toFixed(1)
            };
        }