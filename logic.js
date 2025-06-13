function generateSlip() {
  const w1 = document.getElementById('wager1').value.trim();
  const w2 = document.getElementById('wager2').value.trim();

  const bets = [w1, w2].filter(b => b).map((bet, i) =>
    `[${i + 1}] ${bet}\n🕒 GAME TIME: TBD\n💰 ODDS: -110   📦 UNITS RISKED: 1\n💸 RISKED: $50   📈 TO WIN: $45   ⏳ PENDING\n`
  ).join('\n');

  const slip = `█████████████████████████████████████████████
🏛️ OG Capper Bets – Official Bet Ticket

${bets}
═══════════════════════════════════════
🔒 THANK YOU FOR TRUSTING OG CAPPER BETS.`;

  document.getElementById('output').innerText = slip;
}
