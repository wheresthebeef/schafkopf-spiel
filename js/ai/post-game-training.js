console.log('🚀 Post-Game Training - Clean Version');

window.postGameTraining = {
    enabled: false,
    currentRoundMoves: [],
    isTrackingRound: false,
    
    enable: function() {
        console.log('✅ System aktiviert!');
        this.enabled = true;
        this.startTracking();
        this.injectCSS(); // CSS für Modal hinzufügen
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
            }
            
            .move-info {
                margin-bottom: 12px;
                font-weight: 500;
            }
            
            .player-name {
                color: #2563eb;
                font-weight: bold;
            }
            
            .card-display {
                font-size: 18px;
                margin: 0 5px;
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
                reviews.push({
                    moveIndex: index,
                    rating: rating,
                    reasoning: reasoning || null
                });
            }
        });
        
        console.log('🏆 Bewertungen abgeschickt:', reviews);
        
        // Modal schließen
        this.closeReviewModal();
        
        // TODO: Bewertungen an AI-System übergeben
        this.processFeedback(reviews);
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
    
    processFeedback: function(reviews) {
        // Hier würde später das echte AI-Training passieren
        console.log('🤖 AI-Training würde jetzt mit diesem Feedback arbeiten:', reviews);
        
        // Erfolgsmeldung anzeigen
        this.showFeedbackSuccess(reviews.length);
    },
    
    showFeedbackSuccess: function(reviewCount) {
        // Temporäre Erfolgsmeldung
        const toast = document.createElement('div');
        toast.className = 'feedback-toast';
        toast.innerHTML = `
            <div class="toast-content">
                ✅ ${reviewCount} Bewertung(en) gespeichert!
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Toast nach 3 Sekunden entfernen
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    startTracking: function() {
        this.isTrackingRound = true;
        this.currentRoundMoves = [];
        console.log('🎯 Bot-Züge werden jetzt getrackt...');
    },
    
    trackBotMove: function(playerName, card, moveContext) {
        if (!this.enabled || !this.isTrackingRound) return;
        
        const move = {
            player: playerName,
            card: card,
            timestamp: new Date().toLocaleTimeString(),
            context: moveContext || {}
        };
        
        this.currentRoundMoves.push(move);
        console.log(`📝 Tracked: ${playerName} spielt ${card}`);
    },
    
    endTrickTracking: function() {
        if (!this.enabled || !this.isTrackingRound) return;
        
        // Nur Bot-Züge aus dem aktuellen Stich anzeigen
        const currentTrickMoves = this.currentRoundMoves.slice(-3); // Maximal 3 Bots pro Stich
        
        if (currentTrickMoves.length > 0) {
            // Zeige Bewertungs-UI statt Console-Tabelle
            this.showTrickReview(currentTrickMoves);
        }
    },
    
    showTrickReview: function(trickMoves) {
        // Modal-Container erstellen
        const modal = this.createReviewModal(trickMoves);
        document.body.appendChild(modal);
        
        // Modal anzeigen und DANN Drag & Drop aktivieren
        setTimeout(() => {
            modal.classList.add('show');
            this.makeDraggable(modal); // NACH dem Anzeigen aktivieren
        }, 10);
    },
    
    createReviewModal: function(trickMoves) {
        const modal = document.createElement('div');
        modal.className = 'post-game-modal';
        modal.id = 'post-game-review-modal';
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="postGameTraining.closeReviewModal()"></div>
            <div class="modal-content" id="draggable-modal">
                <div class="modal-header" id="modal-header">
                    <h3>🏆 Stich-Bewertung</h3>
                    <button class="modal-close" onclick="postGameTraining.closeReviewModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Bewerte die Bot-Züge in diesem Stich:</p>
                    <div class="moves-review">
                        ${trickMoves.map((move, index) => this.createMoveReviewHTML(move, index)).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="postGameTraining.submitReview()">Fertig</button>
                </div>
            </div>
        `;
        
        return modal;
    },
    
    makeDraggable: function(modal) {
        const modalContent = modal.querySelector('#draggable-modal');
        const header = modal.querySelector('#modal-header');
        
        console.log('🔍 DEBUG: makeDraggable aufgerufen', modalContent, header);
        
        if (!modalContent || !header) {
            console.error('Modal oder Header nicht gefunden!');
            return;
        }
        
        let isDragging = false;
        let currentX = 20; // Startwerte
        let currentY = 20;
        let initialX;
        let initialY;
        let xOffset = 20;
        let yOffset = 20;
        
        // Event-Listener direkt an Header
        header.onmousedown = function(e) {
            console.log('🔍 Mouse down auf header');
            e.preventDefault();
            
            isDragging = true;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            header.style.cursor = 'grabbing';
            
            // Document-Listener für Bewegung
            document.onmousemove = function(e) {
                if (isDragging) {
                    e.preventDefault();
                    
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    
                    xOffset = currentX;
                    yOffset = currentY;
                    
                    modalContent.style.left = currentX + 'px';
                    modalContent.style.top = currentY + 'px';
                    
                    console.log('🔍 Dragging to:', currentX, currentY);
                }
            };
            
            document.onmouseup = function() {
                console.log('🔍 Mouse up');
                isDragging = false;
                header.style.cursor = 'move';
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    },
    
    createMoveReviewHTML: function(move, index) {
        return `
            <div class="move-review-item" data-move-index="${index}">
                <div class="move-info">
                    <span class="player-name">${move.player}</span> spielt 
                    <span class="card-display">${move.card}</span>
                    <span class="card-points">(${move.context.cardPoints} Punkte)</span>
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
                    <textarea class="reasoning-input" placeholder="Warum war dieser Zug gut/schlecht?"></textarea>
                </div>
            </div>
        `;
    },
    
    endRoundTracking: function() {
        if (!this.enabled) return;
        
        console.log('🏁 Komplette Runde beendet - Alle Bot-Züge:');
        console.table(this.currentRoundMoves);
        
        // Tracking zurücksetzen für nächste Runde
        this.isTrackingRound = false;
        this.currentRoundMoves = [];
    },
    
    demoGame: function() {
        console.log('🎯 Demo läuft...');
        alert('Demo-Funktion funktioniert!');
    },
    
    disable: function() {
        this.enabled = false;
        this.isTrackingRound = false;
        this.currentRoundMoves = [];
        console.log('❌ System deaktiviert');
    }
};

window.enableHumanTraining = function() {
    return window.postGameTraining.enable();
};

window.disableHumanTraining = function() {
    return window.postGameTraining.disable();
};

console.log('✅ postGameTraining ist verfügbar!');
console.log('Test: enableHumanTraining()');
