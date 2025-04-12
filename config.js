// --- Configuration & Settings ---

// Gameplay Settings
const maxRounds = 3; // Target score to win the match
const choices = { R: '✊', P: '✋', S: '✌️' }; // Available choices and their display icons
const choiceOrder = ['R', 'P', 'S']; // Order used for roulette animation
const battleDeckSize = 10; // Required size for player battle decks

// Economy Settings
const totalSupply = { R: 50, P: 50, S: 50 }; // Simulated total supply for card pricing
const basePrice = { R: 10, P: 10, S: 10 }; // Base price for buying/selling cards
const battleAnte = 5; // ENJ cost for each player to start a battle
const raiseAmount = 5; // ENJ amount for a single raise action
const initialPot = battleAnte * 2; // Pot value after both players pay ante (e.g., 10)
const raisedPotSingle = initialPot + raiseAmount * 2; // Pot value if one player raises and the other calls (e.g., 10 + 5 + 5 = 20)
const raisedPotMutual = initialPot + raiseAmount * 4; // Pot value if both players raise and call (e.g., 10 + 5 + 5 + 5 + 5 = 30)

// Timer Settings
let bettingTimerSeconds = 10; // Initial duration for the betting action timer (Note: this 'let' is modified at runtime, but its initial value is a setting)

// --- (End of Configuration & Settings) ---

/*
NOTE on Animation Durations:
Most animation timings (like roulette speed, attack animation duration, reveal delays,
popup fade times) are currently hardcoded directly within setTimeout calls or CSS @keyframes
in the original code (e.g., setTimeout(..., 1500), animation: attack-p1 0.6s).
If you want these to be configurable, you would need to declare them as constants
in this section and replace the hardcoded values throughout the code. For example:

const REVEAL_DELAY_MS = 1500;
const ATTACK_ANIMATION_DURATION_MS = 600;
const ROULETTE_INTERVAL_MS = 75;
*/