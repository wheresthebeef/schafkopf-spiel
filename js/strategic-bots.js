/**
 * Bayerisches Schafkopf - Strategische Bots
 * Implementiert verschiedene Bot-Strategien für CPU-Gegner
 * ERWEITERT: Berücksichtigt unbekannte Partnerschaften im Rufspiel
 */

/**
 * Hauptfunktion für Bot-Kartenauswahl (ERWEITERT: Ruf-Ass-Regeln + unbekannte Partnerschaften)
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des Bot-Spielers
 * @param {Object} gameContext - Aktueller Spielkontext
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithBot(playableCards, playerIndex, gameContext = null) {
    if (playableCards.length === 0) {
        console.error('Bot: Keine spielbaren Karten verfügbar');
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
        
        // Spezielle Bot-Logik für den Partner mit dem gerufenen Ass
        const calledAceDecision = handleCalledAceBot(playableCards, playerIndex, context);
        if (calledAceDecision) {
            return calledAceDecision;
        }
    }
    
    // Schwierigkeitsgrad basierend auf Spieler (später konfigurierbar)
    const difficulty = getBotDifficulty(playerIndex);
    
    // NEU: Bei unbekannten Partnerschaften defensive Strategie
    const partnershipsKnown = hasCalledSuitBeenPlayed();
    
    // Strategie basierend auf Stichposition wählen
    if (context.currentTrick.length === 0) {
        return selectLeadCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown);
    } else {
        return selectFollowCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown);
    }
}

/**
 * Prüft ob ein Trumpf noch überstochen werden kann
 * @param {Object} trumpCard - Der führende Trumpf
 * @param {Object} context - Spielkontext
 * @returns {boolean} Kann überstochen werden
 */
function canTrumpBeOvertrumped(trumpCard, context) {
    // KORREKTE Trumpfreihenfolge der Ober
    const allTrumps = [
        { suit: 'eichel', value: 'ober', trumpOrder: 19 },    // HÖCHSTER
        { suit: 'gras', value: 'ober', trumpOrder: 18 },
        { suit: 'herz', value: 'ober', trumpOrder: 17 },
        { suit: 'schellen', value: 'ober', trumpOrder: 16 },
        { suit: 'eichel', value: 'unter', trumpOrder: 15 },
        { suit: 'gras', value: 'unter', trumpOrder: 14 },
        { suit: 'herz', value: 'unter', trumpOrder: 13 },
        { suit: 'schellen', value: 'unter', trumpOrder: 12 }
    ];
    
    const higherTrumps = allTrumps.filter(t => t.trumpOrder > trumpCard.trumpOrder);
    
    // Prüfe welche höheren Trümpfe bereits gespielt wurden
    const playedCards = getPlayedCards(context);
    const playedTrumps = playedCards.filter(c => c.isTrump);
    
    const availableHigherTrumps = higherTrumps.filter(higherTrump => {
        return !playedTrumps.some(played => 
            played.suit === higherTrump.suit && 
            played.value === higherTrump.value
        );
    });
    
    if (gameState.debugMode) {
        console.log(`🔍 ${trumpCard.symbol}${trumpCard.short} kann von ${availableHigherTrumps.length} Trümpfen überstochen werden`);
        if (availableHigherTrumps.length > 0) {
            console.log(`   Verfügbare höhere Trümpfe:`, availableHigherTrumps.map(t => `${t.suit} ${t.value}`));
        }
    }
    
    return availableHigherTrumps.length > 0;
}

/**
 * Findet die beste Trumpf-Karte zum "Schmieren" bei unschlagbarem Partner-Trumpf
 * @param {Array} playableCards - Spielbare Karten (bereits nur Trümpfe!)
 * @returns {Object} Beste Trumpf-Schmier-Karte
 */
function findBestSchmierForGuaranteedWin(playableCards) {
    // WICHTIG: playableCards enthält bei Trumpfzwang nur Trümpfe!
    
    // Priorität 1: Herz-Schmiere (hohe Herz-Karten die Trumpf sind)
    const herzSchmiere = playableCards.filter(c => 
        c.isTrump && c.suit === 'herz' && 
        (c.value === 'sau' || c.value === 'zehn' || c.value === 'koenig')
    );
    
    if (herzSchmiere.length > 0) {
        // Höchste Herz-Schmiere
        const bestHerzSchmier = herzSchmiere.reduce((highest, card) => 
            card.points > highest.points ? card : highest
        );
        
        if (gameState.debugMode) {
            console.log(`♥️ Herz-Schmiere gefunden: ${bestHerzSchmier.symbol}${bestHerzSchmier.short} (${bestHerzSchmier.points} Punkte)`);
        }
        return bestHerzSchmier;
    }
    
    // Priorität 2: Kleinster verfügbarer Trumpf
    const smallestTrump = getLowestCard(playableCards);
    
    if (gameState.debugMode) {
        console.log(`🎯 Kein Herz zum Schmieren - spiele kleinsten Trumpf: ${smallestTrump.symbol}${smallestTrump.short}`);
    }
    
    return smallestTrump;
}

/**
 * Holt alle bereits gespielten Karten aus dem Spielverlauf
 * @param {Object} context - Spielkontext
 * @returns {Array} Bereits gespielte Karten
 */
function getPlayedCards(context) {
    const playedCards = [];
    
    // Sammle Karten aus abgeschlossenen Stichen
    for (const trick of context.completedTricks) {
        for (const trickCard of trick.cards) {
            playedCards.push(trickCard.card);
        }
    }
    
    // Sammle Karten aus aktuellem Stich
    for (const trickCard of context.currentTrick) {
        playedCards.push(trickCard.card);
    }
    
    return playedCards;
}

