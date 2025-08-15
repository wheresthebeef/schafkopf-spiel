/**
 * BIDDING-SYSTEM: Debug-Funktion für Bidding-Status
 */
function debugBidding() {
    console.log('🎰 Bidding-Status:');
    console.log(`Aktueller Bieter: ${gameState.players[gameState.bidding.currentBidder].name} (Index: ${gameState.bidding.currentBidder})`);
    console.log(`Reihenfolge: ${gameState.bidding.biddingOrder.map(i => gameState.players[i].name).join(' → ')}`);
    console.log(`Gebote:`, gameState.bidding.playerBids.map((bid, i) => `${gameState.players[i].name}: ${bid || 'noch nicht dran'}`));
    console.log(`Aktiver Bieter: ${gameState.bidding.activeBidder >= 0 ? gameState.players[gameState.bidding.activeBidder].name : 'noch niemand'}`);
    console.log(`Bidding beendet: ${gameState.bidding.biddingFinished}`);
    
    return {
        currentBidder: gameState.bidding.currentBidder,
        currentBidderName: gameState.players[gameState.bidding.currentBidder].name,
        biddingOrder: gameState.bidding.biddingOrder,
        playerBids: gameState.bidding.playerBids,
        activeBidder: gameState.bidding.activeBidder,
        activeBidderName: gameState.bidding.activeBidder >= 0 ? gameState.players[gameState.bidding.activeBidder].name : null,
        biddingFinished: gameState.bidding.biddingFinished,
        status: 'OK'
    };
}

/**
 * BIDDING-SYSTEM: Verarbeitet ein Gebot eines Spielers
 * @param {number} playerIndex - Index des Spielers der bietet
 * @param {string} bidType - Art des Gebots: 'rufspiel' oder 'pass'
 * @returns {Object} Ergebnis der Bidding-Aktion
 */
function playerBids(playerIndex, bidType) {
    // Validierung: Ist dieser Spieler überhaupt dran?
    if (playerIndex !== gameState.bidding.currentBidder) {
        console.warn(`⚠️ ${gameState.players[playerIndex].name} ist nicht dran! Aktueller Bieter: ${gameState.players[gameState.bidding.currentBidder].name}`);
        return {
            success: false,
            error: 'not_current_bidder',
            message: `${gameState.players[playerIndex].name} ist nicht am Zug`
        };
    }
    
    // Validierung: Ist Bidding-Phase noch aktiv?
    if (gameState.bidding.biddingFinished) {
        console.warn(`⚠️ Bidding-Phase bereits beendet!`);
        return {
            success: false,
            error: 'bidding_finished',
            message: 'Bidding-Phase ist bereits beendet'
        };
    }
    
    // Validierung: Gültiges Gebot?
    if (bidType !== 'rufspiel' && bidType !== 'pass') {
        console.warn(`⚠️ Ungültiges Gebot: ${bidType}. Erlaubt: 'rufspiel', 'pass'`);
        return {
            success: false,
            error: 'invalid_bid',
            message: `Ungültiges Gebot: ${bidType}`
        };
    }
    
    // Gebot verarbeiten
    gameState.bidding.playerBids[playerIndex] = bidType;
    
    // Wenn jemand ein Spiel ansagt, ist er der aktive Bieter
    if (bidType === 'rufspiel') {
        gameState.bidding.activeBidder = playerIndex;
        console.log(`🎰 ${gameState.players[playerIndex].name} sagt Rufspiel an!`);
    } else {
        console.log(`➡️ ${gameState.players[playerIndex].name} passt`);
    }
    
    // Logging
    logGameAction('Spieler bietet', {
        player: gameState.players[playerIndex].name,
        bidType: bidType,
        playerIndex: playerIndex
    });
    
    // Zum nächsten Bieter wechseln
    const nextBidderResult = nextBidder();
    
    return {
        success: true,
        bidType: bidType,
        player: gameState.players[playerIndex].name,
        playerIndex: playerIndex,
        activeBidder: gameState.bidding.activeBidder,
        activeBidderName: gameState.bidding.activeBidder >= 0 ? gameState.players[gameState.bidding.activeBidder].name : null,
        nextBidder: nextBidderResult.nextBidder,
        nextBidderName: nextBidderResult.nextBidderName,
        biddingFinished: gameState.bidding.biddingFinished,
        message: bidType === 'rufspiel' ? 
            `${gameState.players[playerIndex].name} sagt Rufspiel an!` : 
            `${gameState.players[playerIndex].name} passt`
    };
}

/**
 * BIDDING-SYSTEM: Wechselt zum nächsten Bieter in der Reihenfolge
 * @returns {Object} Informationen über den nächsten Bieter
 */
function nextBidder() {
    // Finde nächsten Spieler in der Bidding-Reihenfolge
    const currentIndex = gameState.bidding.biddingOrder.indexOf(gameState.bidding.currentBidder);
    const nextIndex = (currentIndex + 1) % gameState.bidding.biddingOrder.length;
    const nextBidderPlayerIndex = gameState.bidding.biddingOrder[nextIndex];
    
    // Prüfe ob alle Spieler schon dran waren
    const allPlayersBid = gameState.bidding.playerBids.every(bid => bid !== null);
    
    if (allPlayersBid) {
        // Bidding-Phase beenden
        gameState.bidding.biddingFinished = true;
        gameState.bidding.currentBidder = -1; // Niemand ist mehr dran
        
        console.log(`🏁 Bidding-Phase beendet!`);
        
        if (gameState.bidding.activeBidder >= 0) {
            console.log(`✅ ${gameState.players[gameState.bidding.activeBidder].name} spielt Rufspiel`);
        } else {
            console.log(`❌ Niemand hat ein Spiel angesagt - Ramsch oder neue Runde`);
        }
        
        logGameAction('Bidding beendet', {
            activeBidder: gameState.bidding.activeBidder,
            activeBidderName: gameState.bidding.activeBidder >= 0 ? gameState.players[gameState.bidding.activeBidder].name : null,
            allBids: gameState.bidding.playerBids
        });
        
        return {
            nextBidder: -1,
            nextBidderName: null,
            biddingFinished: true,
            activeBidder: gameState.bidding.activeBidder,
            activeBidderName: gameState.bidding.activeBidder >= 0 ? gameState.players[gameState.bidding.activeBidder].name : null
        };
    } else {
        // Nächster Bieter
        gameState.bidding.currentBidder = nextBidderPlayerIndex;
        gameState.currentPlayer = nextBidderPlayerIndex;
        
        console.log(`⏭️ Nächster Bieter: ${gameState.players[nextBidderPlayerIndex].name}`);
        
        return {
            nextBidder: nextBidderPlayerIndex,
            nextBidderName: gameState.players[nextBidderPlayerIndex].name,
            biddingFinished: false,
            activeBidder: gameState.bidding.activeBidder,
            activeBidderName: gameState.bidding.activeBidder >= 0 ? gameState.players[gameState.bidding.activeBidder].name : null
        };
    }
}