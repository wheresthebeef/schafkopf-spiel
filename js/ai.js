/**
 * Bayerisches Schafkopf - KI-Spieler
 * Implementiert verschiedene KI-Strategien für CPU-Gegner
 * ERWEITERT: Berücksichtigt unbekannte Partnerschaften im Rufspiel
 */

/**
 * Hauptfunktion für KI-Kartenauswahl (ERWEITERT: Ruf-Ass-Regeln + unbekannte Partnerschaften)
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des KI-Spielers
 * @param {Object} gameContext - Aktueller Spielkontext
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithAI(playableCards, playerIndex, gameContext = null) {
    if (playableCards.length === 0) {
        console.error('AI: Keine spielbaren Karten verfügbar');
        return null;
    }
    
    if (playableCards.length === 1) {
        return playableCards[0];
    }
    
    // Kontext vorbereiten
    const context = gameContext || {
        currentTrick: gameState.currentTrick,
        trickNumber: gameState.trickNumber,
        players: gameState.players,
        completedTricks: gameState.completedTricks
    };
    
    // NEUE LOGIK: Ruf-Ass-Überlegungen für Partner
    if (gameState.gameType === 'rufspiel' && gameState.calledAce && 
        playerIndex === gameState.calledAcePlayer) {
        
        // Spezielle KI-Logik für den Partner mit dem gerufenen Ass
        const calledAceDecision = handleCalledAceAI(playableCards, playerIndex, context);
        if (calledAceDecision) {
            return calledAceDecision;
        }
    }
    
    // Schwierigkeitsgrad basierend auf Spieler (später konfigurierbar)
    const difficulty = getAIDifficulty(playerIndex);
    
    // NEU: Bei unbekannten Partnerschaften defensive Strategie
    const partnershipsKnown = hasCalledSuitBeenPlayed();
    
    // Strategie basierend auf Stichposition wählen
    if (context.currentTrick.length === 0) {
        return selectLeadCardAI(playableCards, playerIndex, context, difficulty, partnershipsKnown);
    } else {
        return selectFollowCardAI(playableCards, playerIndex, context, difficulty, partnershipsKnown);
    }
}

/**
 * Spezielle KI-Logik für den Partner mit dem gerufenen Ass
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des Partners
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte oder null (für normale KI-Logik)
 */
function handleCalledAceAI(playableCards, playerIndex, context) {
    const calledAce = gameState.players[playerIndex].cards.find(c => 
        c.suit === gameState.calledAce && c.value === 'sau'
    );
    
    // Prüfen ob Partner noch das gerufene Ass hat
    if (!calledAce) {
        return null; // Ass bereits gespielt - normale KI
    }
    
    const calledSuitCards = gameState.players[playerIndex].cards.filter(c => 
        c.suit === gameState.calledAce && !c.isTrump
    );
    
    const canRunAway = calledSuitCards.length >= 4;
    const hasCalledSuitBeenPlayed = hasCalledSuitBeenPlayed();
    
    // Debug-Ausgabe für Partner-KI
    if (gameState.debugMode) {
        console.log(`🤖💭 Partner-KI (${gameState.players[playerIndex].name}):`);
        console.log(`   Ruffarbe-Karten: ${calledSuitCards.length}`);
        console.log(`   Davonlaufen möglich: ${canRunAway}`);
        console.log(`   Ruffarbe bereits gespielt: ${hasCalledSuitBeenPlayed}`);
    }
    
    // Ausspielen: Davonlaufen-Strategie
    if (context.currentTrick.length === 0) {
        return handleCalledAceLeadAI(playableCards, calledAce, calledSuitCards, canRunAway, context);
    }
    
    // Folgen: Ass-Schutz-Strategie
    return handleCalledAceFollowAI(playableCards, calledAce, hasCalledSuitBeenPlayed, context);
}

/**
 * KI-Logik für Partner beim Ausspielen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} calledAce - Das gerufene Ass
 * @param {Array} calledSuitCards - Karten der Ruffarbe
 * @param {boolean} canRunAway - Kann davonlaufen
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte
 */
