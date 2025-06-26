(() => {
  const hypeScreen = document.getElementById("hype-screen");
  let hypeASelect, hypeBSelect, hypePhraseOutputs;

  document.addEventListener("showHypePhraseScreen", () => {
    hypeScreen.classList.remove("hidden");
    hypeScreen.innerHTML = `
      <label for="hypeASelect" style="color:#666; font-size:14px; margin-bottom:5px; display:block;">
        Select Type of Hype Phrase:
      </label>
      <select id="hypeASelect" style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
        <option value="">-- Select Type of Hype Phrase --</option>
      </select>
      <label for="hypeBSelect" style="color:#666; font-size:14px; margin-bottom:5px; display:block; margin-top: 15px;">
        Select Energy of Hype Phrase:
      </label>
      <select id="hypeBSelect" disabled style="width: 100%; max-width: 400px; box-sizing: border-box; padding: 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
        <option value="">-- Select Energy of Hype Phrase --</option>
      </select>
      <div id="hypePhraseOutputs" style="margin-top: 15px;"></div>
    `;

    hypeASelect = document.getElementById("hypeASelect");
    hypeBSelect = document.getElementById("hypeBSelect");
    hypePhraseOutputs = document.getElementById("hypePhraseOutputs");

    populateHypeACategories();

    hypeASelect.addEventListener("change", onHypeAChange);
    hypeBSelect.addEventListener("change", onHypeBChange);
  });

  function populateHypeACategories() {
    hypeASelect.innerHTML = '<option value="">-- Select Type of Hype Phrase --</option>';
    const categories = new Set();

    (window.AppState.allData.hypePhrases || []).forEach(row => {
      if(row.active_status === "active" && row.Type) {
        categories.add(row.Type);
      }
    });

    [...categories].sort().forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      hypeASelect.appendChild(option);
    });

    hypeBSelect.innerHTML = '<option value="">-- Select Energy of Hype Phrase --</option>';
    hypeBSelect.disabled = true;
    hypePhraseOutputs.innerHTML = "";
  }

  function onHypeAChange() {
    const selectedType = hypeASelect.value;
    hypeBSelect.innerHTML = '<option value="">-- Select Energy of Hype Phrase --</option>';
    if (!selectedType) {
      hypeBSelect.disabled = true;
      hypePhraseOutputs.innerHTML = "";
      return;
    }
    const energies = new Set();
    (window.AppState.allData.hypePhrases || []).forEach(row => {
      if(row.active_status === "active" && row.Type === selectedType && row.Energy) {
        energies.add(row.Energy);
      }
    });

    [...energies].sort().forEach(energy => {
      const option = document.createElement("option");
      option.value = energy;
      option.textContent = energy;
      hypeBSelect.appendChild(option);
    });

    hypeBSelect.disabled = false;
    hypePhraseOutputs.innerHTML = "";
  }

  function onHypeBChange() {
    const selectedType = hypeASelect.value;
    const selectedEnergy = hypeBSelect.value;
    if (!selectedEnergy) {
      hypePhraseOutputs.innerHTML = "";
      return;
    }

    const hypePhrases = (window.AppState.allData.hypePhrases || []).filter(row =>
      row.active_status === "active" &&
      row.Type === selectedType &&
      row.Energy === selectedEnergy
    );

    const unitVal = document.getElementById("unitDropdown")?.value || "[[UNIT]]";

    let html = "";
    const shuffledMatches = (window.AppState.matches || []).slice().sort(() => Math.random() - 0.5);

    shuffledMatches.forEach(match => {
      const gameTime = match?.row?.["Commence Time (UTC)"] ?
        new Date(match.row["Commence Time (UTC)"]).toLocaleString("en-US", {
          timeZone: "America/New_York",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }) + " EST" : "N/A";

      const sportFromInput = match?.row?.["Sport Name"] || "N/A";

      const shuffledPhrases = hypePhrases.slice().sort(() => Math.random() - 0.5);

      shuffledPhrases.forEach(row => {
        const sport = row.Sport || "N/A";
        const phrase = row.Phrase || "";
        const promo = row.Promo || "";

        const postTitle = `${unitVal} UNIT(s) - ${phrase} - ${sportFromInput} - STARTS @ ${gameTime}`;
        const displaySport = (sport === "N/A" ? "Used for Any Sport" : sport);

        html += `
          <div class="hypeOutputBlock" tabindex="0" role="button" aria-pressed="false"
            style="border: 1px solid #2a9fd6; padding: 10px; margin-bottom: 10px; cursor: pointer; border-radius: 6px; font-size: 11px;"
            data-sport="${sportFromInput}"
            data-commencetime="${gameTime}"
            data-phrase="${phrase}"
            data-promo="${promo}"
          >
            <div><strong>Related Sport: </strong>${displaySport}</div>
            <div><strong>Post Title: </strong>${postTitle}</div>
            <div><strong>Post Desc: </strong><span>${promo}</span></div>
          </div>
        `;
      });
    });

    hypePhraseOutputs.innerHTML = html;

    Array.from(hypePhraseOutputs.querySelectorAll(".hypeOutputBlock")).forEach(block => {
      block.onclick = () => {
        const sportFromInput = block.dataset.sport || "N/A";
        const gameTime = block.dataset.commencetime || "N/A";
        const phrase = block.dataset.phrase || "";
        const promo = block.dataset.promo || "";

        const unitVal = document.getElementById("unitDropdown")?.value || "[[UNIT]]";

        window.AppState.selectedHypePostTitle = `${unitVal} UNIT(s) - ${phrase} - ${sportFromInput} - STARTS @ ${gameTime}`;
        window.AppState.selectedHypeRow = { Promo: promo, Phrase: phrase, Sport: sportFromInput };
        window.AppState.selectedHypeNote = window.AppState.latestNote || "N/A";

        hypeScreen.classList.add("hidden");
        document.dispatchEvent(new CustomEvent("finalOutputReady"));
      };

      block.onkeydown = e => {
        if(e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          block.click();
        }
      };
    });
  }
})();
