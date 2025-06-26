// hypephrase.js

function showHypePhraseStep() {
  document.getElementById("notesChoiceSection").classList.add("hidden");
  document.getElementById("notesInputSection").classList.add("hidden");
  document.getElementById("hypePhraseStep").classList.remove("hidden");

  populateHypeACategories();
}

function populateHypeACategories() {
  const selectA = document.getElementById("hypeASelect");
  selectA.innerHTML = '<option value="">-- Select Type of Hype Phrase --</option>';

  const categories = new Set();
  (allData.hypePhrases || []).forEach(row => {
    if (row.active_status === "active" && row.Type && !categories.has(row.Type)) {
      categories.add(row.Type);
    }
  });

  [...categories].sort().forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectA.appendChild(option);
  });

  const selectB = document.getElementById("hypeBSelect");
  selectB.innerHTML = '<option value="">-- Select Energy of Hype Phrase --</option>';
  selectB.disabled = true;

  document.getElementById("hypePhraseOutputs").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const hypeASelect = document.getElementById("hypeASelect");
  const hypeBSelect = document.getElementById("hypeBSelect");

  hypeASelect.addEventListener("change", function () {
    const selectedType = this.value;
    const selectB = document.getElementById("hypeBSelect");
    selectB.innerHTML = '<option value="">-- Select Energy of Hype Phrase --</option>';

    if (!selectedType) {
      selectB.disabled = true;
      document.getElementById("hypePhraseOutputs").innerHTML = "";
      return;
    }

    const energies = new Set();
    (allData.hypePhrases || []).forEach(row => {
      if (row.active_status === "active" && row.Type === selectedType && row.Energy) {
        energies.add(row.Energy);
      }
    });

    [...energies].sort().forEach(energy => {
      const option = document.createElement("option");
      option.value = energy;
      option.textContent = energy;
      selectB.appendChild(option);
    });

    selectB.disabled = false;
    document.getElementById("hypePhraseOutputs").innerHTML = "";
  });

  hypeBSelect.addEventListener("change", function () {
    const selectedType = document.getElementById("hypeASelect").value;
    const selectedEnergy = this.value;
    const outputDiv = document.getElementById("hypePhraseOutputs");

    if (!selectedEnergy) {
      outputDiv.innerHTML = "";
      return;
    }

    const hypePhrases = (allData.hypePhrases || []).filter(row =>
      row.active_status === "active" &&
      row.Type === selectedType &&
      row.Energy === selectedEnergy
    );

    const unitVal = document.getElementById("unitDropdown")?.value || "[[UNIT]]";

    let html = "";

    const shuffledMatches = matches.slice().sort(() => Math.random() - 0.5);

    shuffledMatches.forEach(match => {
      const gameTime = match && match.row && match.row["Commence Time (UTC)"] ?
        new Date(match.row["Commence Time (UTC)"]).toLocaleString("en-US", {
          timeZone: "America/New_York",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }) + " EST" : "N/A";

      const sportFromInput = match.row ? (match.row["Sport Name"] || "N/A") : "N/A";

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

    outputDiv.innerHTML = html;

    Array.from(outputDiv.querySelectorAll(".hypeOutputBlock")).forEach((block) => {
      block.onclick = () => {
        const sportFromInput = block.dataset.sport || "N/A";
        const gameTime = block.dataset.commencetime || "N/A";
        const phrase = block.dataset.phrase || "";
        const promo = block.dataset.promo || "";

        const unitVal = document.getElementById("unitDropdown")?.value || "[[UNIT]]";

        window.selectedHypePostTitle = `${unitVal} UNIT(s) - ${phrase} - ${sportFromInput} - STARTS @ ${gameTime}`;
        window.selectedHypeRow = { Promo: promo, Phrase: phrase, Sport: sportFromInput };
        window.selectedHypeNote = window.latestNote || "N/A";

        document.getElementById("hypePhraseStep").classList.add("hidden");

        generateFinalOutput(window.selectedHypeNote, window.selectedHypePostTitle);
      };
      block.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          block.click();
        }
      };
    });
  });
});