function handleCalledAceLeadAI(playableCards, calledAce, calledSuitCards, canRunAway, context) {
    // Strategie 1: Ruf-Ass ausspielen (KORRIGIERT: Jederzeit erlaubt!)
    if (playableCards.includes(calledAce)) {
        // Spät im Spiel: Ass eher ausspielen
        if (context.trickNumber >= 5) {
            if (gameState.debugMode) {
                console.log(`🎯 Partner spielt das gerufene Ass aus (spät im Spiel)`);
            }
            return calledAce;
        }
        
        // Früh im Spiel: 50% Chance das Ass auszuspielen
        if (Math.random() > 0.5) {
            if (gameState.debugMode) {
                console.log(`🎯 Partner spielt das gerufene Ass aus`);
            }
            return calledAce;
        }
    }
    
    // Strategie 2: Davonlaufen wenn möglich und früh im Spiel
    if (canRunAway && context.trickNumber < 4) {
        // Früh im Spiel: Davonlaufen mit niedriger Karte der Ruffarbe (NICHT das Ass)
        const lowCalledSuitCards = calledSuitCards.filter(c => 
            c.points === 0 && c !== calledAce
        );
        
        if (lowCalledSuitCards.length > 0) {
            if (gameState.debugMode) {
                console.log(`🏃 Partner läuft davon mit niedriger ${gameState.calledAce}-Karte`);
            }
            return lowCalledSuitCards[0];
        }
    }
    
    // Keine spezielle Ass-Strategie - normale KI verwenden
    return null;
}

/**
 * KI-Logik für Partner beim Folgen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} calledAce - Das gerufene Ass
 * @param {boolean} hasCalledSuitBeenPlayed - Wurde Ruffarbe bereits gespielt
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte
 */
function handleCalledAceFollowAI(playableCards, calledAce, hasCalledSuitBeenPlayed, context) {
    // Wenn das gerufene Ass spielbar ist (Sau-Zwang), wird es automatisch von validateCardPlay erzwungen
    // Die KI muss hier nichts besonderes tun - die Regeln sorgen schon dafür
    
    // Ass-Schutz: Vermeide das Ass abzuwerfen wenn noch nicht erlaubt
    if (playableCards.includes(calledAce) && !hasCalledSuitBeenPlayed) {
        const otherCards = playableCards.filter(c => c !== calledAce);
        if (otherCards.length > 0) {
            if (gameState.debugMode) {
                console.log(`🛡️ Partner schützt das gerufene Ass vor Abwurf`);
            }
            return otherCards[0]; // Nehme erste andere spielbare Karte
        }
    }
    
    // Keine spezielle Ass-Strategie - normale KI verwenden
    return null;
}

/**
 * KI-Ausspielen mit Partnerschafts-Bewusstsein
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {string} difficulty - Schwierigkeitsgrad
 * @param {boolean} partnershipsKnown - Sind Partnerschaften bekannt
 * @returns {Object} Ausgewählte Karte
 */
function selectLeadCardAI(playableCards, playerIndex, context, difficulty, partnershipsKnown) {
    // NEUE STRATEGIE: Spielende Partei spielt Trumpf aus
    if (partnershipsKnown && gameState.gameType === 'rufspiel') {
        const isPlayingParty = areTeammates(playerIndex, 0); // Team mit menschlichem Spieler
        
        if (isPlayingParty) {
            const trumpStrategy = selectTrumpLeadStrategy(playableCards, playerIndex, context);
            if (trumpStrategy) {
                return trumpStrategy;
            }
        }
    }
    
    // Bei unbekannten Partnerschaften: Vorsichtige Strategie
    if (!partnershipsKnown) {
        if (gameState.debugMode) {
            console.log(`🤖 ${gameState.players[playerIndex].name}: Spiele vorsichtig aus (Partnerschaften unbekannt)`);
        }
        
        // Niedrige bis mittlere Karten bevorzugen
        const safeCards = playableCards.filter(c => c.points <= 4);
        if (safeCards.length > 0) {
            return safeCards[Math.floor(Math.random() * safeCards.length)];
        }
    }
    
    // Standard-Ausspielen basierend auf Schwierigkeit
    switch (difficulty) {
        case 'easy':
            return playableCards[Math.floor(Math.random() * playableCards.length)];
            
        case 'medium':
            return selectLeadCardMedium(playableCards, context);
            
        case 'hard':
            return selectLeadCardHard(playableCards, context);
            
        default:
            return playableCards[0];
    }
}

