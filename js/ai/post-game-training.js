console.log('🚀 Post-Game AI Training System wird geladen...');

// Erstelle das Objekt sofort global
window.postGameTraining = {
    enabled: false,
    ui: null,
    moves: [],
    tracking: false,
    stats: { games: 0, moves: 0, good: 0, bad: 0, suggestions: 0 }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    const training = window.postGameTraining;
        enabled: false,
        ui: null,
        moves: [],
        tracking: false,
        stats: { games: 0, moves: 0, good: 0, bad: 0, suggestions: 0 },
        
        enable() {
            this.enabled = true;
            this.createUI();
            return true;
        },
        
        createUI() {
            // Remove old UIs
            document.querySelectorAll('#post-game-training-ui, #working-human-training-ui').forEach(ui => ui.remove());
            
            const ui = document.createElement('div');
            ui.id = 'post-game-training-ui';
            ui.innerHTML = `
                <div style="position:fixed;top:80px;right:20px;width:380px;background:white;border:3px solid #28a745;border-radius:12px;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,0.3);">
                    <div style="background:linear-gradient(135deg,#28a745,#20c997);color:white;padding:15px;border-radius:9px 9px 0 0;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3 style="margin:0;font-size:18px;">🧑‍🏫 Post-Game AI Training</h3>
                            <div style="font-size:11px;opacity:0.9;">Intelligentes Training nach Rundenende</div>
                        </div>
                        <button onclick="postGameTraining.disable()" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:20px;cursor:pointer;border-radius:50%;width:30px;height:30px;">×</button>
                    </div>
                    
                    <div style="padding:20px;">
                        <div style="background:#f8f9fa;border-radius:8px;padding:15px;margin-bottom:20px;border-left:4px solid #28a745;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                                <div>
                                    <div style="font-weight:bold;font-size:14px;">Status</div>
                                    <div id="training-status" style="color:#28a745;font-size:13px;">Bereit für neue Runde</div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-weight:bold;font-size:14px;">Statistik</div>
                                    <div style="font-size:11px;">Spiele: <span id="games">0</span> | Züge: <span id="moves">0</span></div>
                                </div>
                            </div>
                            <div style="display:flex;gap:8px;font-size:11px;">
                                <span style="background:#28a745;color:white;padding:2px 6px;border-radius:10px;">👍 <span id="good">0</span></span>
                                <span style="background:#dc3545;color:white;padding:2px 6px;border-radius:10px;">👎 <span id="bad">0</span></span>
                                <span style="background:#ffc107;color:black;padding:2px 6px;border-radius:10px;">💡 <span id="suggest">0</span></span>
                            </div>
                        </div>
                        
                        <button id="track-btn" onclick="postGameTraining.startTracking()" style="width:100%;padding:12px;background:#007bff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;margin-bottom:20px;">
                            🎮 Neue Runde starten & verfolgen
                        </button>
                        
                        <div style="padding:12px;background:#e9ecef;border-radius:6px;margin-bottom:20px;">
                            <div style="font-weight:bold;margin-bottom:8px;">⚡ Schnell-Tests</div>
                            <div style="display:flex;gap:6px;">
                                <button onclick="postGameTraining.demoGame()" style="flex:1;padding:6px;background:#17a2b8;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">🎯 Demo (4 Züge)</button>
                                <button onclick="postGameTraining.fullGame()" style="flex:1;padding:6px;background:#6610f2;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">🎲 Vollspiel (8 Züge)</button>
                            </div>
                        </div>
                        
                        <div id="review" style="display:none;border-top:2px solid #28a745;padding-top:15px;">
                            <h4 style="margin:0 0 15px 0;color:#28a745;">📝 Post-Game Review</h4>
                            <div id="review-content"></div>
                        </div>
                        
                        <div id="live" style="display:none;border-top:1px solid #dee2e6;padding-top:12px;">
                            <div style="font-weight:bold;margin-bottom:8px;">🔴 Live Tracking</div>
                            <div id="live-moves" style="max-height:120px;overflow-y:auto;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(ui);
            this.ui = ui;
            this.updateDisplay();
        },
        
        updateDisplay() {
            document.getElementById('games').textContent = this.stats.games;
            document.getElementById('moves').textContent = this.stats.moves;
            document.getElementById('good').textContent = this.stats.good;
            document.getElementById('bad').textContent = this.stats.bad;
            document.getElementById('suggest').textContent = this.stats.suggestions;
        },
        
        disable() {
            this.enabled = false;
            if (this.ui) {
                this.ui.remove();
                this.ui = null;
            }
        },
        
        startTracking() {
            this.tracking = true;
            this.moves = [];
            
            const btn = document.getElementById('track-btn');
            btn.textContent = '⏹️ Tracking läuft - Stoppen';
            btn.style.background = '#dc3545';
            btn.onclick = () => this.stopTracking();
            
            document.getElementById('live').style.display = 'block';
            this.startSimulation();
        },
        
        stopTracking() {
            this.tracking = false;
            
            const btn = document.getElementById('track-btn');
            btn.textContent = '🎮 Neue Runde starten & verfolgen';
            btn.style.background = '#007bff';
            btn.onclick = () => this.startTracking();
            
            document.getElementById('live').style.display = 'none';
            
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            
            if (this.moves.length > 0) {
                this.showReview();
            }
        },
        
        startSimulation() {
            this.interval = setInterval(() => {
                if (this.tracking && this.moves.length < 8) {
                    this.addMove();
                    if (this.moves.length >= 8) {
                        setTimeout(() => this.stopTracking(), 1000);
                    }
                }
            }, 2500);
        },
        
        addMove() {
            const players = ['Anna', 'Hans', 'Sepp'];
            const suits = ['Herz', 'Eichel', 'Gras', 'Schellen'];
            const values = ['7', '8', '9', 'Unter', 'Ober', 'König', 'Zehn', 'Ass'];
            const contexts = ['Stich eröffnet', 'Folgt Farbe', 'Trumpft', 'Wirft ab', 'Sammelt Punkte'];
            
            const move = {
                id: Date.now(),
                player: players[Math.floor(Math.random() * players.length)],
                suit: suits[Math.floor(Math.random() * suits.length)],
                value: values[Math.floor(Math.random() * values.length)],
                context: contexts[Math.floor(Math.random() * contexts.length)],
                timestamp: new Date()
            };
            
            this.moves.push(move);
            this.updateLive(move);
        },
        
        updateLive(move) {
            const container = document.getElementById('live-moves');
            const div = document.createElement('div');
            div.style.cssText = 'background:#f8f9fa;border-left:3px solid #007bff;padding:8px;margin:4px 0;border-radius:4px;font-size:12px;';
            div.innerHTML = `
                <div style="font-weight:bold;">Zug ${this.moves.length}: ${move.player}</div>
                <div>${move.suit} ${move.value} <span style="color:#6c757d;">(${move.context})</span></div>
            `;
            
            container.insertBefore(div, container.firstChild);
            while (container.children.length > 6) {
                container.removeChild(container.lastChild);
            }
        },
        
        demoGame() {
            this.moves = [];
            for (let i = 0; i < 4; i++) {
                this.addMove();
            }
            setTimeout(() => this.showReview(), 500);
        },
        
        fullGame() {
            this.moves = [];
            for (let i = 0; i < 8; i++) {
                this.addMove();
            }
            setTimeout(() => this.showReview(), 500);
        },
        
        showReview() {
            if (this.moves.length === 0) return;
            
            document.getElementById('review').style.display = 'block';
            this.renderReview();
            document.getElementById('review').scrollIntoView({ behavior: 'smooth' });
        },
        
        renderReview() {
            const content = document.getElementById('review-content');
            
            content.innerHTML = `
                <div style="background:#e3f2fd;border-radius:8px;padding:15px;margin-bottom:15px;">
                    <h5 style="margin:0;color:#1976d2;">Spiel beendet - ${this.moves.length} Züge bewerten</h5>
                    <div style="font-size:12px;color:#555;margin:10px 0;">Bewerten Sie jeden Bot-Zug. Klicken Sie 👍 für gut, 👎 für schlecht oder 💡 für Verbesserungen.</div>
                    
                    <div id="moves-container">
                        ${this.renderMoves()}
                    </div>
                    
                    <div style="text-align:center;margin-top:15px;padding-top:15px;border-top:1px solid #dee2e6;">
                        <button onclick="postGameTraining.finishReview()" style="padding:10px 20px;background:#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">
                            ✅ Bewertung abschließen
                        </button>
                    </div>
                </div>
            `;
        },
        
        renderMoves() {
            return this.moves.map((move, index) => `
                <div id="move-${index}" style="background:white;border:1px solid #dee2e6;border-radius:6px;padding:12px;margin:8px 0;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                        <div>
                            <div style="font-weight:bold;">Zug ${index + 1}: ${move.player}</div>
                            <div style="font-size:16px;margin:4px 0;">${move.suit} ${move.value}</div>
                            <div style="font-size:11px;color:#6c757d;">${move.context}</div>
                        </div>
                        <div style="font-size:10px;color:#999;">${move.timestamp.toLocaleTimeString()}</div>
                    </div>
                    
                    <div style="display:flex;gap:6px;">
                        <button onclick="postGameTraining.rate(${index}, 'good')" style="flex:1;padding:8px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">👍 Gut</button>
                        <button onclick="postGameTraining.rate(${index}, 'bad')" style="flex:1;padding:8px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">👎 Schlecht</button>
                        <button onclick="postGameTraining.suggest(${index})" style="flex:1;padding:8px;background:#ffc107;color:black;border:none;border-radius:4px;cursor:pointer;font-size:12px;">💡 Besser...</button>
                    </div>
                    
                    <div id="rating-${index}" style="margin-top:8px;display:none;padding:8px;background:#f8f9fa;border-radius:4px;font-size:12px;"></div>
                </div>
            `).join('');
        },
        
        rate(index, type) {
            const move = this.moves[index];
            move.rating = type;
            
            this.stats.moves++;
            this.stats[type]++;
            
            const ratingDiv = document.getElementById(`rating-${index}`);
            const moveDiv = document.getElementById(`move-${index}`);
            
            const messages = {
                good: '👍 Als gut bewertet - Bot lernt diesen Zug zu wiederholen',
                bad: '👎 Als schlecht markiert - Bot vermeidet ähnliche Situationen',
                suggest: '💡 Verbesserungsvorschlag gespeichert'
            };
            
            const colors = {
                good: '#d4edda',
                bad: '#f8d7da', 
                suggest: '#fff3cd'
            };
            
            ratingDiv.innerHTML = `<strong>✅ Bewertet:</strong> ${messages[type]}`;
            ratingDiv.style.display = 'block';
            ratingDiv.style.background = colors[type];
            
            moveDiv.style.opacity = '0.8';
            moveDiv.style.borderColor = type === 'good' ? '#28a745' : type === 'bad' ? '#dc3545' : '#ffc107';
            
            this.updateDisplay();
        },
        
        suggest(index) {
            const move = this.moves[index];
            
            const dialog = document.createElement('div');
            dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border:2px solid #ffc107;border-radius:12px;padding:20px;z-index:10001;box-shadow:0 8px 32px rgba(0,0,0,0.3);width:400px;max-width:90vw;';
            
            dialog.innerHTML = `
                <h4 style="margin:0 0 15px 0;color:#ffc107;">💡 Verbesserungsvorschlag</h4>
                <div style="margin-bottom:15px;padding:12px;background:#fff3cd;border-radius:6px;color:#856404;">
                    <strong>${move.player}</strong> spielte <strong>${move.suit} ${move.value}</strong><br>
                    <small>${move.context}</small>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:5px;font-weight:bold;">Was wäre besser gewesen?</label>
                    <textarea id="suggestion" placeholder="z.B. 'Hätte Trump sparen sollen'" style="width:100%;height:80px;padding:8px;border:1px solid #ddd;border-radius:4px;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.remove()" style="padding:8px 16px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;">Abbrechen</button>
                    <button onclick="postGameTraining.saveSuggestion(${index}, document.getElementById('suggestion').value); this.parentElement.remove();" style="padding:8px 16px;background:#ffc107;color:black;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">💡 Speichern</button>
                </div>
            `;
            
            document.body.appendChild(dialog);
            setTimeout(() => document.getElementById('suggestion').focus(), 100);
        },
        
        saveSuggestion(index, text) {
            if (!text.trim()) {
                alert('Bitte geben Sie einen Vorschlag ein.');
                return;
            }
            
            this.moves[index].suggestion = text.trim();
            this.rate(index, 'suggest');
        },
        
        finishReview() {
            const rated = this.moves.filter(m => m.rating).length;
            
            if (rated === 0) {
                alert('Bitte bewerten Sie mindestens einen Zug!');
                return;
            }
            
            this.stats.games++;
            
            const success = document.createElement('div');
            success.style.cssText = 'position:fixed;top:60px;right:20px;background:#28a745;color:white;padding:15px;border-radius:8px;z-index:10002;animation:slideIn 0.3s;';
            success.innerHTML = `✅ Bewertung abgeschlossen! ${rated}/${this.moves.length} Züge bewertet.`;
            document.body.appendChild(success);
            
            setTimeout(() => success.remove(), 3000);
            
            document.getElementById('review').style.display = 'none';
            this.moves = [];
            this.updateDisplay();
        }
    };
    
    // CSS hinzufügen
    const style = document.createElement('style');
    style.textContent = '@keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }';
    document.head.appendChild(style);
    
    window.postGameTraining = training;
    window.enableHumanTraining = () => training.enable();
    window.disableHumanTraining = () => training.disable();
    window.getHumanFeedbackStats = () => training.stats;
    
    console.log('✅ Post-Game AI Training System vollständig geladen!');
    console.log('🎮 Kommandos:');
    console.log('   enableHumanTraining() - System aktivieren');
    console.log('   postGameTraining.demoGame() - Demo-Spiel testen');
    console.log('   postGameTraining.fullGame() - Vollspiel simulieren');
} style="margin:0 0 15px 0;color:#28a745;">📝 Post-Game Review</h4>
                            <div id="review-content"></div>
                        </div>
                        
                        <div id="live" style="display:none;border-top:1px solid #dee2e6;padding-top:12px;">
                            <div style="font-weight:bold;margin-bottom:8px;">🔴 Live Tracking</div>
                            <div id="live-moves" style="max-height:120px;overflow-y:auto;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(ui);
            this.ui = ui;
            this.updateDisplay();
        }
    };
    
    window.postGameTraining = training;
    window.enableHumanTraining = () => training.enable();
    
    console.log('✅ Post-Game Training System geladen!');
}
