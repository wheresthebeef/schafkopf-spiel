        // FIXED: Force immediate display of hardcoded values until integration works
        async function loadGlobalStats() {
            const globalStatsDiv = document.getElementById('global-stats');
            
            try {
                console.log('🔄 Loading global stats...');
                
                // FIRST: Try to get stats from secureTrainingIntegration
                if (secureIntegration && typeof secureIntegration.generateSimulatedGlobalStats === 'function') {
                    console.log('📊 Calling generateSimulatedGlobalStats directly');
                    const directStats = secureIntegration.generateSimulatedGlobalStats();
                    console.log('✅ Direct stats result:', directStats);
                    
                    if (directStats && directStats.totalReviews > 0) {
                        globalStatsDiv.innerHTML = `
                            <div class="stat-item">
                                <span>Gesamt-Bewertungen:</span>
                                <span class="stat-value">${directStats.totalReviews.toLocaleString()}<span class="simulated-badge">Simuliert</span></span>
                            </div>
                            <div class="stat-item">
                                <span>Aktive Spieler:</span>
                                <span class="stat-value success">${directStats.totalPlayers}</span>
                            </div>
                            <div class="stat-item">
                                <span>Globale Positive Rate:</span>
                                <span class="stat-value">${directStats.averagePositiveRate}%</span>
                            </div>
                            <div class="stat-item">
                                <span>Datenquelle:</span>
                                <span class="stat-value warning">Direkt simuliert</span>
                            </div>
                        `;
                        return; // Success, exit early
                    }
                }
                
                // SECOND: Try getGlobalStatsDisplay if direct call failed
                if (secureIntegration && typeof secureIntegration.getGlobalStatsDisplay === 'function') {
                    console.log('📊 Using getGlobalStatsDisplay method');
                    const globalDisplay = await secureIntegration.getGlobalStatsDisplay();
                    console.log('✅ Global display data:', globalDisplay);
                    
                    if (globalDisplay && globalDisplay.totalReviews > 0) {
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
                        return; // Success, exit early
                    }
                }
                
                // THIRD: Manual test if integration exists
                if (window.secureTrainingIntegration) {
                    console.log('📊 Testing window.secureTrainingIntegration directly');
                    const testStats = window.secureTrainingIntegration.generateSimulatedGlobalStats();
                    console.log('✅ Test stats:', testStats);
                    
                    if (testStats && testStats.totalReviews > 0) {
                        globalStatsDiv.innerHTML = `
                            <div class="stat-item">
                                <span>Gesamt-Bewertungen:</span>
                                <span class="stat-value">${testStats.totalReviews.toLocaleString()}<span class="simulated-badge">Test</span></span>
                            </div>
                            <div class="stat-item">
                                <span>Aktive Spieler:</span>
                                <span class="stat-value success">${testStats.totalPlayers}</span>
                            </div>
                            <div class="stat-item">
                                <span>Globale Positive Rate:</span>
                                <span class="stat-value">${testStats.averagePositiveRate}%</span>
                            </div>
                            <div class="stat-item">
                                <span>Datenquelle:</span>
                                <span class="stat-value warning">Test-Modus</span>
                            </div>
                        `;
                        return; // Success, exit early
                    }
                }
                
                // FOURTH: Emergency fallback if everything above failed
                console.log('⚠️ All methods failed, using emergency fallback');
                throw new Error('All integration methods failed');
                
            } catch (error) {
                console.error('❌ Complete failure in loadGlobalStats:', error);
                
                // FINAL EMERGENCY: Hardcoded realistic values directly in HTML
                const finalFallback = {
                    totalReviews: Math.floor(Math.random() * 2000) + 3000, // 3000-5000
                    totalPlayers: Math.floor(Math.random() * 40) + 50,     // 50-90
                    averagePositiveRate: (Math.random() * 15 + 65).toFixed(1) // 65-80%
                };
                
                console.log('🚨 Using final emergency fallback:', finalFallback);
                
                globalStatsDiv.innerHTML = `
                    <div class="stat-item">
                        <span>Gesamt-Bewertungen:</span>
                        <span class="stat-value">${finalFallback.totalReviews.toLocaleString()}<span class="simulated-badge">Notfall</span></span>
                    </div>
                    <div class="stat-item">
                        <span>Aktive Spieler:</span>
                        <span class="stat-value success">${finalFallback.totalPlayers}</span>
                    </div>
                    <div class="stat-item">
                        <span>Globale Positive Rate:</span>
                        <span class="stat-value">${finalFallback.averagePositiveRate}%</span>
                    </div>
                    <div class="stat-item">
                        <span>Status:</span>
                        <span class="stat-value error">Notfall-Modus</span>
                    </div>
                `;
            }
        }