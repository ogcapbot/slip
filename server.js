import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Embedded Odds API Key
const ODDS_KEY = "5b3cb0e7293b7d6217e6e99fa768fd0b";
const START = new Date("1981-07-25T12:00:00Z").getTime();

function secondsSinceStart() {
  return Math.floor((Date.now() - START) / 1000);
}
function formatTicketId() {
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${secondsSinceStart()}-${mm}${yy}`;
}
function parseInput(str) {
  const [team, marketCode, betType, unitsRaw] = str.toLowerCase().split(" ");
  const units = parseFloat(unitsRaw.replace("u",""))||1;
  return { team, betType, marketCode, units };
}
function americanToDecimal(odds) {
  return odds>0 ? 1 + odds/100 : 1 - 100/odds;
}

app.post("/api/betslip", async (req, res) => {
  const { team, betType, marketCode, units } = parseInput(req.body.input);
  const oddsRes = await fetch(
    `https://api.the-odds-api.com/v4/sports/${marketCode}/odds?apiKey=${ODDS_KEY}&regions=us&mkt=${betType}`
  );
  const oddsData = await oddsRes.json();
  const event = oddsData.find(e =>
    e.home_team.toLowerCase().includes(team) ||
    e.away_team.toLowerCase().includes(team)
  );
  if (!event) return res.status(404).json({error: `No ${marketCode} game for "${team}".`});
  const market = event.bookmakers[0].markets[0];
  const selection = market.outcomes.find(o => o.name.toLowerCase().includes(team));
  const american = selection.price;
  const decimal = americanToDecimal(american);
  const wagerAmt = units * 100;
  const payout = (wagerAmt * decimal).toFixed(2);

  res.json({
    id: formatTicketId(),
    timestamp: new Date().toLocaleString("en-US"),
    team: selection.name,
    matchup: `${event.away_team} @ ${event.home_team}`,
    gameTime: new Date(event.commence_time).toLocaleString("en-US"),
    odds: american,
    wager: `$${wagerAmt.toFixed(2)}`,
    payout: `$${payout}`,
    units
  });
});

const PORT = process.env.PORT||8080;
app.listen(PORT, ()=>console.log(`Listening on ${PORT}`));