/**
 * Spezielle Bot-Logik für den Partner mit dem gerufenen Ass
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des Partners
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte oder null (für normale KI-Logik)
 */
function handleCalledAceBot(playableCards, playerIndex, context) {
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
    
    // Debug-Ausgabe für Partner-Bot
    if (gameState.debugMode) {
        console.log(`🤖💭 Partner-Bot (${gameState.players[playerIndex].name}):`);
        console.log(`   Ruffarbe-Karten: ${calledSuitCards.length}`);
        console.log(`   Davonlaufen möglich: ${canRunAway}`);
        console.log(`   Ruffarbe bereits gespielt: ${hasCalledSuitBeenPlayed}`);
    }
    
    // Ausspielen: Davonlaufen-Strategie
    if (context.currentTrick.length === 0) {
        return handleCalledAceLeadBot(playableCards, calledAce, calledSuitCards, canRunAway, context);
    }
    
    // Folgen: Ass-Schutz-Strategie
    return handleCalledAceFollowBot(playableCards, calledAce, hasCalledSuitBeenPlayed, context);
}

/**
 * Bot-Logik für Partner beim Ausspielen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} calledAce - Das gerufene Ass
 * @param {Array} calledSuitCards - Karten der Ruffarbe
 * @param {boolean} canRunAway - Kann davonlaufen
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte
 */
function handleCalledAceLeadBot(playableCards, calledAce, calledSuitCards, canRunAway, context) {
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
    
    // Keine spezielle Ass-Strategie - normale Bot-Logik verwenden
    return null;
}

/**
 * Prüft ob ein Mitspieler (Teammate) den Stich noch gewinnen könnte
 * @param {number} playerIndex - Aktueller Spieler Index
 * @param {Object} context - Spielkontext
 * @param {number} lastPlayerIndex - Index des letzten Spielers
 * @returns {boolean} Könnte Mitspieler stechen
 */
