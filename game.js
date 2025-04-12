// --- DOM Elements ---
const myCardsScreen = document.getElementById('my-cards-screen');
const playerProfile = document.getElementById('player-profile');
const totalWinsEl = document.getElementById('total-wins');
const totalLossesEl = document.getElementById('total-losses');
const enjBalanceEl = document.getElementById('enj-balance');
const myCardsDisplay = document.getElementById('my-cards-display');
const controls = document.getElementById('controls');
const challengeButton = document.getElementById('challenge-button');
const anteFeedback = document.getElementById('ante-feedback');
const gameArea = document.getElementById('game-area');
const mainPotDisplay = document.getElementById('main-pot-display');
const mainPotAmount = document.getElementById('main-pot-amount');
const autoPlayIndicator = document.getElementById('auto-play-indicator');
const nextRoundButton = document.getElementById('next-round-button');
const player1Card = document.getElementById('player1-card');
const player2Card = document.getElementById('player2-card');
const player1Indicators = document.getElementById('player1-indicators').children; // Note: gets HTMLCollection
const player2Indicators = document.getElementById('player2-indicators').children; // Note: gets HTMLCollection
const player1DeckCountEl = document.getElementById('player1-deck-count');
const player2DeckCountEl = document.getElementById('player2-deck-count');
const roundResult = document.getElementById('round-result');
const drawInfo = document.getElementById('draw-info');
const winScreen = document.getElementById('win-screen');
const winMessage = document.getElementById('win-message');
const winReward = document.getElementById('win-reward');
const playAgainButton = document.getElementById('play-again-button');
const buyButton = document.getElementById('buy-button');
const sellButton = document.getElementById('sell-button');
const buyModal = document.getElementById('buy-modal');
const buyTypeSelect = document.getElementById('buy-type-select');
const buyCurrentCount = document.getElementById('buy-current-count');
//const buyQuantityInput = document.getElementById('buy-quantity');
const buyQuantityDisplay = document.getElementById('buy-quantity-display'); // New span
const buyPriceEl = document.getElementById('buy-price');
const buyAvailableEl = document.getElementById('buy-available');
const buyTotalCostEl = document.getElementById('buy-total-cost');
const confirmBuyButton = document.getElementById('confirm-buy-button');
const cancelBuyButton = document.getElementById('cancel-buy-button');
const buyFeedback = document.getElementById('buy-feedback');
const sellModal = document.getElementById('sell-modal');
const sellTypeSelect = document.getElementById('sell-type-select');
const sellCurrentCount = document.getElementById('sell-current-count');
//const sellQuantityInput = document.getElementById('sell-quantity');
const sellQuantityDisplay = document.getElementById('sell-quantity-display'); // New span
const quantityAdjustButtons = document.querySelectorAll('.quantity-adjust-btn'); // Select all new +/- buttons
const sellPriceEl = document.getElementById('sell-price');
const sellAvailableEl = document.getElementById('sell-available');
const sellTotalEarnEl = document.getElementById('sell-total-earn');
const confirmSellButton = document.getElementById('confirm-sell-button');
const cancelSellButton = document.getElementById('cancel-sell-button');
const sellFeedback = document.getElementById('sell-feedback');
const battleStartPopup = document.getElementById('battle-start-popup');

// Betting Elements
const bettingInfo = document.getElementById('betting-info');
const potDisplay = document.getElementById('pot-display');
const bettingTimerDisplay = document.getElementById('betting-timer-display');
const bettingTimer = document.getElementById('betting-timer');
const player1ActionDisplay = document.getElementById('player1-action-display');
const player2ActionDisplay = document.getElementById('player2-action-display');
const bettingFeedback = document.getElementById('betting-feedback');
const bettingControls = document.getElementById('betting-controls');
const callButton = document.getElementById('call-button');
const raiseButton = document.getElementById('raise-button');
const forfeitButton = document.getElementById('forfeit-button');

// Deck Selection Elements
const deckSelectionModal = document.getElementById('deck-selection-modal');
const deckRDisplay = document.getElementById('deck-r-display');
const deckPDisplay = document.getElementById('deck-p-display');
const deckSDisplay = document.getElementById('deck-s-display');
const invRCountEl = document.getElementById('inv-r-count');
const invPCountEl = document.getElementById('inv-p-count');
const invSCountEl = document.getElementById('inv-s-count');
const deckTotalDisplay = document.getElementById('deck-total-display');
const deckFeedback = document.getElementById('deck-feedback');
const confirmDeckButton = document.getElementById('confirm-deck-button');
const cancelDeckButton = document.getElementById('cancel-deck-button');
const deckAdjustButtons = document.querySelectorAll('.deck-adjust-btn'); // Select all +/- buttons

// --- (End of DOM Element Selection) ---

// ...

// --- Game State Variables ---

// Core Gameplay State
let player1Score = 0;
let player2Score = 0;
let currentRound = 0;
let currentPot = 0;            // Current pot amount during a match

// Player Session State & Inventory (Persistent between matches)
let totalWins = 0;             // Tracks total matches won in the session
let totalLosses = 0;           // Tracks total matches lost in the session
let player1ENJ = 100;          // Player's current ENJ balance (Initial value)
let player1Inventory = { R: 10, P: 10, S: 10 }; // Player's card inventory (Initial value)

// Match-Specific State (Reset between matches)
let player1BattleDeck = [];    // P1's deck for the current match
let player2BattleDeck = [];    // P2's deck for the current match
let initialP1Deck = [];        // Stores P1's initial deck for potential replays
let initialP2Deck = [];        // Stores P2's initial deck for potential replays
let betHasBeenRaised = false;  // Tracks if a raise occurred in the current match (used for pot calculation/auto-play logic)
let player1HasRaised = false;  // Tracks if P1 raised specifically in the current match (for betting UI logic)
let player2HasEffectivelyRaised = false; // Tracks if P2 raised specifically in the current match (for betting UI logic)
let autoPlayActive = false;    // Flag indicating if rounds should proceed without betting prompts (after mutual raise)

// UI / Interaction State
let tempDeckCounts = { R: 4, P: 3, S: 3 }; // Temporary counts for deck selection modal UI state
let isAnimating = false;       // Flag to prevent actions during animations/transitions
let bettingPhaseActive = false;// Flag indicating if the betting UI is active
let storedPlayer1BetAction = null; // Temporarily stores P1's bet choice during async P2 turn

// Interval/Timer IDs (for clearing intervals later)
let p1RouletteInterval = null;
let p2RouletteInterval = null;
let bettingTimerInterval = null;

// --- (End of Game State Variables) ---

// ...

// --- Economy Functions ---

/**
 * Calculates the available supply of a card type from the simulated "market".
 * Assumes total supply minus player1's inventory.
 * @param {string} type - The card type ('R', 'P', or 'S').
 * @returns {number} The calculated available supply.
 */
function getAvailableSupply(type) {
    // Depends on: totalSupply (Config), player1Inventory (State)
    // Ensure these variables are accessible (defined above or imported/global)
    return Math.max(0, (totalSupply[type] || 0) - (player1Inventory[type] || 0));
}

/**
 * Calculates the current dynamic price for buying/selling a card type.
 * Price increases as available supply decreases, with slight random variation.
 * @param {string} type - The card type ('R', 'P', or 'S').
 * @returns {number} The calculated price, rounded and >= 1.
 */
function calculateCurrentPrice(type) {
    // Depends on: basePrice, totalSupply (Config)
    // Calls: getAvailableSupply()
    // Ensure these config variables are accessible
    const available = getAvailableSupply(); // Call the function above
    const total = totalSupply[type] || 0; // Use || 0 as fallback
    const base = basePrice[type] || 1; // Use || 1 as fallback
    let price = base; // Start with base price

    // Adjust price based on supply, avoid division by zero if total is 0
    if (total > 0) {
        // Price increases proportionally as supply decreases
        price = base * (1 + (total - available) / total);
    }

    // Add +/- 5% random fluctuation
    price *= (1 + (Math.random() - 0.5) * 0.1);

    // Ensure price is at least 1 and round it
    return Math.max(1, Math.round(price));
}

// --- (End of Economy Functions) ---

// ...

// --- UI Update Functions ---

/** Updates the displayed ENJ balance in the profile section. */
function updateENJBalanceDisplay() {
    // Depends on: enjBalanceEl (DOM), player1ENJ (State)
    enjBalanceEl.textContent = player1ENJ;
}

