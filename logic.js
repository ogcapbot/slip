
function generateSlip() {
  const wager1 = document.getElementById("wager1").value;
  const wager2 = document.getElementById("wager2").value;
  const wagers = [wager1, wager2].filter(Boolean);
  let slip = "🏛️ OG Capper Bets – Official Bet Ticket\n\n";
  wagers.forEach((w, i) => {
    slip += `[${i + 1}] ${w}\n`;
    slip += "🕒 GAME TIME: TBD\n💰 ODDS: -110   📦 UNITS RISKED: 1\n💸 RISKED: $50   📈 TO WIN: $45   ⏳ PENDING\n\n";
  });
  slip += "═══════════════════════════════════════\n";
  slip += "🔒 THANK YOU FOR TRUSTING OG CAPPER BETS.";
  document.getElementById("output").textContent = slip;
}
