/**
 * Emergency Human Training Fix
 * Direkte Implementation ohne Module-Imports
 */

function createEmergencyHumanTraining() {
    console.log('Erstelle Emergency Human Training System...');
    
    const emergencyHumanFeedback = {
        isEnabled: false,
        feedbackUI: null,
        
        enable() {
            this.isEnabled = true;
            this.createUI();
            console.log('Emergency Human Training aktiviert!');
            console.log('Du kannst jetzt AI-Zuege bewerten.');
        },
        
        disable() {
            this.isEnabled = false;
            this.removeUI();
            console.log('Human Training deaktiviert');
        },
        
        createUI() {
            if (this.feedbackUI) return;
            
            const container = document.createElement('div');
            container.id = 'emergency-feedback';
            container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                width: 280px;
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid #007bff;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 1000;
                font-family: Arial, sans-serif;
            `;
            
            container.innerHTML = `
                <div style="background: #007bff; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px 6px 0 0;">
                    <h3 style="margin: 0; font-size: 14px;">Emergency AI-Training</h3>
                    <button onclick="emergencyHumanTraining.disable()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
                </div>
                <div style="padding: 15px;">
                    <p>Emergency Human Training System aktiv!</p>
                    <p>Das vollstaendige System wird geladen...</p>
                    <button onclick="window.fixHumanTraining()" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Vollstaendiges System laden
                    </button>
                </div>
            `;
            
            document.body.appendChild(container);
            this.feedbackUI = container;
        },
        
        removeUI() {
            if (this.feedbackUI) {
                this.feedbackUI.remove();
                this.feedbackUI = null;
            }
        }
    };
    
    return emergencyHumanFeedback;
}

// Global verfügbar machen
if (typeof window !== 'undefined') {
    window.emergencyHumanTraining = createEmergencyHumanTraining();
    
    // Emergency enableHumanTraining falls das normale System nicht lädt
    if (!window.enableHumanTraining) {
        window.enableHumanTraining = () => {
            console.log('Verwende Emergency Human Training...');
            window.emergencyHumanTraining.enable();
            
            // Versuche das echte System im Hintergrund zu laden
            if (window.fixHumanTraining) {
                setTimeout(() => {
                    window.fixHumanTraining().then(success => {
                        if (success) {
                            console.log('Echtes Human Training System geladen!');
                            window.emergencyHumanTraining.disable();
                        }
                    });
                }, 2000);
            }
        };
    }
}