/** Updates the displayed deck counts in the battle arena. */
function updateGameInventoryCounts() {
    // Depends on: player1DeckCountEl, player2DeckCountEl (DOM)
    // Depends on: player1BattleDeck, player2BattleDeck (State)
    player1DeckCountEl.textContent = player1BattleDeck.length;
    player2DeckCountEl.textContent = player2BattleDeck.length;
}

/** Updates the "My Cards" display area with current inventory. */
function displayMyCards() {
    // Depends on: myCardsDisplay (DOM)
    // Depends on: player1Inventory (State), choices (Config)
    // Calls: updateBuySellCurrentCounts(), updateENJBalanceDisplay()
    myCardsDisplay.innerHTML = '';
    const p1Total = Object.values(player1Inventory).reduce((sum, count) => sum + count, 0);

    if (p1Total === 0) {
        myCardsDisplay.innerHTML = '<p class="text-gray-400">No cards in inventory.</p>';
    } else {
        // Assumes 'choices' config variable is accessible
        Object.entries(choices).forEach(([type, emoji]) => {
            const count = player1Inventory[type] || 0;
            if (count > 0) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card inventory-card flex flex-col items-center justify-center';
                cardDiv.innerHTML = `<span class="text-3xl">${emoji}</span><span class="text-sm font-semibold mt-1">x ${count}</span>`;
                myCardsDisplay.appendChild(cardDiv);
            }
        });
    }
    updateBuySellCurrentCounts(); // Update modal counts whenever inventory display changes
    updateENJBalanceDisplay(); // Also update balance display
}

/** Updates the Wins/Losses display in the profile section. */
function updateProfileStats() {
    // Depends on: totalWinsEl, totalLossesEl (DOM)
    // Depends on: totalWins, totalLosses (State)
    // Calls: updateENJBalanceDisplay()
    totalWinsEl.textContent = totalWins;
    totalLossesEl.textContent = totalLosses;
    updateENJBalanceDisplay(); // Update balance display as well
}

/** Updates the buy/sell modal fields based on selected type and inventory. */
function updateBuySellCurrentCounts() {
    // Depends on: Various buy/sell modal DOM elements (buyTypeSelect, sellTypeSelect, etc.)
    // Depends on: player1Inventory (State)
    // Calls: calculateCurrentPrice(), getAvailableSupply() (Economy/Utility functions - need to be defined)
    const selectedBuyType = buyTypeSelect.value;
    const selectedSellType = sellTypeSelect.value;

    // These functions calculate price/supply based on state/config - must be defined elsewhere
    const buyPrice = calculateCurrentPrice(selectedBuyType);
    const sellPrice = calculateCurrentPrice(selectedSellType);
    const buyAvailable = getAvailableSupply(selectedBuyType);
    const sellAvailable = getAvailableSupply(selectedSellType); // Available supply in the "market"

    // Update Buy Modal elements
    buyCurrentCount.textContent = player1Inventory[selectedBuyType] || 0;
    buyPriceEl.textContent = buyPrice;
    buyAvailableEl.textContent = buyAvailable;
    //const buyQuantity = parseInt(buyQuantityInput.value) || 0;
    const buyQuantity = parseInt(buyQuantityDisplay.textContent) || 0; // New line - read from span
    buyTotalCostEl.textContent = buyPrice * buyQuantity;

    // Update Sell Modal elements
    const currentSellCount = player1Inventory[selectedSellType] || 0;
    sellCurrentCount.textContent = currentSellCount;
    sellPriceEl.textContent = sellPrice;
    sellAvailableEl.textContent = sellAvailable; // Display market availability in sell modal too (as per original code)
    
    // *** REMOVE THESE LINES (max, value, disabled set by button logic now) ***
    //sellQuantityInput.max = currentSellCount > 0 ? currentSellCount : 1; // Set max sell qty
    // Adjust input value if it exceeds owned amount
    //if (parseInt(sellQuantityInput.value) > currentSellCount) {
    //    sellQuantityInput.value = currentSellCount > 0 ? currentSellCount : 1;
    //}
    //sellQuantityInput.disabled = currentSellCount === 0; // Disable input if none owned
    // *** ^^^ REMOVE THESE LINES ^^^ ***

    confirmSellButton.disabled = currentSellCount === 0; // Disable button if none owned

    //const sellQuantity = parseInt(sellQuantityInput.value) || 0;
    const sellQuantity = parseInt(sellQuantityDisplay.textContent) || 0; // New line - read from span
    sellTotalEarnEl.textContent = currentSellCount > 0 ? sellPrice * sellQuantity : 0; // Calculate potential earnings
}

/** Updates the main pot display in the center of the battle arena. */
function updateMainPotDisplay() {
    // Depends on: mainPotAmount (DOM), currentPot (State)
    mainPotAmount.textContent = currentPot;
}

/** Updates the round win indicators (dots) for both players. */
function updateScoreIndicators() {
    // Depends on: player1Indicators, player2Indicators (DOM - HTMLCollection)
    // Depends on: player1Score, player2Score (State), maxRounds (Config)
    // Assumes 'maxRounds' config variable is accessible
    for (let i = 0; i < maxRounds; i++) {
        // Safely check if the indicator element exists at the index
        if (player1Indicators[i]) {
            player1Indicators[i].classList.toggle('won', i < player1Score);
        }
        if (player2Indicators[i]) {
            player2Indicators[i].classList.toggle('won', i < player2Score);
        }
    }
}

/** Resets the player card displays to default ('?') and clears round result texts. */
function resetCardStyles() {
    // Depends on: player1Card, player2Card, roundResult, drawInfo (DOM)
    player1Card.className = 'card mx-auto';
    player2Card.className = 'card mx-auto';
    player1Card.textContent = '?';
    player2Card.textContent = '?';
    roundResult.textContent = '';
    drawInfo.textContent = '';
}

// --- (End of UI Update Functions) ---

// ...

// --- Betting Phase Functions ---

/** Clears the betting timer interval if it's active. */
function clearBettingTimer() {
    // Depends on: bettingTimerInterval (State)
    if (bettingTimerInterval) {
        clearInterval(bettingTimerInterval);
        bettingTimerInterval = null;
        // console.log("DEBUG: Betting timer cleared."); // Optional debug log
    }
}

/** Shows the betting UI, starts the timer, and sets betting state. */
function showBettingPhase() {
    // Depends on: bettingInfo, bettingControls, nextRoundButton, autoPlayIndicator, potDisplay, bettingTimerDisplay, bettingTimer, callButton, raiseButton, forfeitButton, player1ActionDisplay, player2ActionDisplay, bettingFeedback (DOM)
    // Depends on: currentPot, player1HasRaised, bettingTimerSeconds (State - needs careful handling/resetting), autoPlayActive
    // Calls: clearBettingTimer(), updateMainPotDisplay(), handlePlayer1BetAction() (indirectly via timer expiry)
    // Config needed: initialBettingTimerSeconds (or hardcoded value like 10)
    // console.log(`DEBUG: showBettingPhase called. P1 Raised: ${player1HasRaised}, P2 Raised: ${player2HasEffectivelyRaised}, AutoPlay: ${autoPlayActive}`);
    bettingPhaseActive = true;
    isAnimating = true; // Prevent other actions during betting phase UI display

    // Show/Hide relevant UI sections
    bettingInfo.classList.remove('hidden');
    bettingControls.classList.remove('hidden');
    nextRoundButton.classList.add('hidden');
    autoPlayIndicator.classList.add('hidden'); // Hide auto-play indicator during manual betting

    // Update displays
    potDisplay.textContent = currentPot;
    updateMainPotDisplay(); // Update the big pot display too
    player1ActionDisplay.textContent = "Your action?";
    player2ActionDisplay.textContent = "";
    bettingFeedback.textContent = "";

    // Set button states
    callButton.disabled = false;
    raiseButton.disabled = player1HasRaised; // Cannot raise if already raised this match
    forfeitButton.disabled = false;
    storedPlayer1BetAction = null; // Reset stored action for this phase

    // --- Start Timer ---
    clearBettingTimer(); // Clear any existing timer first

    // Use the initial value set in config/state. Assuming 'bettingTimerSeconds' holds this initial value.
    // If 'bettingTimerSeconds' was intended ONLY as the countdown, you need a constant/config value here.
    // Let's assume '10' based on original code until 'initialBettingTimerSeconds' config is confirmed/used.
    let currentTimerValue = 10; // TODO: Replace with config value if available e.g. initialBettingTimerSeconds
    bettingTimer.textContent = currentTimerValue;
    bettingTimer.classList.remove('timer-warning'); // Reset warning style
    bettingTimerDisplay.classList.remove('hidden'); // Show timer

    bettingTimerInterval = setInterval(() => {
        currentTimerValue--;
        bettingTimer.textContent = currentTimerValue;
        // Add warning style when time is low
        if (currentTimerValue <= 5) {
            bettingTimer.classList.add('timer-warning');
        }
        // Handle timer expiry
        if (currentTimerValue <= 0) {
            // console.log("DEBUG: Betting timer expired!");
            clearBettingTimer(); // Stop the interval
            player1ActionDisplay.textContent = "Timer expired! Auto-calling...";
            // Check if call button is still enabled before auto-calling
            if (!callButton.disabled) {
                handlePlayer1BetAction('call'); // Trigger call action automatically
            }
        }
    }, 1000); // 1-second interval
}

