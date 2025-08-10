/**
 * Bayerisches Schafkopf - Kartensortierung
 * ES6 Module: Sortierung für Anzeige und Spiellogik
 */

/**
 * Sortiert Karten nach Schafkopf-Regeln für die Anzeige
 * Reihenfolge: Alle Ober (Eichel,Gras,Herz,Schelle), Alle Unter (Eichel,Gras,Herz,Schelle), 
 * Herz-Karten (Ass,10,K,9,8,7), andere Farben alphabetisch (Ass,10,K,9,8,7)
 * @param {Array} cards - Array von Karten
 * @returns {Array} Sortierte Karten
 */
export function sortCardsForDisplay(cards) {
    return cards.sort((a, b) => {
        // Definiere Anzeige-Prioritäten
        const getDisplayPriority = (card) => {
            // Ober haben höchste Priorität (100-110)
            if (card.value === 'ober') {
                switch (card.suit) {
                    case 'eichel': return 104;
                    case 'gras': return 103;
                    case 'herz': return 102;
                    case 'schellen': return 101;
                }
            }
            
            // Unter haben zweithöchste Priorität (90-99)
            if (card.value === 'unter') {
                switch (card.suit) {
                    case 'eichel': return 94;
                    case 'gras': return 93;
                    case 'herz': return 92;
                    case 'schellen': return 91;
                }
            }
            
            // Herz-Karten (außer Ober/Unter) haben Priorität 70-79 (NACH den Untern!)
            if (card.suit === 'herz') {
                return 70 + card.order;
            }
            
            // Andere Farben: Eichel(60-69), Gras(40-49), Schellen(20-29)
            let basePriority = 0;
            switch (card.suit) {
                case 'eichel': basePriority = 60; break;
                case 'gras': basePriority = 40; break;
                case 'schellen': basePriority = 20; break;
            }
            
            return basePriority + card.order;
        };
        
        return getDisplayPriority(b) - getDisplayPriority(a);
    });
}

/**
 * Sortiert Karten nach Schafkopf-Regeln für die Spiellogik
 * Trümpfe zuerst (nach Trumpf-Reihenfolge), dann Farben alphabetisch
 * @param {Array} cards - Array von Karten
 * @returns {Array} Sortierte Karten
 */
export function sortCards(cards) {
    return cards.sort((a, b) => {
        // Beide Trumpf: nach Trumpf-Reihenfolge sortieren
        if (a.isTrump && b.isTrump) {
            return b.trumpOrder - a.trumpOrder;
        }
        
        // Nur a ist Trumpf: a kommt zuerst
        if (a.isTrump && !b.isTrump) {
            return -1;
        }
        
        // Nur b ist Trumpf: b kommt zuerst
        if (!a.isTrump && b.isTrump) {
            return 1;
        }
        
        // Beide keine Trümpfe: erst nach Farbe, dann nach Wert sortieren
        if (a.suit !== b.suit) {
            return a.suit.localeCompare(b.suit);
        }
        
        return b.order - a.order;
    });
}

console.log('🃏 Card sorting module loaded');