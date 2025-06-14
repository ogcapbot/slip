// engine.js

// Map sport keywords to emojis
const sportEmojis = {
  nba: '🏀',
  mlb: '⚾',
  nfl: '🏈',
  nhl: '🏒',
  soccer: '⚽',
  mma: '🥋',
  tennis: '🎾',
  golf: '⛳',
  boxing: '🥊',
  ncaab: '🏀',
  ncaaf: '🏈',
  other: '❓'
};

function getSportEmoji(sportKey) {
  return sportEmojis[sportKey.toLowerCase()] || '❓';
}

function getCurrentDateTimeEST() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function convertDecimalToFraction(value) {
  const map = {
    0.1: '1/10', 0.2: '1/5', 0.25: '1/4', 0.3: '3/10',
    0.5: '1/2', 0.6: '3/5', 0.7: '7/10', 0.75: '3/4',
    0.8: '4/5', 0.9: '9/10', 1: '1', 1.5: '1 1/2',
    2: '2', 2.5: '2 1/2', 3: '3', 3.5: '3 1/2',
    4: '4', 4.5: '4 1/2'
  };
  return map[parseFloat(value)] || value.toString();
}

function parseWagerInput(rawInput, unitSize) {
  // Extract fractional units like "1/2", convert to decimal
  const unitMatch = rawInput.match(/([\d.\/]+)\s*unit/i);
  let unitWagered = unitMatch ? unitMatch[1] : '1';
  if (unitWagered.includes('/')) {
    const [num, denom] = unitWagered.split('/').map(Number);
    unitWagered = (num / denom).toFixed(2);
  }
  const fractionLabel = convertDecimalToFraction(unitWagered);

  const desc = rawInput.replace(/([\d.\/]+)\s*unit/i, '').trim();

  const wagered = (unitSize * parseFloat(unitWagered)).toFixed(2);
  const toWin = (parseFloat(wagered) * 0.9).toFixed(2);

  const block = {
    line1: `- ${desc}`,
    line2: `💰 ODDS: -110   📦 UNITS RISKED: ${fractionLabel}`,
    line3: `💸 RISKED: $${wagered}   📈 TO WIN: $${toWin}   ⏳ PENDING`
  };

  return block;
}

function generateTicket(wagers, unitSize = 100, capperName = 'Unknown', ticketId = '000000') {
  const dateTime = getCurrentDateTimeEST();
  let slipTotalRisk = 0;
  let slipTotalWin = 0;

  const blocks = wagers.map((raw, i) => {
    const b = parseWagerInput(raw, unitSize);
    slipTotalRisk += parseFloat(b.line3.match(/\$([\d.]+)/)[1]);
    slipTotalWin += parseFloat(b.line3.match(/TO WIN: \$([\d.]+)/)[1]);

    return `[$