/** Hides the betting UI elements and clears the timer. */
function hideBettingPhase() {
    // Depends on: bettingInfo, bettingControls, bettingTimerDisplay, player1ActionDisplay, player2ActionDisplay, bettingFeedback (DOM)
    // Calls: clearBettingTimer()
    clearBettingTimer(); // Stop timer when hiding
    bettingPhaseActive = false; // Update state flag
    // Hide UI elements
    bettingInfo.classList.add('hidden');
    bettingControls.classList.add('hidden');
    bettingTimerDisplay.classList.add('hidden');
    // Clear action displays
    player1ActionDisplay.textContent = "";
    player2ActionDisplay.textContent = "";
    bettingFeedback.textContent = "";
}

/** Simulates Player 2's betting decision with a delay. */
async function simulatePlayer2Betting() {
    // Depends on: player2ActionDisplay (DOM)
    // Depends on: player2HasEffectivelyRaised (State)
    player2ActionDisplay.textContent = "Player 2 is thinking...";
    // Simulate thinking time (1.2s to 2s)
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

    // Simple AI: If P2 already raised this match, they must call. Otherwise, 50/50 chance to raise or call.
    const p2Decision = player2HasEffectivelyRaised ? 'call' : (Math.random() < 0.5 ? 'raise' : 'call');
    // console.log(`DEBUG: P2 Decision (cannot raise if already raised): ${p2Decision}`);
    return p2Decision;
}

/** Handles Player 1's betting action ('call', 'raise', 'forfeit'), triggers Player 2 simulation, and resolves. */
async function handlePlayer1BetAction(player1Action) {
    // Depends on: callButton, raiseButton, forfeitButton, bettingFeedback, player1ActionDisplay (DOM)
    // Depends on: bettingPhaseActive, isAnimating, player1HasRaised, player1ENJ (State)
    // Depends on: raiseAmount (Config)
    // Calls: clearBettingTimer(), shootParticles() (Needs definition), simulatePlayer2Betting(), resolveBettingOutcome()
    if (!bettingPhaseActive || !isAnimating) return; // Only act if betting is active and not mid-transition

    clearBettingTimer(); // Stop the timer once an action is taken
    storedPlayer1BetAction = player1Action; // Store P1's action for resolution logic

    // Disable buttons during processing
    callButton.disabled = true;
    raiseButton.disabled = true;
    forfeitButton.disabled = true;
    bettingFeedback.textContent = ""; // Clear previous feedback

    // Handle forfeit immediately
    if (player1Action === 'forfeit') {
        player1ActionDisplay.textContent = "You chose to Forfeit.";
        await resolveBettingOutcome(player1Action, null); // Resolve immediately, P2 action irrelevant
        return;
    }
    // Handle raise action
    else if (player1Action === 'raise') {
        // Check if P1 already raised this match
        if (player1HasRaised) {
            // console.log("DEBUG: P1 tried to raise but already has.");
            bettingFeedback.textContent = "You have already raised this match.";
            setTimeout(() => bettingFeedback.textContent = '', 2000); // Clear feedback after delay
            // Re-enable buttons for valid actions (call/forfeit)
            callButton.disabled = false;
            raiseButton.disabled = true; // Still disabled
            forfeitButton.disabled = false;
            storedPlayer1BetAction = null; // Clear stored action as it was invalid
            // NOTE: Might want to restart timer here, but original didn't.
            return; // Stop processing this invalid action
        }
        // Check funds for raise
        // Assumes 'raiseAmount' config var is accessible
        if (player1ENJ < raiseAmount) {
            bettingFeedback.textContent = "Not enough ENJ to raise!";
            setTimeout(() => bettingFeedback.textContent = '', 2000);
            // Re-enable buttons (can still call/forfeit if possible)
            callButton.disabled = false;
            // Keep raise disabled (insufficient funds OR already raised)
            raiseButton.disabled = true; // player1HasRaised is false, but funds insufficient
            forfeitButton.disabled = false;
            storedPlayer1BetAction = null; // Clear invalid action
            return; // Stop processing invalid action
        }
        // If raise is valid
        player1ActionDisplay.textContent = "You Raised!";
        shootParticles(0.25); // Visual feedback (needs 'shootParticles' definition)
    }
    // Handle call/check action
    else {
        player1ActionDisplay.textContent = "You Called/Checked.";
    }

    // Wait briefly, then simulate P2's action
    await new Promise(resolve => setTimeout(resolve, 500));
    const player2Action = await simulatePlayer2Betting(); // Get P2's simulated action

    // Display P2's action
    if (player2Action === 'raise') {
        player2ActionDisplay.textContent = `Player 2 Raises!`;
        shootParticles(0.75); // Visual feedback (needs 'shootParticles' definition)
    } else {
        player2ActionDisplay.textContent = `Player 2 Calls/Checks.`;
    }

    // Wait briefly, then resolve the outcome based on both actions
    await new Promise(resolve => setTimeout(resolve, 1000));
    await resolveBettingOutcome(player1Action, player2Action);
}

