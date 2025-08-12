console.log('🛡️ Post-Game Training - Secure Integration Version');

window.postGameTraining = {
    enabled: false,
    currentRoundMoves: [],
    isTrackingRound: false,
    
    enable: function() {
        console.log('✅ Secure Training System aktiviert!');
        this.enabled = true;
        this.startTracking();
        this.injectCSS();
        return true;
    },
    
    injectCSS: function() {
        // Prüfen ob CSS bereits injiziert wurde
        if (document.getElementById('post-game-training-css')) return;
        
        const style = document.createElement('style');
        style.id = 'post-game-training-css';
        style.textContent = `
            .post-game-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .post-game-modal.show {
                opacity: 1;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
            }
            
            .modal-content {
                position: absolute;
                top: 20px;
                left: 20px;
                transform: none;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 400px;
                max-height: 70vh;
                overflow-y: auto;
                cursor: move;
                color: #333;
            }
            
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                user-select: none;
                background: #f8f9fa;
                border-radius: 12px 12px 0 0;
            }
            
            .modal-header h3 {
                margin: 0;
                color: #333;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            
            .modal-close:hover {
                color: #333;
            }
            
            .modal-body {
                padding: 20px;
                color: #333;
            }
            
            .modal-body p {
                color: #333;
                margin-bottom: 15px;
            }
            
            .moves-review {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .move-review-item {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                background: #f9f9f9;
                color: #333;
            }
            
            .move-info {
                margin-bottom: 12px;
                font-weight: 500;
                color: #333;
            }
            
            .player-name {
                color: #2563eb;
                font-weight: bold;
            }
            
            .card-display {
                font-size: 18px;
                margin: 0 5px;
                color: #333;
            }
            
            .card-points {
                color: #666;
                font-size: 14px;
            }
            
            .rating-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 12px;
            }
            
            .rating-btn {
                padding: 8px 16px;
                border: 2px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                color: #333;
            }
            
            .rating-btn:hover {
                border-color: #2563eb;
            }
            
            .rating-btn.good.selected {
                background: #22c55e;
                border-color: #22c55e;
                color: white;
            }
            
            .rating-btn.bad.selected {
                background: #ef4444;
                border-color: #ef4444;
                color: white;
            }
            
            .reasoning-section {
                margin-top: 10px;
            }
            
            .reasoning-section label {
                display: block;
                margin-bottom: 5px;
                font-size: 14px;
                color: #666;
            }
            
            .reasoning-input {
                width: 100%;
                min-height: 60px;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                resize: vertical;
                font-family: inherit;
                color: #333;
                background: white;
            }
            
            .modal-footer {
                padding: 20px;
                border-top: 1px solid #eee;
                text-align: right;
            }
            
            .btn-primary {
                background: #2563eb;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
            }
            
            .btn-primary:hover {
                background: #1d4ed8;
            }
            
            .security-info {
                background: #e8f5e8;
                border: 1px solid #c3e6c3;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 15px;
                font-size: 0.9em;
                color: #155724;
            }
            
            .feedback-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                background: #22c55e;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    rateMove: function(moveIndex, rating) {
        const moveItem = document.querySelector(`[data-move-index="${moveIndex}"]`);
        if (!moveItem) return;
        
        // Buttons aktualisieren
        const buttons = moveItem.querySelectorAll('.rating-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        const selectedBtn = moveItem.querySelector(`.rating-btn.${rating}`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
        
        // Begründungs-Sektion anzeigen
        const reasoningSection = moveItem.querySelector('.reasoning-section');
        reasoningSection.style.display = 'block';
        
        // Rating speichern
        moveItem.dataset.rating = rating;
        
        console.log(`📝 Bewertung gesetzt: Move ${moveIndex} = ${rating}`);
    },
    
    submitReview: function() {
        const modal = document.getElementById('post-game-review-modal');
        if (!modal) return;
        
        // Sammle alle Bewertungen
        const moveItems = modal.querySelectorAll('.move-review-item');
        const reviews = [];
        
        moveItems.forEach((item, index) => {
            const rating = item.dataset.rating;
            const reasoning = item.querySelector('.reasoning-input').value.trim();
            
            if (rating) {
                const moveData = JSON.parse(item.dataset.moveData || '{}');
                
                // Erstelle Review-Objekt für sicheres System
                const reviewData = {
                    botName: moveData.player || 'Unknown',
                    cardPlayed: moveData.card || '♠️7',
                    rating: rating,
                    reasoning: reasoning || null,
                    trickNumber: moveData.trickNumber || 0,
                    position: moveData.position || 'unknown',
                    trumpSuit: moveData.trumpSuit || 'herz',
                    gameType: moveData.gameType || 'rufspiel',
                    calledAce: moveData.calledAce || null
                };
                
                // An sicheres System weiterleiten
                console.log('🛡️ Sending to secure system:', reviewData);
                
                // Nutze die globale submitReview Funktion aus index.html
                if (window.submitReview) {
                    window.submitReview(reviewData.rating, reviewData.reasoning);
                } else {
                    console.warn('⚠️ Global submitReview function not found, using fallback');
                    this.processFeedbackSecure(reviewData);
                }
                
                reviews.push(reviewData);
            }
        });
        
        console.log('🏆 Bewertungen an sicheres System gesendet:', reviews);
        
        // Modal schließen
        this.closeReviewModal();
        
        // Erfolgsmeldung
        this.showSecureSuccess(reviews.length);
    },
    
    processFeedbackSecure: function(reviewData) {
        // Fallback: Direkt an secure training integration
        if (window.submitSecureTrainingReview) {
            window.submitSecureTrainingReview(reviewData);
        } else {
            // Ultra-Fallback: localStorage
            const reviews = JSON.parse(localStorage.getItem('training_reviews') || '[]');
            reviews.push({
                ...reviewData,
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
            localStorage.setItem('training_reviews', JSON.stringify(reviews));
            console.log('💾 Review saved to localStorage as fallback');
        }
    },
    
    closeReviewModal: function() {
        const modal = document.getElementById('post-game-review-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },
    
    showSecureSuccess: function(reviewCount) {
        const toast = document.createElement('div');
        toast.className = 'feedback-toast';
        toast.innerHTML = `
            <div class="toast-content">
                🛡️ ${reviewCount} sichere Bewertung(en) zur globalen KI-Datenbank hinzugefügt!
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    },
    
    startTracking: function() {
        this.isTrackingRound = true;
        this.currentRoundMoves = [];
        console.log('🎯 Bot-Züge werden für sicheres Training getrackt...');
    },
    
    trackBotMove: function(playerName, card, moveContext) {
        if (!this.enabled || !this.isTrackingRound) return;
        
        const move = {
            player: playerName,
            card: card,
            timestamp: new Date().toLocaleTimeString(),
            context: moveContext || {},
            // Zusätzliche Daten für sicheres System
            trickNumber: window.currentTrick || 0,
            trumpSuit: window.trumpSuit || 'herz',
            gameType: window.gameType || 'rufspiel',
            calledAce: window.calledAce || null
        };
        
        this.currentRoundMoves.push(move);
        console.log(`📝 Secure tracking: ${playerName} spielt ${card}`);
    },
    
    endTrickTracking: function() {
        if (!this.enabled || !this.isTrackingRound) return;
        
        // Nur Bot-Züge aus dem aktuellen Stich anzeigen
        const currentTrickMoves = this.currentRoundMoves.slice(-3);
        
        if (currentTrickMoves.length > 0) {
            this.showSecureTrickReview(currentTrickMoves);
        }
    },
    
    showSecureTrickReview: function(trickMoves) {
        // Modal-Container mit Sicherheitsinfo erstellen
        const modal = this.createSecureReviewModal(trickMoves);
        document.body.appendChild(modal);
        
        // Modal anzeigen und Drag & Drop aktivieren
        setTimeout(() => {
            modal.classList.add('show');
            this.makeDraggable(modal);
        }, 10);
    },
    
    createSecureReviewModal: function(trickMoves) {
        const modal = document.createElement('div');
        modal.className = 'post-game-modal';
        modal.id = 'post-game-review-modal';
        
        // Prüfe ob sicheres System verfügbar ist
        const isSecureAvailable = window.secureTrainingIntegration && 
                                 window.secureTrainingIntegration.isSecureEnabled;
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="postGameTraining.closeReviewModal()"></div>
            <div class="modal-content" id="draggable-modal">
                <div class="modal-header" id="modal-header">
                    <h3>🛡️ Sichere Bot-Bewertung</h3>
                    <button class="modal-close" onclick="postGameTraining.closeReviewModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="security-info">
                        ${isSecureAvailable ? 
                            '🌍 Deine Bewertungen verbessern die globale Schafkopf-KI!' :
                            '📱 Bewertungen werden lokal gespeichert und später synchronisiert'
                        }
                    </div>
                    <p><strong>Bewerte die Bot-Züge in diesem Stich:</strong></p>
                    <div class="moves-review">
                        ${trickMoves.map((move, index) => this.createSecureMoveReviewHTML(move, index)).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="postGameTraining.submitReview()">
                        🛡️ Sichere Bewertung abschicken
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    },
    
    createSecureMoveReviewHTML: function(move, index) {
        return `
            <div class="move-review-item" data-move-index="${index}" data-move-data='${JSON.stringify(move)}'>
                <div class="move-info">
                    <span class="player-name">${move.player}</span> spielt 
                    <span class="card-display">${move.card}</span>
                    <span class="card-points">(${move.context.cardPoints || 0} Punkte)</span>
                </div>
                <div class="rating-buttons">
                    <button class="btn rating-btn good" onclick="postGameTraining.rateMove(${index}, 'good')">
                        👍 Gut
                    </button>
                    <button class="btn rating-btn bad" onclick="postGameTraining.rateMove(${index}, 'bad')">
                        👎 Schlecht
                    </button>
                </div>
                <div class="reasoning-section" style="display: none;">
                    <label>Begründung (optional):</label>
                    <textarea class="reasoning-input" placeholder="Warum war dieser Zug gut/schlecht? (hilft der KI beim Lernen)"></textarea>
                </div>
            </div>
        `;
    },
    
    makeDraggable: function(modal) {
        const modalContent = modal.querySelector('#draggable-modal');
        const header = modal.querySelector('#modal-header');
        
        if (!modalContent || !header) return;
        
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = modalContent.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            header.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            const maxLeft = window.innerWidth - modalContent.offsetWidth;
            const maxTop = window.innerHeight - modalContent.offsetHeight;
            
            const finalLeft = Math.max(0, Math.min(newLeft, maxLeft));
            const finalTop = Math.max(0, Math.min(newTop, maxTop));
            
            modalContent.style.left = finalLeft + 'px';
            modalContent.style.top = finalTop + 'px';
        });
        
        document.addEventListener('mouseup', function(e) {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
                document.body.style.userSelect = '';
            }
        });
        
        // Touch support
        header.addEventListener('touchstart', function(e) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            header.dispatchEvent(mouseEvent);
        });
        
        document.addEventListener('touchmove', function(e) {
            if (isDragging) {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                document.dispatchEvent(mouseEvent);
            }
        });
        
        document.addEventListener('touchend', function(e) {
            if (isDragging) {
                const mouseEvent = new MouseEvent('mouseup', {});
                document.dispatchEvent(mouseEvent);
            }
        });
    },
    
    endRoundTracking: function() {
        if (!this.enabled) return;
        
        console.log('🏁 Sichere Runde beendet - Alle Bot-Züge gesammelt:');
        console.table(this.currentRoundMoves);
        
        this.isTrackingRound = false;
        this.currentRoundMoves = [];
    },
    
    disable: function() {
        this.enabled = false;
        this.isTrackingRound = false;
        this.currentRoundMoves = [];
        console.log('❌ Sicheres Training deaktiviert');
    }
};

// Kompatibilitätsfunktionen
window.enableHumanTraining = function() {
    return window.postGameTraining.enable();
};

window.disableHumanTraining = function() {
    return window.postGameTraining.disable();
};

console.log('🛡️ Secure Post-Game Training System ready!');
console.log('Test: enableHumanTraining() or postGameTraining.enable()');
