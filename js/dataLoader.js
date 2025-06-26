// dataLoader.js
let allData = {};

async function loadAllData() {
  try {
    const res = await fetch(BASE_URL + "?action=data");
    allData = await res.json();

    document.getElementById("loader").style.display = "none";
    document.getElementById("loadingMsg").style.display = "none";

    Array.from(document.querySelectorAll("#sports-screen > *")).forEach(el => {
      if (el.id !== "loader" && el.id !== "loadingMsg") {
        el.style.display = "";
      }
    });

    document.getElementById("loggedInInfo").classList.remove("hidden");
    document.getElementById("teamSearch").focus();
    document.getElementById("loginNotice").textContent = `Logged in as: ${capperName}`;

  } catch {
    alert("Failed to load sports data.");
  }
}