/** Resolves the betting outcome based on P1 and P2 actions, updates pot/state, and proceeds. */
async function resolveBettingOutcome(p1Action, p2Action) {
    // Depends on: bettingFeedback, player1ActionDisplay, player2ActionDisplay, roundResult (DOM)
    // Depends on: currentPot, player1HasRaised, player2HasEffectivelyRaised, player1ENJ, autoPlayActive, betHasBeenRaised (State)
    // Depends on: battleAnte, raiseAmount, initialPot, raisedPotSingle, raisedPotMutual (Config)
    // Calls: clearBettingTimer(), endGameForfeit() (Needs definition), updateENJBalanceDisplay(), updateMainPotDisplay(), hideBettingPhase(), playRound() (Needs definition)
    clearBettingTimer(); // Ensure timer is stopped

    let proceedToNextRound = false;
    let insufficientFundsForfeit = false;
    let finalPot = currentPot; // Start with current pot, calculate final value
    let p1RaisedThisPhase = (p1Action === 'raise');
    let p2RaisedThisPhase = (p2Action === 'raise');
    let p1CalledRaise = (p1Action === 'call' && p2Action === 'raise'); // Did P1 need to call P2's raise?

    // console.log(`DEBUG: resolveBettingOutcome Start - Pot: ${currentPot}, P1Action: ${p1Action}, P2Action: ${p2Action}, P1RaisedFlag: ${player1HasRaised}, P2RaisedFlag: ${player2HasEffectivelyRaised}`);

    // Handle P1 forfeit explicitly (already handled in caller, but good failsafe)
    if (p1Action === 'forfeit') {
        endGameForfeit(battleAnte); // Call forfeit end game (needs definition). Assumes 'battleAnte' config accessible.
        return;
    }

    // --- Determine ENJ deduction for THIS betting interaction ---
    // Assumes 'raiseAmount' config var is accessible
    if (p1RaisedThisPhase) {
         // Funds already checked in handlePlayer1BetAction
         player1ENJ -= raiseAmount;
    } else if (p1CalledRaise) {
        // P1 needs to call P2's raise
        if (player1ENJ < raiseAmount) {
            insufficientFundsForfeit = true; // P1 can't afford to call P2's raise
        } else {
            player1ENJ -= raiseAmount; // P1 pays to call the raise
        }
    }
    // Note: P2's ENJ is not tracked/deducted in this simulation.

    // --- Update persistent raise flags for the *entire match* ---
    // Only update if funds were sufficient for the action
    if (!insufficientFundsForfeit) {
        if (p1RaisedThisPhase) { player1HasRaised = true; }
        if (p2RaisedThisPhase) { player2HasEffectivelyRaised = true; }
    }

    // --- Determine final pot and autoPlay status based on CUMULATIVE state AFTER this phase resolved ---
    // Assumes config pot values (initialPot, raisedPotSingle, raisedPotMutual) are accessible
    if (!insufficientFundsForfeit) {
         // Both players eventually raised (could be in different phases of the match)
        if (player1HasRaised && player2HasEffectivelyRaised) {
            finalPot = raisedPotMutual; // e.g., 30
            autoPlayActive = true; // Auto-play rest of rounds
            player1ActionDisplay.textContent = "Both players raised! Pot is 30!";
            player2ActionDisplay.textContent = "Auto-playing remaining rounds...";
        }
        // Only one player has raised so far in the match
        else if (player1HasRaised || player2HasEffectivelyRaised) {
             finalPot = raisedPotSingle; // e.g., 20
             autoPlayActive = false; // Continue manual play/betting
             // Update action display based on who acted last in *this* phase
             if (p1RaisedThisPhase) { player1ActionDisplay.textContent = "You raised, Player 2 called."; player2ActionDisplay.textContent = ""; }
             else if (p2RaisedThisPhase) { player1ActionDisplay.textContent = "Player 2 raised, you called."; player2ActionDisplay.textContent = "";}
             else { player1ActionDisplay.textContent = "Action resolved."; player2ActionDisplay.textContent = "";} // Raise happened in prior round betting
        }
        // Neither player has raised at any point in the match yet
        else {
             finalPot = initialPot; // e.g., 10
             autoPlayActive = false; // Continue manual play/betting
             player1ActionDisplay.textContent = "Both players checked.";
             player2ActionDisplay.textContent = "";
        }
        proceedToNextRound = true; // Betting resolved successfully
    }

    // --- Update state and UI displays ---
    currentPot = finalPot; // Update the state variable
    betHasBeenRaised = (currentPot > initialPot); // Update general 'betHasBeenRaised' flag used elsewhere

    // console.log(`DEBUG: Betting Resolved. Pot=${currentPot}, P1Raised=${player1HasRaised}, P2Raised=${player2HasEffectivelyRaised}, AutoPlay=${autoPlayActive}`);
    updateENJBalanceDisplay(); // Show updated player balance
    updateMainPotDisplay(); // Show updated pot amount

    // Wait briefly before proceeding to next action
    await new Promise(resolve => setTimeout(resolve, 100));

    // --- Handle final outcomes of betting phase ---
    if (insufficientFundsForfeit) {
        bettingFeedback.textContent = "Not enough ENJ to call raise! Forfeiting.";
        await new Promise(resolve => setTimeout(resolve, 1500)); // Show message
        // Assumes 'battleAnte' config var is accessible
        endGameForfeit(battleAnte); // Call forfeit end game (needs definition)
    }
    else if (proceedToNextRound) {
         hideBettingPhase(); // Hide betting controls, clear timer etc.
         // If auto-play was triggered, show a message
         if (autoPlayActive) {
             roundResult.textContent = "Pot raised! Auto-playing..."; // Update round result display
             await new Promise(resolve => setTimeout(resolve, 1500)); // Show message
         }
         isAnimating = false; // Allow next round logic to start
         playRound(); // Proceed to next round (needs 'playRound' definition)
    } else {
         // This case should generally not be reached unless P1 forfeited earlier or had insufficient funds
         hideBettingPhase();
         isAnimating = false;
    }
}
// --- (End of Betting Phase Functions) ---

// ...

// --- Core Game Logic & Animations ---

/** Gets a random choice from a player's deck, removing the card. Returns null if deck is empty. */
function getRandomChoice(player) {
    // Depends on: player1BattleDeck, player2BattleDeck (State)
    // Calls: updateGameInventoryCounts()
    const deck = (player === 'player1') ? player1BattleDeck : player2BattleDeck;
    if (deck.length === 0) {
        console.log(`DEBUG: ${player} deck empty!`);
        return null; // Indicate deck is empty
    }
    const randomIndex = Math.floor(Math.random() * deck.length);
    const choice = deck.splice(randomIndex, 1)[0]; // Draw and remove card
    // console.log(`DEBUG: ${player} draws ${choice}. Deck remaining: ${deck.length}`);
    updateGameInventoryCounts(); // Update UI for deck count
    return choice;
}

/** Determines the winner ('player1', 'player2', or 'draw') based on two choices. */
function determineWinner(choice1, choice2) {
    // Assumes standard RPS rules
    if (choice1 === choice2) return 'draw';
    if ((choice1 === 'R' && choice2 === 'S') ||
        (choice1 === 'S' && choice2 === 'P') ||
        (choice1 === 'P' && choice2 === 'R')) {
        return 'player1';
    }
    return 'player2';
}

/** Triggers a confetti celebration effect. Requires the confetti library. */
function triggerConfetti() {
    // Depends on: confetti() function from external library
    const duration = 5 * 1000; // 5 seconds
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 101 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval); // Stop when duration is over
        }
        const particleCount = 50 * (timeLeft / duration); // Fewer particles over time
        // Launch from two points for a fuller effect
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250); // Launch every 250ms
}

/** Starts the card 'roulette' animation effect on a given card element. Returns interval ID. */
function startRoulette(cardElement) {
    // Depends on: choices, choiceOrder (Config)
    let currentIndex = 0;
    cardElement.textContent = ''; // Clear previous card face
    // Assumes 'choices' and 'choiceOrder' config vars are accessible
    const intervalId = setInterval(() => {
        cardElement.textContent = choices[choiceOrder[currentIndex]]; // Cycle through icons
        currentIndex = (currentIndex + 1) % choiceOrder.length;
    }, 75); // Animation speed interval (75ms)
    return intervalId;
}

/** Stops the card 'roulette' animation and displays the final card choice. */
function stopRoulette(intervalId, cardElement, finalChoice) {
    // Depends on: choices (Config)
    clearInterval(intervalId); // Stop the interval timer
    // Assumes 'choices' config var is accessible
    cardElement.textContent = choices[finalChoice]; // Set the final card icon
}

/** Triggers the CSS attack animation on the winning card element. */
function triggerAttackAnimation(winnerCardElement, winner) {
    // Depends on: CSS classes .attacking-p1, .attacking-p2
    const animationClass = winner === 'player1' ? 'attacking-p1' : 'attacking-p2';
    winnerCardElement.classList.add(animationClass);
    // Remove the class after the animation duration (defined in CSS, e.g., 600ms)
    setTimeout(() => {
        winnerCardElement.classList.remove(animationClass);
    }, 600); // Match CSS animation duration
}

/** Shoots confetti particles from a specific horizontal origin (used for betting feedback). Requires confetti library. */
function shootParticles(originX, count = 70) {
    // Depends on: confetti() function from external library
    confetti({
        particleCount: count,
        angle: originX < 0.5 ? 60 : 120, // Angle away from center
        spread: 55,
        origin: { x: originX, y: 0.6 }, // Start point
        colors: ['#63b3ed', '#4299e1', '#90cdf4'], // Example colors
        scalar: 0.9,
        disableForReducedMotion: true, // Accessibility
        gravity: 0.8
    });
}