/**
 * Strategische Trumpf-Ausspielen für die spielende Partei
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Trumpf-Karte oder null
 */
function selectTrumpLeadStrategy(playableCards, playerIndex, context) {
    const trumps = playableCards.filter(c => c.isTrump);
    
    if (trumps.length === 0) {
        return null; // Keine Trümpfe zum Ausspielen
    }
    
    // Bewerte Trumpf-Situation
    const playerCards = gameState.players[playerIndex].cards;
    const allTrumps = playerCards.filter(c => c.isTrump);
    const highTrumps = allTrumps.filter(c => c.trumpOrder >= 15); // Ober
    const lowTrumps = allTrumps.filter(c => c.trumpOrder < 15 && c.trumpOrder > 0);
    
    // Nur Trumpf ausspielen wenn genügend Trümpfe vorhanden
    if (allTrumps.length < 3) {
        if (gameState.debugMode) {
            console.log(`🤖 ${gameState.players[playerIndex].name}: Zu wenige Trümpfe (${allTrumps.length}) - kein Trumpf-Ausspielen`);
        }
        return null;
    }
    
    // NEUE STRATEGIE: Abwechselnd hohe und niedrige Trümpfe
    const trumpStrategy = determineTrumpPlayStrategy(playerIndex, context, highTrumps, lowTrumps);
    
    let selectedTrump = null;
    
    if (trumpStrategy === 'high' && highTrumps.length > 0) {
        // Hohen Trumpf ausspielen
        selectedTrump = highTrumps.reduce((highest, card) => 
            card.trumpOrder > highest.trumpOrder ? card : highest
        );
        
        if (gameState.debugMode) {
            console.log(`⚡ ${gameState.players[playerIndex].name}: Spiele hohen Trumpf aus (${selectedTrump.symbol}${selectedTrump.short})`);
        }
    } else if (trumpStrategy === 'low' && lowTrumps.length > 0) {
        // Niedrigen Trumpf ausspielen
        selectedTrump = lowTrumps.reduce((lowest, card) => 
            card.trumpOrder < lowest.trumpOrder ? card : lowest
        );
        
        if (gameState.debugMode) {
            console.log(`🎯 ${gameState.players[playerIndex].name}: Spiele niedrigen Trumpf aus (${selectedTrump.symbol}${selectedTrump.short})`);
        }
    }
    
    // Prüfen ob gewählter Trumpf spielbar ist
    if (selectedTrump && playableCards.includes(selectedTrump)) {
        return selectedTrump;
    }
    
    return null;
}

/**
 * Bestimmt die Trumpf-Ausspielen-Strategie
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} highTrumps - Hohe Trümpfe
 * @param {Array} lowTrumps - Niedrige Trümpfe
 * @returns {string} 'high', 'low' oder null
 */
function determineTrumpPlayStrategy(playerIndex, context, highTrumps, lowTrumps) {
    // Analysiere vergangene Trump-Ausspielen der spielenden Partei
    const playingPartyTrumpLeads = analyzePlayingPartyTrumpHistory(context);
    
    // Bestimme ob der letzte Trumpf-Ausspielen hoch oder niedrig war
    const lastTrumpLead = getLastTrumpLeadByPlayingParty(context);
    
    if (!lastTrumpLead) {
        // Erstes Trumpf-Ausspielen: Beginne mit niedrigem Trumpf
        if (lowTrumps.length > 0) {
            return 'low';
        } else if (highTrumps.length > 0) {
            return 'high';
        }
        return null;
    }
    
    // Abwechselnde Strategie: War letzter hoch → jetzt niedrig, war letzter niedrig → jetzt hoch
    if (lastTrumpLead.isHigh) {
        // Letzter war hoch → jetzt niedrig
        if (lowTrumps.length > 0) {
            return 'low';
        }
    } else {
        // Letzter war niedrig → jetzt hoch
        if (highTrumps.length > 0) {
            return 'high';
        }
    }
    
    // Fallback: Was verfügbar ist
    if (lowTrumps.length > 0) return 'low';
    if (highTrumps.length > 0) return 'high';
    return null;
}