function checkIfTeammateCouldWinTrick(playerIndex, context, lastPlayerIndex) {
    // Prüfe alle noch kommenden Spieler
    const currentTrickLength = context.currentTrick.length;
    const playersToGo = 4 - currentTrickLength;
    
    for (let i = 1; i <= playersToGo; i++) {
        const upcomingPlayerIndex = (playerIndex + i) % 4;
        
        // Ist dieser Spieler ein Mitspieler?
        const isTeammate = areTeammates(playerIndex, upcomingPlayerIndex);
        
        if (isTeammate) {
            // Wahrscheinlichkeit dass Mitspieler stechen kann
            const couldWin = estimateTeammateWinChance(upcomingPlayerIndex, context);
            
            if (couldWin > 0.3) { // 30% Chance oder höher
                if (gameState.debugMode) {
                    console.log(`🎯 Mitspieler ${gameState.players[upcomingPlayerIndex].name} könnte stechen (${Math.round(couldWin * 100)}%)`);
                }
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Schätzt die Chance dass ein Mitspieler den Stich gewinnen kann
 * @param {number} teammateIndex - Mitspieler Index
 * @param {Object} context - Spielkontext
 * @returns {number} Wahrscheinlichkeit (0.0 - 1.0)
 */
function estimateTeammateWinChance(teammateIndex, context) {
    const currentHighest = getCurrentHighestCardInTrick(context.currentTrick);
    
    // Vereinfachte Wahrscheinlichkeits-Schätzung
    // In echtem Schafkopf würde man die bereits gespielten Karten zählen
    
    if (currentHighest.isTrump) {
        // Trumpf führt: Mitspieler braucht höheren Trumpf
        if (currentHighest.trumpOrder >= 17) { // Eichel/Gras Ober
            return 0.1; // Nur noch Herz Ober kann stechen
        } else if (currentHighest.trumpOrder >= 15) { // Herz/Schellen Ober  
            return 0.3; // Eichel/Gras Ober können stechen
        } else if (currentHighest.trumpOrder >= 10) { // Unter
            return 0.6; // Alle Ober können stechen
        } else {
            return 0.8; // Ober und Unter können stechen
        }
    } else {
        // Farbe führt: Mitspieler kann mit Trumpf stechen
        return 0.7; // Hohe Chance auf Trumpf
    }
}

/**
 * Findet die beste Karte zum Schmieren (falls Mitspieler stechen könnte)
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Beste Schmier-Karte
 */
function getBestSchmierCard(playableCards, context) {
    const leadCard = context.currentTrick[0].card;
    
    if (leadCard.isTrump) {
        // TRUMPF AUSGESPIELT: Beste Schmier-Karte aus allen Karten
        
        // Priorität 1: ECHTE hohe Punkte (Sau=11, Zehn=10)
        const highValueCards = playableCards.filter(c => 
            !c.isTrump && (c.value === 'sau' || c.value === 'zehn')
        );
        if (highValueCards.length > 0) {
            return highValueCards.reduce((highest, card) => 
                card.points > highest.points ? card : highest
            );
        }
        
        // Priorität 2: Mittlere Punkte (König=4) - KEINE Ober/Unter!
        const mediumValueCards = playableCards.filter(c => 
            !c.isTrump && c.points >= 4 && c.value !== 'ober' && c.value !== 'unter'
        );
        if (mediumValueCards.length > 0) {
            return mediumValueCards.reduce((highest, card) => 
                card.points > highest.points ? card : highest
            );
        }
        
        // Priorität 3: Niedrigste verfügbare Karte
        return getLowestCard(playableCards);
        
    } else {
        // FARBE AUSGESPIELT: Schmiere aus der angespielten Farbe
        const leadSuit = leadCard.suit;
        const suitCards = playableCards.filter(c => !c.isTrump && c.suit === leadSuit);
        
        if (suitCards.length > 0) {
            // Höchste Karte der Farbe (aber KEINE Ober/Unter)
            const nonTrumpSuitCards = suitCards.filter(c => 
                c.value !== 'ober' && c.value !== 'unter'
            );
            
            if (nonTrumpSuitCards.length > 0) {
                return nonTrumpSuitCards.reduce((highest, card) => 
                    card.points > highest.points ? card : highest
                );
            }
            
            // Falls nur Ober/Unter der Farbe: Niedrigsten nehmen
            return getLowestCard(suitCards);
        }
        
        // Keine Farbe: Standard Schmier-Logik
        return getBestSchmierCard(playableCards, {...context, currentTrick: [{card: {isTrump: true}, player: 0}]});
    }
}

/**
 * NEUE FUNKTION: Behandelt Folgen wenn TRUMPF ausgespielt wurde
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Bot-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} canWin - Karten die stechen können
 * @param {boolean} isLastPlayer - Ist der letzte Spieler
 * @param {boolean} partnershipsKnown - Sind Partnerschaften bekannt
 * @returns {Object} Gewählte Karte
 */
function handleTrumpLeadFollow(playableCards, playerIndex, context, canWin, isLastPlayer, partnershipsKnown) {
    // REGEL: Bei Trumpf-Ausspielen MUSS Trumpf bedient werden (wenn vorhanden)
    const trumpCards = playableCards.filter(c => c.isTrump);
    
    if (gameState.debugMode) {
        console.log(`⚡ Trumpf wurde ausgespielt - ${gameState.players[playerIndex].name} hat ${trumpCards.length} Trümpfe`);
    }
    
    // Kein Trumpf vorhanden: Abwerfen (sollte nicht passieren bei korrekten Regeln)
    if (trumpCards.length === 0) {
        if (gameState.debugMode) {
            console.log(`🗑️ Kein Trumpf - werfe ab`);
        }
        return getLowestCard(playableCards);
    }
    
    // Bei unbekannten Partnerschaften: Immer versuchen zu stechen
    if (!partnershipsKnown) {
        if (canWin.length > 0) {
            return getLowestCard(canWin);
        } else {
            return getLowestCard(trumpCards);
        }
    }
    
    // Partnerschaften bekannt: Intelligente Trumpf-Strategie
    const currentWinner = getCurrentTrickWinner(context.currentTrick);
    if (!currentWinner) return trumpCards[0];
    
    const isTeammate = areTeammates(playerIndex, currentWinner.playerIndex);
    const trickPoints = getTrickPointsFromContext(context.currentTrick);
    
    if (isTeammate) {
        // PARTNER FÜHRT MIT TRUMPF: Prüfe ob überstechbar!
        const leadCard = context.currentTrick[0].card;
        const canBeOvertrumped = canTrumpBeOvertrumped(leadCard, context);
        
        if (!canBeOvertrumped) {
            // Partner führt UNSCHLAGBAR: MAXIMALES SCHMIEREN!
            if (gameState.debugMode) {
                console.log(`🎆 Partner führt unschlagbar mit ${leadCard.symbol}${leadCard.short} - SCHMIERE MAXIMAL!`);
            }
            
            // Finde höchste Schmier-Karte (auch hohe Trümpfe erlaubt!)
            const bestSchmier = findBestSchmierForGuaranteedWin(playableCards);
            if (bestSchmier) {
                if (gameState.debugMode) {
                    console.log(`💎 Schmiere: ${bestSchmier.symbol}${bestSchmier.short} (${bestSchmier.points} Punkte)`);
                }
                return bestSchmier;
            }
        } else {
            // Partner könnte überstochen werden: Niedrigsten Trumpf
            if (gameState.debugMode) {
                console.log(`🤝 Partner könnte überstochen werden - spiele niedrigsten Trumpf`);
            }
        }
        
        return getLowestCard(trumpCards);
        
    } else {
        // GEGNER FÜHRT MIT TRUMPF: Komplexe Strategie
        const nextPlayerIndex = getNextPlayerIndex(playerIndex);
        const lastPlayerIndex = getLastPlayerIndex(context.currentTrick.length);
        
        if (canWin.length > 0) {
            // Kann stechen: Nur bei vielen Punkten oder als letzter Spieler
            if (trickPoints >= 10 || isLastPlayer) {
                if (gameState.debugMode) {
                    console.log(`⚔️ Steche Gegner-Trumpf mit ${canWin[0].symbol}${canWin[0].short}`);
                }
                return getLowestCard(canWin);
            } else {
                // Wenige Punkte: Schaue ob nachfolgender Mitspieler stechen könnte
                const couldTeammateWin = checkIfTeammateCouldWinTrick(playerIndex, context, lastPlayerIndex);
                
                if (couldTeammateWin) {
                    // Mitspieler könnte stechen: Schmiere für den Fall!
                    const schmierCard = getBestSchmierCard(playableCards, context);
                    if (schmierCard) {
                        if (gameState.debugMode) {
                            console.log(`🤝 Mitspieler könnte stechen - schmiere ${schmierCard.symbol}${schmierCard.short}`);
                        }
                        return schmierCard;
                    }
                }
                
                // Normale Logik: Spare hohe Trümpfe
                if (gameState.debugMode) {
                    console.log(`💰 Spare hohe Trümpfe - wenige Punkte im Stich`);
                }
                return getLowestCard(trumpCards);
            }
        } else {
            // Kann nicht stechen: Prüfe ob Mitspieler stechen könnte
            const couldTeammateWin = checkIfTeammateCouldWinTrick(playerIndex, context, lastPlayerIndex);
            
            if (couldTeammateWin) {
                // Mitspieler könnte stechen: Schmiere!
                const schmierCard = getBestSchmierCard(playableCards, context);
                if (schmierCard) {
                    if (gameState.debugMode) {
                        console.log(`🎆 Mitspieler könnte stechen - schmiere ${schmierCard.symbol}${schmierCard.short}`);
                    }
                    return schmierCard;
                }
            }
            
            // Kann nicht stechen: Niedrigsten Trumpf
            if (gameState.debugMode) {
                console.log(`🗑️ Kann nicht stechen - niedrigster Trumpf`);
            }
            return getLowestCard(trumpCards);
        }
    }
}

/**
 * NEUE FUNKTION: Behandelt Folgen wenn FARBE ausgespielt wurde
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Bot-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} canWin - Karten die stechen können
 * @param {boolean} isLastPlayer - Ist der letzte Spieler
 * @param {boolean} partnershipsKnown - Sind Partnerschaften bekannt
 * @returns {Object} Gewählte Karte
 */
function handleColorLeadFollow(playableCards, playerIndex, context, canWin, isLastPlayer, partnershipsKnown) {
    const leadCard = context.currentTrick[0].card;
    const leadSuit = leadCard.suit;
    
    // REGEL: Farbe bedienen wenn vorhanden
    const suitCards = playableCards.filter(c => !c.isTrump && c.suit === leadSuit);
    
    if (gameState.debugMode) {
        console.log(`🎨 Farbe ${leadSuit} ausgespielt - ${gameState.players[playerIndex].name} hat ${suitCards.length} Karten dieser Farbe`);
    }
    
    if (suitCards.length > 0) {
        // FARBE BEDIENEN: Normale Positions-bewusste Logik
        return selectPositionAwareFollow(
            playableCards, playerIndex, context, canWin, isLastPlayer
        );
    } else {
        // KEINE FARBE: Stechen oder abwerfen
        if (gameState.debugMode) {
            console.log(`🃏 Keine ${leadSuit} - kann stechen oder abwerfen`);
        }
        
        if (!partnershipsKnown) {
            return selectUnknownPartnershipFollow(playableCards, canWin);
        }
        
        return selectPositionAwareFollow(
            playableCards, playerIndex, context, canWin, isLastPlayer
        );
    }
}

/**
 * Prüft ob Partner eine bestimmte Farbe nicht hat
 * @param {number} partnerIndex - Partner Index
 * @param {string} suit - Farbe
 * @param {Object} context - Spielkontext
 * @returns {boolean} Hat Partner diese Farbe nicht
 */
function checkIfPartnerLacksColor(partnerIndex, suit, context) {
    // Durchsuche vergangene Stiche
    for (const trick of context.completedTricks) {
        if (trick.cards.length > 0) {
            const leadCard = trick.cards[0].card;
            
            // Wenn diese Farbe angespielt wurde
            if (!leadCard.isTrump && leadCard.suit === suit) {
                // Finde was Partner gespielt hat
                const partnerCard = trick.cards.find(tc => tc.player === partnerIndex);
                
                if (partnerCard) {
                    // Partner hat nicht bedient = er hat diese Farbe nicht
                    if (partnerCard.card.isTrump || partnerCard.card.suit !== suit) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

/**
 * Hilfsfunktionen für verbesserte Bots
 */
function getLastPlayerIndex(currentTrickLength) {
    // Bei 4 Spielern ist der letzte Spieler derjenige, der als 4. spielt
    const startPlayer = gameState.currentTrick.length > 0 ? 
        gameState.currentTrick[0].player : gameState.currentPlayer;
    return (startPlayer + 3) % 4;
}

function getNextPlayerIndex(currentPlayerIndex) {
    return (currentPlayerIndex + 1) % 4;
}

function getLowestTrump(trumps) {
    return trumps.reduce((lowest, card) => 
        card.trumpOrder < lowest.trumpOrder ? card : lowest
    );
}

function getHighestTrump(trumps) {
    return trumps.reduce((highest, card) => 
        card.trumpOrder > highest.trumpOrder ? card : highest
    );
}

function hasColorBeenLed(suit, context) {
    for (const trick of context.completedTricks) {
        if (trick.cards.length > 0) {
            const leadCard = trick.cards[0].card;
            if (!leadCard.isTrump && leadCard.suit === suit) {
                return true;
            }
        }
    }
    return false;
}

function getColorsPlayedByPlayer(playerIndex, context) {
    const colors = new Set();
    for (const trick of context.completedTricks) {
        const playerCard = trick.cards.find(tc => tc.player === playerIndex);
        if (playerCard && !playerCard.card.isTrump) {
            colors.add(playerCard.card.suit);
        }
    }
    return Array.from(colors);
}

function getColorsLedInGame(context) {
    const colors = new Set();
    for (const trick of context.completedTricks) {
        if (trick.cards.length > 0) {
            const leadCard = trick.cards[0].card;
            if (!leadCard.isTrump) {
                colors.add(leadCard.suit);
            }
        }
    }
    return Array.from(colors);
}

function selectUnknownPartnershipFollow(playableCards, canWin) {
    if (canWin.length > 0) {
        return getLowestCard(canWin);
    } else {
        return getLowestCard(playableCards);
    }
}

function selectCautiousLeadStrategy(playableCards, playerIndex, context) {
    const lowCards = playableCards.filter(c => c.points <= 2);
    if (lowCards.length > 0) {
        return lowCards[Math.floor(Math.random() * lowCards.length)];
    }
    return playableCards[0];
}

function selectStandardLeadStrategy(playableCards, context, difficulty) {
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
 * Bot-Logik für Partner beim Folgen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} calledAce - Das gerufene Ass
 * @param {boolean} hasCalledSuitBeenPlayed - Wurde Ruffarbe bereits gespielt
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte
 */
function handleCalledAceFollowBot(playableCards, calledAce, hasCalledSuitBeenPlayed, context) {
    // Wenn das gerufene Ass spielbar ist (Sau-Zwang), wird es automatisch von validateCardPlay erzwungen
    // Der Bot muss hier nichts besonderes tun - die Regeln sorgen schon dafür
    
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
    
    // Keine spezielle Ass-Strategie - normale Bot-Logik verwenden
    return null;
}

/**
 * VERBESSERTE Bot-Ausspielen mit verbesserter Partner-Logik
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Bot-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {string} difficulty - Schwierigkeitsgrad
 * @param {boolean} partnershipsKnown - Sind Partnerschaften bekannt
 * @returns {Object} Ausgewählte Karte
 */
function selectLeadCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown) {
    if (gameState.debugMode) {
        console.log(`🤖 ${gameState.players[playerIndex].name} spielt aus:`, {
            handCards: playableCards.length,
            partnershipsKnown,
            trickNumber: context.trickNumber
        });
    }

    // NEUE PRIORITÄT 1: Partner spielt konsequent Trumpf aus
    if (partnershipsKnown && gameState.gameType === 'rufspiel') {
        const isPlayingParty = areTeammates(playerIndex, 0);
        
        if (isPlayingParty) {
            const trumpStrategy = selectImprovedTrumpLeadStrategy(playableCards, playerIndex, context);
            if (trumpStrategy) {
                return trumpStrategy;
            }
        }
    }

    // NEUE PRIORITÄT 2: Gegner-Strategien gegen die spielende Partei
    if (partnershipsKnown && gameState.gameType === 'rufspiel') {
        const isPlayingParty = areTeammates(playerIndex, 0);
        
        if (!isPlayingParty) {
            const counterStrategy = selectCounterStrategy(playableCards, playerIndex, context);
            if (counterStrategy) {
                return counterStrategy;
            }
        }
    }

    // Fallback: Ursprüngliche Logik für unbekannte Partnerschaften
    if (!partnershipsKnown) {
        return selectCautiousLeadStrategy(playableCards, playerIndex, context);
    }

    // Standard-Ausspielen basierend auf Schwierigkeit
    return selectStandardLeadStrategy(playableCards, context, difficulty);
}

/**
 * VERBESSERTE Trumpf-Ausspielen-Strategie für Partner
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Bot-Spieler Index
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Trumpf-Karte oder null
 */
function selectImprovedTrumpLeadStrategy(playableCards, playerIndex, context) {
    const trumps = playableCards.filter(c => c.isTrump);
    
    if (trumps.length === 0) {
        if (gameState.debugMode) {
            console.log(`🤖 ${gameState.players[playerIndex].name}: Keine Trümpfe zum Ausspielen`);
        }
        return null;
    }

    const playerCards = gameState.players[playerIndex].cards;
    const allTrumps = playerCards.filter(c => c.isTrump);
    
    // REGEL 1: Partner sollte IMMER Trumpf ausspielen wenn er welche hat (außer in speziellen Situationen)
    const shouldPlayTrump = decideShouldPlayTrump(playerIndex, context, allTrumps, playableCards);
    
    if (!shouldPlayTrump) {
        if (gameState.debugMode) {
            console.log(`🤖 ${gameState.players[playerIndex].name}: Spiele ausnahmsweise keinen Trumpf`);
        }
        return null;
    }

    // REGEL 2: Intelligente Trumpf-Auswahl basierend auf Spielsituation
    const selectedTrump = selectBestTrumpForSituation(trumps, playerIndex, context, allTrumps);
    
    if (playableCards.includes(selectedTrump)) {
        if (gameState.debugMode) {
            console.log(`⚡ ${gameState.players[playerIndex].name}: Spiele Trumpf aus: ${selectedTrump.symbol}${selectedTrump.short}`);
        }
        return selectedTrump;
    }

    return null;
}

/**
 * Bestimmt die Trumpf-Ausspielen-Strategie
 * @param {number} playerIndex - Bot-Spieler Index
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
 * VERBESSERTE Folgen-Logik mit korrekter Trumpf-Bedienung
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Bot-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {string} difficulty - Schwierigkeitsgrad
 * @param {boolean} partnershipsKnown - Sind Partnerschaften bekannt
 * @returns {Object} Ausgewählte Karte
 */
function selectFollowCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown) {
    const leadCard = context.currentTrick[0].card;
    const currentHighest = getCurrentHighestCardInTrick(context.currentTrick);
    const canWin = playableCards.filter(c => isCardHigher(c, currentHighest));

    // NEUE LOGIK: Berücksichtige Position des letzten Spielers
    const lastPlayerIndex = getLastPlayerIndex(context.currentTrick.length);
    const isLastPlayer = (playerIndex === lastPlayerIndex);
    
    if (gameState.debugMode) {
        console.log(`🤖 ${gameState.players[playerIndex].name} folgt:`, {
            leadCard: `${leadCard.symbol}${leadCard.short}`,
            leadIsTrump: leadCard.isTrump,
            isLastPlayer,
            canWin: canWin.length,
            partnershipsKnown
        });
    }

    // KRITISCHE REGEL: Unterscheide zwischen Trumpf- und Farb-Ausspielen!
    if (leadCard.isTrump) {
        // TRUMPF AUSGESPIELT: Spezielle Trumpf-Folge-Logik
        return handleTrumpLeadFollow(playableCards, playerIndex, context, canWin, isLastPlayer, partnershipsKnown);
    } else {
        // FARBE AUSGESPIELT: Normale Farb-Folge-Logik
        return handleColorLeadFollow(playableCards, playerIndex, context, canWin, isLastPlayer, partnershipsKnown);
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
 * Bestimmt Schwierigkeitsgrad für Bot-Spieler
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} Schwierigkeitsgrad
 */
function getBotDifficulty(playerIndex) {
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

/**
 * NEUE HILFSFUNKTIONEN FÜR VERBESSERTE AI
 */

/**
 * Entscheidet ob Partner Trumpf ausspielen sollte
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} allTrumps - Alle Trümpfe in der Hand
 * @param {Array} playableCards - Spielbare Karten
 * @returns {boolean} Soll Trumpf gespielt werden
 */
function decideShouldPlayTrump(playerIndex, context, allTrumps, playableCards) {
    // Ausnahme 1: Nur noch ein Trumpf und viele hohe Farbkarten
    if (allTrumps.length === 1) {
        const highColorCards = playableCards.filter(c => 
            !c.isTrump && c.points >= 10
        );
        
        if (highColorCards.length >= 2 && context.trickNumber < 6) {
            if (gameState.debugMode) {
                console.log(`🤖 Partner spart letzten Trumpf, hat ${highColorCards.length} hohe Farbkarten`);
            }
            return false;
        }
    }

    // Ausnahme 2: Sehr spätes Spiel (letzte 2 Stiche) und Partner kann definitiv punkten
    if (context.trickNumber >= 7) {
        const guaranteedWinners = playableCards.filter(c => 
            !c.isTrump && c.value === 'sau' && !hasColorBeenLed(c.suit, context)
        );
        
        if (guaranteedWinners.length > 0) {
            if (gameState.debugMode) {
                console.log(`🤖 Partner spielt Sau statt Trumpf (spätes Spiel)`);
            }
            return false;
        }
    }

    // Standard: Partner spielt fast immer Trumpf
    return true;
}

/**
 * Wählt den besten Trumpf für die aktuelle Situation
 * @param {Array} trumps - Verfügbare Trümpfe
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} allTrumps - Alle Trümpfe in der Hand
 * @returns {Object} Bester Trumpf
 */
function selectBestTrumpForSituation(trumps, playerIndex, context, allTrumps) {
    const highTrumps = trumps.filter(c => c.trumpOrder >= 15); // Ober
    const midTrumps = trumps.filter(c => c.trumpOrder >= 10 && c.trumpOrder < 15); // Unter
    const lowTrumps = trumps.filter(c => c.trumpOrder < 10); // Herz-Trümpfe

    // Frühe Spielphase (Stiche 1-3): Niedrige Trümpfe ziehen
    if (context.trickNumber <= 3) {
        if (lowTrumps.length > 0) {
            return getLowestTrump(lowTrumps);
        }
        if (midTrumps.length > 0) {
            return getLowestTrump(midTrumps);
        }
        return getLowestTrump(highTrumps);
    }

    // Mittlere Spielphase (Stiche 4-6): Ausgewogen
    if (context.trickNumber <= 6) {
        // Wenn Partner viele Trümpfe hat: Niedrig beginnen
        if (allTrumps.length >= 4) {
            if (lowTrumps.length > 0) return getLowestTrump(lowTrumps);
            if (midTrumps.length > 0) return getLowestTrump(midTrumps);
        }
        
        // Standardfall: Mittleren Trumpf
        if (midTrumps.length > 0) return getHighestTrump(midTrumps);
        if (lowTrumps.length > 0) return getHighestTrump(lowTrumps);
        return getLowestTrump(highTrumps);
    }

    // Späte Spielphase (Stiche 7-8): Hohe Trümpfe einsetzen
    if (highTrumps.length > 0) {
        return getHighestTrump(highTrumps);
    }
    if (midTrumps.length > 0) {
        return getHighestTrump(midTrumps);
    }
    return getHighestTrump(lowTrumps);
}

/**
 * NEUE Gegner-Strategie gegen spielende Partei
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @returns {Object|null} Gewählte Karte oder null
 */
function selectCounterStrategy(playableCards, playerIndex, context) {
    if (gameState.debugMode) {
        console.log(`🛡️ ${gameState.players[playerIndex].name}: Spiele Gegner-Strategie`);
    }

    // Strategie 1: Sau ausspielen wenn sicher
    const safeAces = findSafeAcesToPlay(playableCards, context);
    if (safeAces.length > 0) {
        if (gameState.debugMode) {
            console.log(`🎯 Gegner spielt sichere Sau aus: ${safeAces[0].symbol}${safeAces[0].short}`);
        }
        return safeAces[0];
    }

    // Strategie 2: Kurze Farben ausspielen
    const shortColorCard = findShortColorCard(playableCards, playerIndex);
    if (shortColorCard) {
        if (gameState.debugMode) {
            console.log(`🎯 Gegner spielt kurze Farbe aus: ${shortColorCard.symbol}${shortColorCard.short}`);
        }
        return shortColorCard;
    }

    // Strategie 3: Niedrige Karten ausspielen
    const lowCards = playableCards.filter(c => !c.isTrump && c.points <= 2);
    if (lowCards.length > 0) {
        return lowCards[Math.floor(Math.random() * lowCards.length)];
    }

    return null; // Fallback zu Standard-Logik
}

/**
 * Findet sichere Säue zum Ausspielen
 * @param {Array} playableCards - Spielbare Karten
 * @param {Object} context - Spielkontext
 * @returns {Array} Sichere Säue
 */
function findSafeAcesToPlay(playableCards, context) {
    const aces = playableCards.filter(c => 
        !c.isTrump && c.value === 'sau'
    );

    return aces.filter(ace => {
        // Sau ist sicher wenn die Farbe noch nicht gespielt wurde
        return !hasColorBeenLed(ace.suit, context);
    });
}

/**
 * Findet kurze Farbkarten zum Ausspielen
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @returns {Object|null} Kurze Farbkarte
 */
function findShortColorCard(playableCards, playerIndex) {
    const playerCards = gameState.players[playerIndex].cards;
    const colorCards = playableCards.filter(c => !c.isTrump);

    // Zähle Karten pro Farbe
    const suitCounts = {};
    playerCards.filter(c => !c.isTrump).forEach(card => {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    // Finde kurze Farben (1-2 Karten)
    const shortSuitCards = colorCards.filter(card => 
        suitCounts[card.suit] <= 2 && card.points === 0
    );

    return shortSuitCards.length > 0 ? shortSuitCards[0] : null;
}

/**
 * NEUE positions-bewusste Folge-Logik
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} canWin - Karten die stechen können
 * @param {boolean} isLastPlayer - Ist der letzte Spieler
 * @returns {Object} Gewählte Karte
 */
function selectPositionAwareFollow(playableCards, playerIndex, context, canWin, isLastPlayer) {
    const currentWinner = getCurrentTrickWinner(context.currentTrick);
    if (!currentWinner) return playableCards[0];

    const isTeammate = areTeammates(playerIndex, currentWinner.playerIndex);
    const trickPoints = getTrickPointsFromContext(context.currentTrick);

    // POSITION 1: Letzter Spieler in der Runde
    if (isLastPlayer) {
        return handleLastPlayerPosition(
            playableCards, playerIndex, context, canWin, isTeammate, trickPoints
        );
    }

    // POSITION 2: Nicht letzter Spieler
    return handleEarlyPlayerPosition(
        playableCards, playerIndex, context, canWin, isTeammate, trickPoints
    );
}

/**
 * Behandelt den letzten Spieler in der Runde
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} canWin - Karten die stechen können
 * @param {boolean} isTeammate - Ist Teammate führend
 * @param {number} trickPoints - Punkte im Stich
 * @returns {Object} Gewählte Karte
 */
function handleLastPlayerPosition(playableCards, playerIndex, context, canWin, isTeammate, trickPoints) {
    if (gameState.debugMode) {
        console.log(`🎲 ${gameState.players[playerIndex].name}: Bin letzter Spieler`);
    }

    if (isTeammate) {
        const leadCard = context.currentTrick[0].card;
        
        // SPEZIALFALL: Partner führt mit hohem Trumpf -> Maximales Schmieren!
        if (leadCard.isTrump && leadCard.trumpOrder >= 15) {
            if (gameState.debugMode) {
                console.log(`💎 Partner führt mit hohem Trumpf - schmiere MAXIMAL!`);
            }
            
            // Priorität 1: ECHTE höchste Punkte (Sau=11, Zehn=10) - KEINE Ober/Unter!
            const realHighPointCards = playableCards.filter(c => 
                !c.isTrump && (c.value === 'sau' || c.value === 'zehn')
            );
            if (realHighPointCards.length > 0) {
                const bestSchmier = realHighPointCards.reduce((highest, card) => 
                    card.points > highest.points ? card : highest
                );
                if (gameState.debugMode) {
                    console.log(`💎 Schmiere ECHTE hohe Punkte: ${bestSchmier.symbol}${bestSchmier.short} (${bestSchmier.points} Punkte)`);
                }
                return bestSchmier;
            }
            
            // Priorität 2: Mittlere Farbkarten (König=4, aber KEINE Ober/Unter)
            const mediumColorCards = playableCards.filter(c => 
                !c.isTrump && c.points >= 4 && c.value !== 'ober' && c.value !== 'unter'
            );
            if (mediumColorCards.length > 0) {
                const bestMedium = mediumColorCards.reduce((highest, card) => 
                    card.points > highest.points ? card : highest
                );
                if (gameState.debugMode) {
                    console.log(`💰 Schmiere mittlere Farbkarte: ${bestMedium.symbol}${bestMedium.short} (${bestMedium.points} Punkte)`);
                }
                return bestMedium;
            }
            
            // Priorität 3: Falls nur Trümpfe da sind, niedrigsten Trumpf
            const trumpCards = playableCards.filter(c => c.isTrump);
            if (trumpCards.length > 0) {
                const lowestTrump = getLowestTrump(trumpCards);
                if (gameState.debugMode) {
                    console.log(`🎯 Spiele niedrigsten Trumpf: ${lowestTrump.symbol}${lowestTrump.short}`);
                }
                return lowestTrump;
            }
            
            // Priorität 4: Niedrigste Farbkarte
            const colorCards = playableCards.filter(c => !c.isTrump);
            if (colorCards.length > 0) {
                const lowestColor = getLowestCard(colorCards);
                if (gameState.debugMode) {
                    console.log(`🗑️ Spiele niedrigste Farbkarte: ${lowestColor.symbol}${lowestColor.short}`);
                }
                return lowestColor;
            }
            
            // Absoluter Fallback
            return getLowestCard(playableCards);
        }
        
        // Normale Letzter-Spieler-Logik: MAXIMALE Punkte schmieren
        if (gameState.debugMode) {
            console.log(`💎 Partner führt - schmiere maximal`);
        }
        return getHighestCard(playableCards);
        
    } else {
        // Gegner führt als letzter: Stechen oder minimal abwerfen
        if (canWin.length > 0) {
            if (gameState.debugMode) {
                console.log(`⚔️ Gegner führt - steche mit niedrigstem`);
            }
            return getLowestCard(canWin);
        } else {
            if (gameState.debugMode) {
                console.log(`🗑️ Gegner führt - werfe minimal ab`);
            }
            return getLowestCard(playableCards);
        }
    }
}

/**
 * Behandelt frühe Spieler (nicht letzter)
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {Array} canWin - Karten die stechen können
 * @param {boolean} isTeammate - Ist Teammate führend
 * @param {number} trickPoints - Punkte im Stich
 * @returns {Object} Gewählte Karte
 */
function handleEarlyPlayerPosition(playableCards, playerIndex, context, canWin, isTeammate, trickPoints) {
    const nextPlayerIndex = getNextPlayerIndex(playerIndex);
    const nextPlayerIsTeammate = areTeammates(playerIndex, nextPlayerIndex);

    if (gameState.debugMode) {
        console.log(`🎮 ${gameState.players[playerIndex].name}: Nicht letzter, nächster ist ${nextPlayerIsTeammate ? 'Partner' : 'Gegner'}`);
    }

    if (isTeammate) {
        // Partner führt: WICHTIGE REGEL - Niemals hohe Trümpfe verschwenden!
        const leadCard = context.currentTrick[0].card;
        
        // SPEZIALFALL: Partner spielt hohen Trumpf -> Schmieren oder niedrigen Trumpf
        if (leadCard.isTrump && leadCard.trumpOrder >= 15) {
            if (gameState.debugMode) {
                console.log(`🚨 Partner führt mit hohem Trumpf - verschwende keine hohen Trümpfe!`);
            }
            
            // Option 1: ECHTE hohe Punkte schmieren (Sau=11, Zehn=10) - KEINE Ober/Unter!
            const realHighPointCards = playableCards.filter(c => 
                !c.isTrump && (c.value === 'sau' || c.value === 'zehn')
            );
            if (realHighPointCards.length > 0) {
                const bestSchmier = realHighPointCards.reduce((highest, card) => 
                    card.points > highest.points ? card : highest
                );
                if (gameState.debugMode) {
                    console.log(`💎 Schmiere ECHTE hohe Punkte: ${bestSchmier.symbol}${bestSchmier.short} (${bestSchmier.points} Punkte)`);
                }
                return bestSchmier;
            }
            
            // Option 2: Mittlere Farbkarten (König=4, aber KEINE Ober/Unter)
            const mediumColorCards = playableCards.filter(c => 
                !c.isTrump && c.points >= 4 && c.value !== 'ober' && c.value !== 'unter'
            );
            if (mediumColorCards.length > 0) {
                if (gameState.debugMode) {
                    console.log(`💰 Schmiere mittlere Farbkarte: ${mediumColorCards[0].symbol}${mediumColorCards[0].short}`);
                }
                return mediumColorCards[0];
            }
            
            // Option 3: Niedrigsten Trumpf spielen (NICHT hohen Trumpf verschwenden)
            const trumpCards = playableCards.filter(c => c.isTrump);
            if (trumpCards.length > 0) {
                const lowestTrump = getLowestTrump(trumpCards);
                if (gameState.debugMode) {
                    console.log(`🎯 Spiele niedrigsten Trumpf: ${lowestTrump.symbol}${lowestTrump.short}`);
                }
                return lowestTrump;
            }
            
            // Option 4: Niedrigste Farbkarte falls verfügbar
            const colorCards = playableCards.filter(c => !c.isTrump);
            if (colorCards.length > 0) {
                const lowestColor = getLowestCard(colorCards);
                if (gameState.debugMode) {
                    console.log(`🗑️ Spiele niedrigste Farbkarte: ${lowestColor.symbol}${lowestColor.short}`);
                }
                return lowestColor;
            }
            
            // Option 5: Absolute Fallback - aber NIE hohen Trumpf
            return getLowestCard(playableCards);
        }
        
        // Normale Partner-führt-Logik für andere Fälle
        if (nextPlayerIsTeammate) {
            // Nächster ist auch Partner: Moderates Schmieren
            const mediumCards = playableCards.filter(c => c.points >= 4 && c.points <= 10);
            if (mediumCards.length > 0) {
                return mediumCards[Math.floor(Math.random() * mediumCards.length)];
            }
        }
        return getHighestCard(playableCards);
        
    } else {
        // Gegner führt
        if (nextPlayerIsTeammate && canWin.length === 0) {
            // Nächster ist Partner und ich kann nicht stechen
            // STRATEGIE: Spiele Farbe die Partner sicher nicht hat
            const colorToGivePartner = selectColorForPartnerToWin(
                playableCards, playerIndex, context, nextPlayerIndex
            );
            
            if (colorToGivePartner) {
                if (gameState.debugMode) {
                    console.log(`🤝 Spiele ${colorToGivePartner.suit} für Partner zum Stechen`);
                }
                return colorToGivePartner;
            }
        }

        // Standard: Stechen oder niedrig abwerfen
        if (canWin.length > 0 && trickPoints >= 15) {
            return getLowestCard(canWin);
        } else {
            return getLowestCard(playableCards);
        }
    }
}

/**
 * NEUE FUNKTION: Wählt Farbe die Partner sicher stechen kann
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {number} partnerIndex - Partner Index
 * @returns {Object|null} Karte die Partner stechen kann
 */
function selectColorForPartnerToWin(playableCards, playerIndex, context, partnerIndex) {
    // Analysiere welche Farben bereits gespielt wurden
    const colorsPlayedByPartner = getColorsPlayedByPlayer(partnerIndex, context);
    const colorsLedInGame = getColorsLedInGame(context);

    // Finde Farben die der Partner erwiesen ermaßen nicht hat
    const colorCards = playableCards.filter(c => !c.isTrump);
    
    for (const card of colorCards) {
        const suit = card.suit;
        
        // Prüfe ob Partner diese Farbe schon mal nicht bedient hat
        const partnerLacksThisSuit = checkIfPartnerLacksColor(
            partnerIndex, suit, context
        );
        
        if (partnerLacksThisSuit && !colorsLedInGame.includes(suit)) {
            // Partner hat diese Farbe nicht und sie wurde noch nicht angespielt
            return card;
        }
    }

    return null;
}
