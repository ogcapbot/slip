(() => {
  const pickTypeScreen = document.getElementById("pickTypeScreen");
  const sportsScreen = document.getElementById("sports-screen");

  const btnStraight = document.getElementById("btnStraightPick");
  const btnUpTo5 = document.getElementById("btnUpTo5");
  const btn6to15 = document.getElementById("btn6to15");

  btnStraight.addEventListener("click", () => {
    window.AppState.pickType = "straight";
    proceedToSports();
  });

  btnUpTo5.addEventListener("click", () => {
    window.AppState.pickType = "upTo5";
    window.AppState.parlayPicks = [];
    window.AppState.currentPickNumber = 1;
    proceedToSports();
  });

  btn6to15.addEventListener("click", () => {
    window.AppState.pickType = "6to15";
    window.AppState.parlayPicks = [];
    window.AppState.currentPickNumber = 1;
    proceedToSports();
  });

  function proceedToSports() {
    pickTypeScreen.classList.add("hidden");
    sportsScreen.classList.remove("hidden");
    document.dispatchEvent(new CustomEvent("startSportsScreen"));
  }
})();