/**
 * Analysiert Trumpf-Ausspielen-Verlauf der spielenden Partei
 * @param {Object} context - Spielkontext
 * @returns {Object} Analyse-Ergebnis
 */
function analyzePlayingPartyTrumpHistory(context) {
    let trumpLeads = 0;
    let highTrumpLeads = 0;
    let lowTrumpLeads = 0;
    
    // Durchsuche abgeschlossene Stiche
    for (const trick of context.completedTricks) {
        if (trick.cards.length > 0) {
            const leadCard = trick.cards[0].card;
            const leadPlayer = trick.cards[0].player;
            
            // Prüfen ob spielende Partei ausgespielt hat
            const isPlayingParty = areTeammates(leadPlayer, 0);
            
            if (isPlayingParty && leadCard.isTrump) {
                trumpLeads++;
                if (leadCard.trumpOrder >= 15) {
                    highTrumpLeads++;
                } else {
                    lowTrumpLeads++;
                }
            }
        }
    }
    
    return {
        totalTrumpLeads: trumpLeads,
        highTrumpLeads: highTrumpLeads,
        lowTrumpLeads: lowTrumpLeads,
        lastStrategy: lowTrumpLeads > highTrumpLeads ? 'low' : 'high'
    };
}

/**
 * Findet das letzte Trumpf-Ausspielen der spielenden Partei
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Letztes Trumpf-Ausspielen oder null
 */
function getLastTrumpLeadByPlayingParty(context) {
    // Rückwärts durch abgeschlossene Stiche gehen
    for (let i = context.completedTricks.length - 1; i >= 0; i--) {
        const trick = context.completedTricks[i];
        if (trick.cards.length > 0) {
            const leadCard = trick.cards[0].card;
            const leadPlayer = trick.cards[0].player;
            
            // Prüfen ob spielende Partei Trumpf ausgespielt hat
            const isPlayingParty = areTeammates(leadPlayer, 0);
            
            if (isPlayingParty && leadCard.isTrump) {
                return {
                    card: leadCard,
                    player: leadPlayer,
                    isHigh: leadCard.trumpOrder >= 15,
                    trickNumber: i
                };
            }
        }
    }
    
    return null;
}

/**
 * KI-Folgen mit Partnerschafts-Bewusstsein
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {string} difficulty - Schwierigkeitsgrad
 * @param {boolean} partnershipsKnown - Sind Partnerschaften bekannt
 * @returns {Object} Ausgewählte Karte
 */
function selectFollowCardAI(playableCards, playerIndex, context, difficulty, partnershipsKnown) {
    const leadCard = context.currentTrick[0].card;
    const currentHighest = getCurrentHighestCardInTrick(context.currentTrick);
    const canWin = playableCards.filter(c => isCardHigher(c, currentHighest));
    
    // Bei unbekannten Partnerschaften: IMMER versuchen zu stechen
    if (!partnershipsKnown && canWin.length > 0) {
        if (gameState.debugMode) {
            console.log(`🎯 ${gameState.players[playerIndex].name}: Steche da Partnerschaften unbekannt`);
        }
        return getLowestCard(canWin);
    }
    
    // Bei unbekannten Partnerschaften und kann nicht stechen: Niedrig abwerfen
    if (!partnershipsKnown && canWin.length === 0) {
        if (gameState.debugMode) {
            console.log(`🤷 ${gameState.players[playerIndex].name}: Kann nicht stechen, werfe niedrig ab`);
        }
        return getLowestCard(playableCards);
    }
    
    // Partnerschaften bekannt: Normale Team-Logik
    const currentWinner = getCurrentTrickWinner(context.currentTrick);
    if (!currentWinner) return playableCards[0];
    
    const isTeammate = areTeammates(playerIndex, currentWinner.playerIndex);
    
    if (canWin.length > 0) {
        if (isTeammate) {
            // Partner führt: Nur bei vielen Punkten übernehmen
            const trickPoints = getTrickPointsFromContext(context.currentTrick);
            if (trickPoints >= 20) {
                return getLowestCard(canWin);
            } else {
                return getHighestCard(playableCards); // Schmieren
            }
        } else {
            // Gegner führt: Stechen!
            return getLowestCard(canWin);
        }
    } else {
        // Kann nicht stechen
        if (isTeammate) {
            return getHighestCard(playableCards); // Schmieren
        } else {
            return getLowestCard(playableCards); // Abwerfen
        }
    }
}

