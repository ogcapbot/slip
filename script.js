
async function generateTicket() {
  const input = document.getElementById("userInput").value;
  const unitVal = parseFloat(document.getElementById("unitValue").value);
  const match = input.match(/(.+)\s+(ML|O[UV]|[-+]\d+\.?\d*)\s+(\d+\.?\d*)u/i);

  if (!match) {
    document.getElementById("output").textContent = "Invalid format. Try: Yankees ML 1.5u";
    return;
  }

  const team = match[1].toUpperCase();
  const betType = match[2].toUpperCase();
  const units = parseFloat(match[3]);
  const risk = unitVal * units;

  const now = new Date();
  const ticketId = Math.floor((now - new Date('1981-07-25T16:00:00Z')) / 1000) + "-" + (now.getMonth()+1).toString().padStart(2,'0') + now.getFullYear().toString().slice(-2);

  const output = \`
OG CAPPER BETS        | ogcapperbets.com
----------------------------------------
           OFFICIAL PICK
----------------------------------------
STRAIGHT BET

WAGER: ${input.toUpperCase()}
TEAM: ${team}

RISK: $${risk.toFixed(2)}
ID: ${ticketId}
TIME: ${now.toLocaleString()}

════════════════⚠️ STRICT CONFIDENTIALITY NOTICE ⚠️════════════════
All OG Capper Bets Content—Public, Free, or Paid—is for your eyes only.
Leaking, Sharing, Copying, Forwarding or Using ANY Content is Strictly Prohibited.
Violation = Immediate Termination. No Refund. No Appeal. Lifetime Ban.
Full Terms, Rules and Disclaimers are available @ ogcapperbets.com.
\`;

  document.getElementById("output").textContent = output;
}
