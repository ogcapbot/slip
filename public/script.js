const form = document.getElementById("bet-form");
const input = document.getElementById("bet-input");
const preview = document.getElementById("slip-preview");
const titleBox = document.getElementById("title-box");
const titleEl = document.getElementById("ticket-title");
const copyBtn = document.getElementById("copy-title");
const downloadBtn = document.getElementById("download-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  preview.textContent = "Building slip…";
  titleBox.classList.add("hidden");
  downloadBtn.classList.add("hidden");

  const res = await fetch("/api/betslip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: input.value }),
  });

  if (!res.ok) {
    const err = await res.json();
    preview.textContent = `⚠️  ${err.error}`;
    return;
  }

  const slip = await res.json();

  const ticketTitle = `"${slip.team} ML | ${slip.odds > 0 ? "+" : ""}${slip.odds}"`;
  titleEl.textContent = ticketTitle;
  titleBox.classList.remove("hidden");

  preview.textContent = `
[OG Capper Bets]
${slip.timestamp}
Ticket #: ${slip.id}

${slip.team}  @ ${slip.matchup}
Game Time: ${slip.gameTime}
Odds: ${slip.odds}

Wager: ${slip.wager}
Payout: ${slip.payout}
  `.trim();

  downloadBtn.classList.remove("hidden");
});

copyBtn.addEventListener("click", () =>
  navigator.clipboard.writeText(titleEl.textContent)
);