/**
 * Mittlere Schwierigkeit beim Ausspielen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} context - Spielkontext
 * @returns {Object} Gewählte Karte
 */
function selectLeadCardMedium(playableCards, context) {
    // Früh im Spiel: Niedrige Karten ausspielen
    if (context.trickNumber < 3) {
        const lowCards = playableCards.filter(c => c.points <= 2);
        if (lowCards.length > 0) {
            return lowCards[Math.floor(Math.random() * lowCards.length)];
        }
    }
    
    // Spät im Spiel: Punkte holen
    if (context.trickNumber >= 6) {
        const highCards = playableCards.filter(c => c.points >= 10);
        if (highCards.length > 0) {
            return highCards[Math.floor(Math.random() * highCards.length)];
        }
    }
    
    // Standard: Mittlere Karte
    return playableCards[Math.floor(playableCards.length / 2)];
}

/**
 * Hohe Schwierigkeit beim Ausspielen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} context - Spielkontext
 * @returns {Object} Gewählte Karte
 */
function selectLeadCardHard(playableCards, context) {
    // Strategische Überlegungen
    const playerCards = context.players[context.currentPlayer] ? context.players[context.currentPlayer].cards : [];
    
    // 1. Kurze Farben ausspielen
    const suitCounts = {};
    playableCards.filter(c => !c.isTrump).forEach(card => {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });
    
    const shortSuits = playableCards.filter(card => 
        !card.isTrump && suitCounts[card.suit] <= 2 && card.points === 0
    );
    
    if (shortSuits.length > 0) {
        return shortSuits[0];
    }
    
    // 2. Fallback: Mittlere Strategie
    return selectLeadCardMedium(playableCards, context);
}

/**
 * Bestimmt Schwierigkeitsgrad für KI-Spieler
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} Schwierigkeitsgrad
 */
function getAIDifficulty(playerIndex) {
    const difficulties = ['medium', 'medium', 'hard'];
    return difficulties[playerIndex - 1] || 'medium';
}

/**
 * Hilfsfunktionen
 */
function getLowestCard(cards) {
    return cards.reduce((lowest, card) => {
        if (card.isTrump && lowest.isTrump) {
            return card.trumpOrder < lowest.trumpOrder ? card : lowest;
        }
        if (card.isTrump !== lowest.isTrump) {
            return !card.isTrump ? card : lowest;
        }
        return card.points < lowest.points ? card : lowest;
    });
}

function getHighestCard(cards) {
    return cards.reduce((highest, card) => {
        return card.points > highest.points ? card : highest;
    });
}

function getCurrentTrickWinner(trickCards) {
    if (!trickCards || trickCards.length === 0) return null;
    
    let winner = trickCards[0];
    for (let i = 1; i < trickCards.length; i++) {
        if (isCardHigher(trickCards[i].card, winner.card)) {
            winner = trickCards[i];
        }
    }
    
    return {
        playerIndex: winner.player,
        card: winner.card
    };
}

function getCurrentHighestCardInTrick(trickCards) {
    if (!trickCards || trickCards.length === 0) return null;
    
    let highest = trickCards[0].card;
    for (let i = 1; i < trickCards.length; i++) {
        if (isCardHigher(trickCards[i].card, highest)) {
            highest = trickCards[i].card;
        }
    }
    return highest;
}

function getTrickPointsFromContext(trickCards) {
    return trickCards.reduce((sum, tc) => sum + tc.card.points, 0);
}