/** Handles the specific case where decks empty on a draw, forcing a match replay with same decks/pot. */
async function handleReplay() {
    // Depends on: roundResult, drawInfo, nextRoundButton, autoPlayIndicator (DOM)
    // Depends on: Various State variables (scores, decks, flags)
    // Depends on: initialP1Deck, initialP2Deck (State - crucial for replay)
    // Calls: updateScoreIndicators(), updateGameInventoryCounts(), hideBettingPhase(), updateMainPotDisplay(), playRound()
    console.log("--- BATTLE DRAW! REPLAYING ---");
    roundResult.textContent = "Decks Empty! It's a Draw!";
    drawInfo.textContent = "Replaying battle with same decks...";
    await new Promise(resolve => setTimeout(resolve, 2500)); // Show message

    // --- Reset match state BUT keep original decks and pot ---
    player1Score = 0;
    player2Score = 0;
    currentRound = 0;
    // Reset betting flags allows betting again in replay
    bettingPhaseActive = false;
    betHasBeenRaised = false; // Should betting state reset? Original code did.
    player1HasRaised = false;
    player2HasEffectivelyRaised = false;
    autoPlayActive = false;
    storedPlayer1BetAction = null;
    // CRITICAL: Restore decks from saved initial state
    player1BattleDeck = [...initialP1Deck];
    player2BattleDeck = [...initialP2Deck];

    // Update UI for reset state
    updateScoreIndicators();
    updateGameInventoryCounts();
    hideBettingPhase(); // Ensure betting UI is hidden
    nextRoundButton.classList.add('hidden');
    autoPlayIndicator.classList.add('hidden');
    updateMainPotDisplay(); // Show pot (which carries over from previous match attempt)

    // Start the replay
    roundResult.textContent = "Replaying Round 1...";
    await new Promise(resolve => setTimeout(resolve, 1500)); // Brief pause
    isAnimating = false; // Allow playRound to run
    playRound(); // Start the first round of the replay
}

/** Main function orchestrating a single round: card draw, resolution, betting trigger or game end check. */
async function playRound() {
    // Depends on: isAnimating, bettingPhaseActive, autoPlayActive, player1BattleDeck, player2BattleDeck, player1Score, player2Score (State)
    // Depends on: Various DOM elements (resetCardStyles depends on cards, roundResult, drawInfo; indicators; buttons)
    // Depends on: maxRounds (Config)
    // Calls: resetCardStyles(), updateGameInventoryCounts(), getRandomChoice(), handleReplay(), endGame(), determineWinner(), startRoulette(), stopRoulette(), triggerAttackAnimation(), updateScoreIndicators(), showBettingPhase()
    if (isAnimating && !bettingPhaseActive) return; // Prevent overlap unless starting betting phase
    isAnimating = true; // Lock state during round execution/animation
    bettingPhaseActive = false; // Reset betting flag at round start

    // Reset UI for the round
    resetCardStyles();
    nextRoundButton.classList.add('hidden');
    bettingControls.classList.add('hidden');
    drawInfo.textContent = '';
    roundResult.textContent = 'Choosing...';
    autoPlayIndicator.classList.toggle('hidden', !autoPlayActive); // Show indicator if auto-playing

    // --- Check for Deck Out Conditions at START of round ---
    const p1DeckEmpty = player1BattleDeck.length === 0;
    const p2DeckEmpty = player2BattleDeck.length === 0;

    if (p1DeckEmpty && p2DeckEmpty) { // Both empty
        console.log("Both decks empty at start of round.");
        if (player1Score === player2Score) { handleReplay(); } else { endGame(); }
        return; // Stop round
    } else if (p1DeckEmpty) { // P1 empty
        console.log("P1 deck empty, P2 wins by default.");
        roundResult.textContent = "Your deck is empty!";
        await new Promise(resolve => setTimeout(resolve, 1500)); endGame(); return;
    } else if (p2DeckEmpty) { // P2 empty
        console.log("P2 deck empty, P1 wins by default.");
        roundResult.textContent = "Opponent's deck is empty!";
        await new Promise(resolve => setTimeout(resolve, 1500)); endGame(); return;
    }

    // --- Card Drawing and Resolution (handles draws internally) ---
    roundResult.textContent = 'Choosing...';
    let p1Choice, p2Choice, winner;
    let isFirstAttemptInLoop = true;

    while (true) { // Loop until a non-draw result or deck out
        p1Choice = getRandomChoice('player1');
        p2Choice = getRandomChoice('player2');

        // Check for deck out *during* draw loop (if getRandomChoice returns null)
        if (!p1Choice || !p2Choice) { console.log("A player ran out during draw resolution - ending game."); endGame(); return; }

        // Update UI for draw/re-draw
        if (!isFirstAttemptInLoop) {
            player1Card.classList.remove('winner', 'loser', 'draw'); // Reset styles before re-draw
            player2Card.classList.remove('winner', 'loser', 'draw');
            roundResult.textContent = 'Re-drawing...';
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause
        } else { roundResult.textContent = 'Revealing!'; }

        // Roulette animation
        let tempP1Interval = startRoulette(player1Card); // Use temp vars for safety
        let tempP2Interval = startRoulette(player2Card);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Reveal delay

        // Stop animation - check if interval exists before clearing
        if (tempP1Interval) stopRoulette(tempP1Interval, player1Card, p1Choice);
        if (tempP2Interval) stopRoulette(tempP2Interval, player2Card, p2Choice);
        // Ensure state interval IDs are clear if this round logic somehow runs fast/overlaps, though isAnimating flag should prevent this.
        p1RouletteInterval = null;
        p2RouletteInterval = null;

        winner = determineWinner(p1Choice, p2Choice); // Determine winner

        if (winner === 'draw') {
            roundResult.textContent = 'Draw!';
            player1Card.classList.add('draw'); player2Card.classList.add('draw');
            drawInfo.textContent = 'Selecting again...';
            isFirstAttemptInLoop = false; // Next iteration is a re-draw
            await new Promise(resolve => setTimeout(resolve, 1500)); // Pause after draw
            // Continue loop
        } else {
            break; // Exit loop, winner found
        }
    } // End draw resolution loop

    // --- Winner Found - Update Score & UI ---
    drawInfo.textContent = ''; // Clear draw info text
    await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause

    if (winner === 'player1') {
        player1Score++; roundResult.textContent = 'Player 1 Wins Round!';
        player1Card.className = 'card mx-auto winner attacking-p1'; // Combine classes for animation
        player2Card.className = 'card mx-auto loser';
        setTimeout(() => player1Card.classList.remove('attacking-p1'), 600); // Remove animation class after duration
    } else { // winner === 'player2'
        player2Score++; roundResult.textContent = 'Player 2 Wins Round!';
        player2Card.className = 'card mx-auto winner attacking-p2';
        player1Card.className = 'card mx-auto loser';
        setTimeout(() => player2Card.classList.remove('attacking-p2'), 600);
    }

    updateScoreIndicators(); // Update score display
    currentRound++; // Increment round count (tracks played rounds with winners)

    await new Promise(resolve => setTimeout(resolve, 600)); // Wait for animation

    // --- Check Game End Conditions or Proceed to Next Phase ---
    // Assumes 'maxRounds' config var accessible (target score)
    // console.log(`End of Round ${currentRound}: P1=${player1Score}, P2=${player2Score}, Max=${maxRounds}, AutoPlay=${autoPlayActive}`);

    if (player1Score >= maxRounds || player2Score >= maxRounds) { // Game Over?
        // console.log(`---> Calling endGame() because score reached ${maxRounds}.`);
        endGame();
    } else if (autoPlayActive) { // Auto-play next round?
        roundResult.textContent = "Auto-playing next round...";
        await new Promise(resolve => setTimeout(resolve, 1500));
        isAnimating = false; // Allow next round
        playRound(); // Start next round automatically
    } else { // Proceed to betting phase
        // console.log(`---> Triggering Betting Phase before Round ${currentRound + 1}`);
        showBettingPhase(); // Show betting UI (isAnimating remains true)
    }
}

