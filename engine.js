
async function fetchData() {
  const wager1 = document.getElementById("wager1").value;
  const wager2 = document.getElementById("wager2").value;
  const wagers = [wager1, wager2].filter(Boolean);

  let output = "🏛️ OG Capper Bets – Official Bet Ticket\n\n";

  for (let i = 0; i < wagers.length; i++) {
    const wager = wagers[i];
    // Placeholder: Replace this with real game lookup + parsing
    output += `[${i + 1}] ${wager}\n`;
    output += "🕒 GAME TIME: 7:05 PM ET – Venue TBD\n";
    output += "💰 ODDS: -110   📦 UNITS RISKED: 1\n";
    output += "💸 RISKED: $50   📈 TO WIN: $45   ⏳ PENDING\n\n";
  }

  output += "═══════════════════════════════════════\n";
  output += "🔒 THANK YOU FOR TRUSTING OG CAPPER BETS.";

  document.getElementById("output").textContent = output;
}
