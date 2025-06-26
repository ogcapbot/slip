// js/picktype.js
(() => {
  const pickTypeScreen = document.getElementById("pickTypeScreen");
  const sportsScreen = document.getElementById("sports-screen");

  const btnStraight = document.getElementById("btnStraightPick");
  const btnUpTo5 = document.getElementById("btnUpTo5");
  const btn6to15 = document.getElementById("btn6to15");

  btnStraight.addEventListener("click", () => {
    window.AppState.pickType = "straight";
    navigateToSportsScreen();
  });

  btnUpTo5.addEventListener("click", () => {
    window.AppState.pickType = "upTo5";
    window.AppState.parlayPicks = [];
    window.AppState.currentPickNumber = 1;
    navigateToSportsScreen();
  });

  btn6to15.addEventListener("click", () => {
    window.AppState.pickType = "6to15";
    window.AppState.parlayPicks = [];
    window.AppState.currentPickNumber = 1;
    navigateToSportsScreen();
  });

  function navigateToSportsScreen() {
    pickTypeScreen.classList.add("hidden");
    sportsScreen.classList.remove("hidden");

    // Trigger an event to init game screen
    document.dispatchEvent(new CustomEvent("startSportsScreen"));
  }
})();