/** Handles the end of a match (win/loss based on score), calculates payout, shows win screen. */
function endGame() {
    // Depends on: State (scores, pot, raise flags), Config (ante, raise amounts, pot values), DOM (win screen elements)
    // Calls: updateProfileStats(), triggerConfetti()
    // console.log(`Game Over Triggered: P1=${player1Score}, P2=${player2Score}, Pot=${currentPot}`);
    const player1Won = player1Score > player2Score;
    let rewardText = "";
    const finalPot = currentPot;
    autoPlayIndicator.classList.add('hidden');

    // Calculate Player 1's total contribution to the pot for net calculation
    let player1TotalBet = battleAnte; // Starts with ante
    // Assumes config pot values accessible
    if (finalPot === raisedPotMutual) { // Pot 30: Ante + P1 Raise + P1 Call P2 Raise = 5 + 5 + 5 = 15
        player1TotalBet = battleAnte + raiseAmount * 2;
    } else if (finalPot === raisedPotSingle) { // Pot 20: Ante + P1 Raise OR Ante + P1 Call P2 Raise = 5 + 5 = 10
        player1TotalBet = battleAnte + raiseAmount;
    } // Else pot is initialPot (10), P1 only paid ante (5)

    // console.log(`DEBUG: endGame - Pot=${finalPot}, P1TotalBet=${player1TotalBet}`);

    if (player1Won) {
        totalWins++; player1ENJ += finalPot; // Update stats and balance
        winMessage.textContent = "You Win!";
        winMessage.className = "text-5xl font-bold mb-4 text-green-400";
        const netGain = finalPot - player1TotalBet; // Calculate net
        rewardText = `You won the pot: ${finalPot}<span class="enj-coin">E</span> ENJ! (Net: +${netGain}<span class="enj-coin">E</span>)`;
        triggerConfetti(); // Visual celebration
    } else { // Player 2 Won or Draw went against P1
        totalLosses++; // Update stats
        // ENJ already deducted during betting, no change here.
        winMessage.textContent = "You Lose!";
        winMessage.className = "text-5xl font-bold mb-4 text-red-400";
        const amountLost = player1TotalBet; // P1's total contribution is the loss amount
        rewardText = `You lost ${amountLost}<span class="enj-coin">E</span> ENJ.`;
    }

    // Update UI for end game screen
    winReward.innerHTML = rewardText;
    updateProfileStats(); // Update profile display (wins/losses/balance)
    winScreen.classList.add('show'); // Show the overlay
    nextRoundButton.classList.add('hidden'); // Hide any game buttons
    bettingControls.classList.add('hidden');
    isAnimating = false; // Reset animation lock
}

/** Handles the end of a match due to Player 1 forfeiting. Displays loss based on ante. */
function endGameForfeit(amountLost = battleAnte) {
     // Depends on: State (totalLosses), Config (battleAnte passed as arg), DOM (win screen elements)
     // Calls: updateProfileStats()
     // console.log(`Forfeit Triggered: Amount Lost=${amountLost}`);
     autoPlayIndicator.classList.add('hidden');
     totalLosses++; // Update stats
     // Actual ENJ deductions happened earlier (ante, maybe raises). This just shows outcome.
     winMessage.textContent = "You Forfeited!";
     winMessage.className = "text-5xl font-bold mb-4 text-gray-400";
     // Display standard forfeit message based on initial ante cost
     winReward.innerHTML = `You lost ${amountLost}<span class="enj-coin">E</span> ENJ.`; // Use the passed ante value
     updateProfileStats(); // Update profile display
     winScreen.classList.add('show'); // Show overlay
     nextRoundButton.classList.add('hidden'); // Hide game buttons
     bettingControls.classList.add('hidden');
     isAnimating = false; // Reset animation lock
}


// --- (End of Core Game Logic & Animations) ---

// ...

// --- Deck Selection Functions ---

/** Validates the temporary deck counts against inventory and required size. Updates UI feedback and confirm button state. */
function validateDeckSelection() {
    // Depends on: tempDeckCounts, player1Inventory (State)
    // Depends on: battleDeckSize (Config)
    // Depends on: deckTotalDisplay, deckFeedback, confirmDeckButton (DOM)

    // Ensure state/config vars are accessible
    const r = tempDeckCounts['R'] || 0;
    const p = tempDeckCounts['P'] || 0;
    const s = tempDeckCounts['S'] || 0;
    const total = r + p + s;

    // Update total display in the modal
    // Assumes 'battleDeckSize' config var is accessible
    deckTotalDisplay.textContent = `Total: ${total} / ${battleDeckSize}`;
    deckFeedback.textContent = ''; // Clear previous feedback

    const invR = player1Inventory['R'] || 0;
    const invP = player1Inventory['P'] || 0;
    const invS = player1Inventory['S'] || 0;

    let isValid = true; // Assume valid initially

    // Check 1: Does the total count match the required deck size?
    if (total !== battleDeckSize) {
        deckTotalDisplay.className = 'deck-total-display invalid'; // Apply invalid style (check CSS class name)
        deckFeedback.textContent = `Deck must contain exactly ${battleDeckSize} cards.`;
        isValid = false;
    } else {
        deckTotalDisplay.className = 'deck-total-display valid'; // Apply valid style (check CSS class name)
        // Check 2: If total is correct, does the player own enough of each card?
        if (r > invR) {
            deckFeedback.textContent = `Not enough Rock cards in inventory (${invR}).`;
            isValid = false;
        } else if (p > invP) {
            deckFeedback.textContent = `Not enough Paper cards in inventory (${invP}).`;
            isValid = false;
        } else if (s > invS) {
            deckFeedback.textContent = `Not enough Scissor cards in inventory (${invS}).`;
            isValid = false;
        }
    }

    // Enable or disable the confirm button based on validity
    confirmDeckButton.disabled = !isValid;
}

/** Shows the deck selection modal, populates inventory counts, sets smart default counts, and validates. */
function showDeckSelection() {
    // Depends on: player1Inventory, tempDeckCounts (State)
    // Depends on: battleDeckSize (Config)
    // Depends on: invRCountEl, invPCountEl, invSCountEl, deckRDisplay, deckPDisplay, deckSDisplay, deckSelectionModal (DOM)
    // Calls: validateDeckSelection()

    // 1. Display player's current inventory counts within the modal
    const invR = player1Inventory['R'] || 0;
    const invP = player1Inventory['P'] || 0;
    const invS = player1Inventory['S'] || 0;
    invRCountEl.textContent = invR;
    invPCountEl.textContent = invP;
    invSCountEl.textContent = invS;

    // 2. Set initial/default counts in the modal, respecting inventory limits
    // Start with a default ratio (e.g., 4/3/3) but cap at inventory
    // Assumes 'battleDeckSize' config var is accessible
    tempDeckCounts = {
         R: Math.min(4, invR),
         P: Math.min(3, invP),
         S: Math.min(3, invS)
    };
    // Adjust if initial counts don't sum up to battleDeckSize, trying to add more where available
    let currentTotal = tempDeckCounts.R + tempDeckCounts.P + tempDeckCounts.S;
    while (currentTotal < battleDeckSize) {
        let cardAdded = false; // Flag to check if we could add a card in a cycle
        // Cycle through types and add one if possible and needed
        if (tempDeckCounts.R < invR) { tempDeckCounts.R++; currentTotal++; cardAdded = true; if(currentTotal === battleDeckSize) break; }
        if (tempDeckCounts.P < invP) { tempDeckCounts.P++; currentTotal++; cardAdded = true; if(currentTotal === battleDeckSize) break; }
        if (tempDeckCounts.S < invS) { tempDeckCounts.S++; currentTotal++; cardAdded = true; if(currentTotal === battleDeckSize) break; }
        // If we went through all types and couldn't add a card, inventory is insufficient - break loop
        if (!cardAdded) break;
    }

    // 3. Update the modal display to show these initial/adjusted counts
    deckRDisplay.textContent = tempDeckCounts.R;
    deckPDisplay.textContent = tempDeckCounts.P;
    deckSDisplay.textContent = tempDeckCounts.S;

    // 4. Validate the calculated default deck and set button state
    validateDeckSelection();

    // 5. Show the modal overlay
    deckSelectionModal.classList.add('show');
}
// --- (End of Deck Selection Functions) ---

// ...

// --- Screen Management & Initialization ---

/** Resets the game state for a *new* match (not just a round). Called before starting a new battle or returning to the main screen. */
function resetForNewMatch() {
    // Depends on: Various state variables (scores, decks, flags)
    // Depends on: Config variables (initialPot)
    // Depends on: UI elements (nextRoundButton, bettingControls, etc.)
    // Calls: clearBettingTimer(), updateGameInventoryCounts(), resetCardStyles(), updateScoreIndicators()
    clearBettingTimer(); // Needs to be defined
    player1Score = 0;
    player2Score = 0;
    currentRound = 0;
    player1BattleDeck = [];
    player2BattleDeck = [];
    initialP1Deck = [];
    initialP2Deck = [];
    // player2Inventory = generateRandomInventoryArray(Math.floor(Math.random() * 10) + 5); // This seems out of place - P2 inventory isn't tracked? Let's comment out for now based on the rest of the code. If P2 needs an inventory simulation beyond the deck, it needs more state variables.
    updateGameInventoryCounts(); // Update UI
    resetCardStyles(); // Reset UI
    updateScoreIndicators(); // Reset UI
    roundResult.textContent = '';
    drawInfo.textContent = '';
    nextRoundButton.classList.add('hidden');
    bettingControls.classList.add('hidden');
    bettingInfo.classList.add('hidden');
    autoPlayIndicator.classList.add('hidden');
    // Clear any leftover roulette intervals if a match was aborted abruptly
    if (p1RouletteInterval) clearInterval(p1RouletteInterval);
    if (p2RouletteInterval) clearInterval(p2RouletteInterval);
    p1RouletteInterval = null;
    p2RouletteInterval = null;
    isAnimating = false; // Reset flags
    bettingPhaseActive = false;
    betHasBeenRaised = false;
    player1HasRaised = false;
    player2HasEffectivelyRaised = false;
    autoPlayActive = false;
    currentPot = initialPot; // Reset pot to the base ante amount (needs initialPot from config)
    storedPlayer1BetAction = null;
}

/** Shows the initial "My Cards" screen and hides the game/modals. */
function showMyCardsScreen() {
    // Depends on: Various DOM elements (winScreen, gameArea, myCardsScreen, modals, etc.)
    // Calls: resetForNewMatch(), updateProfileStats(), displayMyCards()
    resetForNewMatch(); // Reset game state first
    updateProfileStats(); // Update profile numbers
    displayMyCards(); // Display current inventory
    winScreen.classList.remove('show'); // Hide win screen
    gameArea.classList.add('hidden'); // Hide game area
    myCardsScreen.classList.remove('hidden'); // Show main screen
    // Ensure modals are hidden
    buyModal.classList.remove('show');
    sellModal.classList.remove('show');
    buyFeedback.textContent = ''; // Clear modal feedback
    sellFeedback.textContent = '';
    battleStartPopup.classList.remove('show'); // Hide battle start popup
    anteFeedback.textContent = ''; // Clear ante feedback
    deckSelectionModal.classList.remove('show'); // Hide deck selection modal
}

// ...

// --- Utility Functions --- (Place this before Core Game Logic or where appropriate)

/** Generates a random array of RPS choices (simulates an inventory/deck). */
function generateRandomInventoryArray(size = 10) {
    // Depends on: choices (Config) - uses Object.keys
    const inventory = [];
    // Assumes 'choices' config var is accessible
    const types = Object.keys(choices); // Get ['R', 'P', 'S']
    for (let i = 0; i < size; i++) {
        // Add a random type to the array
        inventory.push(types[Math.floor(Math.random() * types.length)]);
    }
    return inventory;
}

// --- (End of Utility Functions) ---

// ...

// --- Initial Setup --- (This is the final execution call)
// Make sure this runs after the DOM is ready and all functions/variables are defined.
// If using modules or placing script at end of body, this is usually fine.
// Otherwise, wrap in DOMContentLoaded listener.
showMyCardsScreen(); // Actually call the function to display the initial screen

// --- (End of Screen Management & Initialization) ---

// --- Screen Management & Initialization ---

/** Resets the game state for a *new* match (not just a round). Called before starting a new battle or returning to the main screen. */
function resetForNewMatch() {
    // Depends on: Various state variables (scores, decks, flags)
    // Depends on: Config variables (initialPot)
    // Depends on: UI elements (nextRoundButton, bettingControls, etc.)
    // Calls: clearBettingTimer(), updateGameInventoryCounts(), resetCardStyles(), updateScoreIndicators()
    clearBettingTimer(); // Needs to be defined
    player1Score = 0;
    player2Score = 0;
    currentRound = 0;
    player1BattleDeck = [];
    player2BattleDeck = [];
    initialP1Deck = [];
    initialP2Deck = [];
    // player2Inventory = generateRandomInventoryArray(Math.floor(Math.random() * 10) + 5); // This seems out of place - P2 inventory isn't tracked? Let's comment out for now based on the rest of the code. If P2 needs an inventory simulation beyond the deck, it needs more state variables.
    updateGameInventoryCounts(); // Update UI
    resetCardStyles(); // Reset UI
    updateScoreIndicators(); // Reset UI
    roundResult.textContent = '';
    drawInfo.textContent = '';
    nextRoundButton.classList.add('hidden');
    bettingControls.classList.add('hidden');
    bettingInfo.classList.add('hidden');
    autoPlayIndicator.classList.add('hidden');
    // Clear any leftover roulette intervals if a match was aborted abruptly
    if (p1RouletteInterval) clearInterval(p1RouletteInterval);
    if (p2RouletteInterval) clearInterval(p2RouletteInterval);
    p1RouletteInterval = null;
    p2RouletteInterval = null;
    isAnimating = false; // Reset flags
    bettingPhaseActive = false;
    betHasBeenRaised = false;
    player1HasRaised = false;
    player2HasEffectivelyRaised = false;
    autoPlayActive = false;
    currentPot = initialPot; // Reset pot to the base ante amount (needs initialPot from config)
    storedPlayer1BetAction = null;
}

/** Shows the initial "My Cards" screen and hides the game/modals. */
function showMyCardsScreen() {
    // Depends on: Various DOM elements (winScreen, gameArea, myCardsScreen, modals, etc.)
    // Calls: resetForNewMatch(), updateProfileStats(), displayMyCards()
    resetForNewMatch(); // Reset game state first
    updateProfileStats(); // Update profile numbers
    displayMyCards(); // Display current inventory
    winScreen.classList.remove('show'); // Hide win screen
    gameArea.classList.add('hidden'); // Hide game area
    myCardsScreen.classList.remove('hidden'); // Show main screen
    // Ensure modals are hidden
    buyModal.classList.remove('show');
    sellModal.classList.remove('show');
    buyFeedback.textContent = ''; // Clear modal feedback
    sellFeedback.textContent = '';
    battleStartPopup.classList.remove('show'); // Hide battle start popup
    anteFeedback.textContent = ''; // Clear ante feedback
    deckSelectionModal.classList.remove('show'); // Hide deck selection modal
}


// --- Initial Setup --- (This is the final execution call)
// Make sure this runs after the DOM is ready and all functions/variables are defined.
// If using modules or placing script at end of body, this is usually fine.
// Otherwise, wrap in DOMContentLoaded listener.
showMyCardsScreen(); // Actually call the function to display the initial screen

// --- (End of Screen Management & Initialization) ---

// ...

// --- Event Listeners ---

// Main "Start Battle" button
challengeButton.addEventListener('click', async () => {
    // Depends on: isAnimating, player1ENJ (State); battleAnte (Config); anteFeedback (DOM)
    // Calls: showDeckSelection()
    if (isAnimating) return;
    anteFeedback.textContent = '';
    if (player1ENJ < battleAnte) {
        anteFeedback.textContent = `Insufficient ENJ. Need ${battleAnte} to play.`;
        setTimeout(() => anteFeedback.textContent = '', 3000);
        return;
    }
    showDeckSelection(); // Show deck modal if enough ENJ
});

// Deck Selection Modal: +/- adjustment buttons
deckAdjustButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Depends on: tempDeckCounts, player1Inventory (State); Deck display elements (DOM)
        // Calls: validateDeckSelection()
        const type = button.dataset.type;
        const action = button.dataset.action;
        const currentCount = tempDeckCounts[type];
        const inventoryMax = player1Inventory[type] || 0;

        if (action === 'increment' && currentCount < inventoryMax) {
            tempDeckCounts[type]++;
        } else if (action === 'decrement' && currentCount > 0) {
            tempDeckCounts[type]--;
        }
        document.getElementById(`deck-${type.toLowerCase()}-display`).textContent = tempDeckCounts[type];
        validateDeckSelection(); // Validate after every adjustment
    });
});

// Deck Selection Modal: "Cancel" button
cancelDeckButton.addEventListener('click', () => {
    // Depends on: deckSelectionModal (DOM)
    deckSelectionModal.classList.remove('show');
});

// Deck Selection Modal: "Confirm Deck & Battle!" button
confirmDeckButton.addEventListener('click', async () => {
    // Depends on: confirmDeckButton (DOM state); player1ENJ, tempDeckCounts, various deck states (State); battleAnte, initialPot, battleDeckSize (Config); various DOM elements (modals, screens)
    // Calls: validateDeckSelection(), updateENJBalanceDisplay(), generateRandomInventoryArray(), updateMainPotDisplay(), updateGameInventoryCounts(), playRound()
    validateDeckSelection(); // Final validation check
    if (confirmDeckButton.disabled) return; // Exit if deck is invalid

    // 1. Deduct Ante & Prepare Decks
    player1ENJ -= battleAnte;
    const r = tempDeckCounts.R, p = tempDeckCounts.P, s = tempDeckCounts.S;
    player1BattleDeck = [ ...Array(r).fill('R'), ...Array(p).fill('P'), ...Array(s).fill('S') ];
    initialP1Deck = [...player1BattleDeck]; // Save for replays
    player2BattleDeck = generateRandomInventoryArray(battleDeckSize); // Generate opponent deck
    initialP2Deck = [...player2BattleDeck]; // Save for replays

    // 2. Reset Match State relevant for start
    currentPot = initialPot;
    betHasBeenRaised = false; player1HasRaised = false; player2HasEffectivelyRaised = false; autoPlayActive = false;
    // Note: Scores/round are reset within resetForNewMatch, called by showMyCardsScreen earlier.

    // 3. Update UI
    updateENJBalanceDisplay();
    updateMainPotDisplay();
    updateGameInventoryCounts();

    // 4. Transition UI to Battle Arena
    deckSelectionModal.classList.remove('show');
    isAnimating = true;
    myCardsScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');

    // 5. Show "Battle Start!" popup
    battleStartPopup.classList.add('show');
    await new Promise(resolve => setTimeout(resolve, 1800)); // Animation duration
    battleStartPopup.classList.remove('show');
    await new Promise(resolve => setTimeout(resolve, 300)); // Pause after fade

    // 6. Start Round 1
    isAnimating = false;
    playRound();
});

// "Next Round" button (if used)
nextRoundButton.addEventListener('click', playRound);

// "Play Again / Back to My Cards" button (on Win Screen)
playAgainButton.addEventListener('click', showMyCardsScreen); // Resets and shows main screen

// Betting control buttons
callButton.addEventListener('click', () => handlePlayer1BetAction('call'));
raiseButton.addEventListener('click', () => handlePlayer1BetAction('raise'));
forfeitButton.addEventListener('click', () => handlePlayer1BetAction('forfeit'));

// Buttons to open Buy/Sell modals
buyButton.addEventListener('click', () => {
    updateBuySellCurrentCounts(); // Populate modal before showing
    buyModal.classList.add('show');
    buyFeedback.textContent = '';
});
sellButton.addEventListener('click', () => {
    updateBuySellCurrentCounts(); // Populate modal before showing
    sellModal.classList.add('show');
    sellFeedback.textContent = '';
});

// Inputs within Buy/Sell modals that trigger updates
buyTypeSelect.addEventListener('change', updateBuySellCurrentCounts);
sellTypeSelect.addEventListener('change', updateBuySellCurrentCounts);
//buyQuantityInput.addEventListener('input', updateBuySellCurrentCounts);
//sellQuantityInput.addEventListener('input', updateBuySellCurrentCounts);

// Buy/Sell modal "Cancel" buttons
cancelBuyButton.addEventListener('click', () => {
    buyModal.classList.remove('show');
    buyFeedback.textContent = '';
});
cancelSellButton.addEventListener('click', () => {
    sellModal.classList.remove('show');
    sellFeedback.textContent = '';
});

// Buy Modal "Confirm" button (includes purchase logic)
confirmBuyButton.addEventListener('click', () => {
    // Depends on: DOM inputs, State (ENJ, Inventory), DOM feedback/modal elements
    // Calls: calculateCurrentPrice, getAvailableSupply, displayMyCards
    const type = buyTypeSelect.value;
    
    //const quantity = parseInt(buyQuantityInput.value);
    const quantity = parseInt(buyQuantityDisplay.textContent); // New line - read from span

    const price = calculateCurrentPrice(type);
    const available = getAvailableSupply(type);
    const cost = price * quantity;
    buyFeedback.className = 'modal-feedback feedback-error';

    if (!quantity || quantity <= 0) { buyFeedback.textContent = 'Invalid quantity.'; }
    else if (quantity > available) { buyFeedback.textContent = `Only ${available} available to buy.`; }
    else if (player1ENJ < cost) { buyFeedback.textContent = 'Insufficient ENJ balance.'; }
    else { // Purchase valid
        player1ENJ -= cost;
        player1Inventory[type] = (player1Inventory[type] || 0) + quantity;
        buyFeedback.className = 'modal-feedback feedback-success';
        buyFeedback.textContent = `Bought ${quantity} ${type} for ${cost} ENJ!`;
        displayMyCards(); // Update main screen inventory
        setTimeout(() => { buyModal.classList.remove('show'); buyFeedback.textContent = ''; }, 1500); // Hide modal after delay
        return;
    }
    // Clear error feedback after delay if purchase failed validation
    setTimeout(() => buyFeedback.textContent = '', 2500);
});

// Sell Modal "Confirm" button (includes sale logic)
confirmSellButton.addEventListener('click', () => {
    // Depends on: DOM inputs, State (ENJ, Inventory), DOM feedback/modal elements
    // Calls: calculateCurrentPrice, displayMyCards
    const type = sellTypeSelect.value;

    //const quantity = parseInt(sellQuantityInput.value);
    const quantity = parseInt(sellQuantityDisplay.textContent); // New line - read from span

    const price = calculateCurrentPrice(type);
    const currentOwned = player1Inventory[type] || 0;
    const earnings = price * quantity;
    sellFeedback.className = 'modal-feedback feedback-error';

    if (!quantity || quantity <= 0) { sellFeedback.textContent = 'Invalid quantity.'; }
    else if (quantity > currentOwned) { sellFeedback.textContent = 'Cannot sell more than you own.'; }
    else { // Sale valid
        player1ENJ += earnings;
        player1Inventory[type] = currentOwned - quantity;
        sellFeedback.className = 'modal-feedback feedback-success';
        sellFeedback.textContent = `Sold ${quantity} ${type} for ${earnings} ENJ!`;
        displayMyCards(); // Update main screen inventory
        setTimeout(() => { sellModal.classList.remove('show'); sellFeedback.textContent = ''; }, 1500); // Hide modal after delay
        return;
    }
    // Clear error feedback after delay if sale failed validation
    setTimeout(() => sellFeedback.textContent = '', 2500);
});

// Inside "// --- Event Listeners ---"

// Listeners for Buy/Sell Modal +/- Buttons
quantityAdjustButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.dataset.modal; // 'buy' or 'sell'
        const action = button.dataset.action; // 'increment' or 'decrement'
        let currentQuantity = 0;
        let displayElement = null;
        let maxQuantity = Infinity; // Default max for buying (limited by availability later)

        // Determine target display and current value
        if (modal === 'buy') {
            displayElement = buyQuantityDisplay;
            currentQuantity = parseInt(displayElement.textContent) || 0;
            // Max quantity for buying depends on availability (check inside increment)
        } else { // modal === 'sell'
            displayElement = sellQuantityDisplay;
            currentQuantity = parseInt(displayElement.textContent) || 0;
            // Max quantity for selling is the amount owned
            const sellType = sellTypeSelect.value;
            maxQuantity = player1Inventory[sellType] || 0;
        }

        // Calculate new quantity based on action
        let newQuantity = currentQuantity;
        if (action === 'increment') {
             // Specific check for buying availability might be complex here,
             // let's rely on user seeing the cost/availability update.
             // For selling, respect the maxQuantity (amount owned).
             if (modal === 'buy') {
                 // Can potentially check against 'buyAvailable' here, but let's keep it simple
                 newQuantity++;
             } else { // selling
                  if (currentQuantity < maxQuantity) {
                      newQuantity++;
                  }
             }

        } else if (action === 'decrement') {
            if (currentQuantity > 1) { // Minimum quantity is 1
                newQuantity--;
            }
        }

        // Update the display if quantity changed
        if (newQuantity !== currentQuantity && displayElement) {
            displayElement.textContent = newQuantity;
            // CRITICAL: Update costs/earnings after changing quantity
            updateBuySellCurrentCounts();
        }
    });
});

// --- (End of Event Listeners) ---

// ...

// --- Initial Setup ---
// (Code to start the game, like showMyCardsScreen(), will go here later)
// showMyCardsScreen(); // Example
showMyCardsScreen(); // Actually call the function to display the initial screen