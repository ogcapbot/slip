function generateFinalOutput(notes, newTitle) {
  // ... all your existing code above remains unchanged ...

  const box = document.getElementById("confirmOutput");

  // Hide container initially
  box.classList.add("hidden");
  box.innerHTML = "";

  // Find or create textBoxesContainer (which contains the two text inputs)
  let textBoxesContainer = document.getElementById("textBoxesContainer");
  if (!textBoxesContainer) {
    textBoxesContainer = document.createElement("div");
    textBoxesContainer.id = "textBoxesContainer";
    textBoxesContainer.style.marginBottom = "10px";
    textBoxesContainer.style.maxWidth = "400px";
    box.parentElement.insertBefore(textBoxesContainer, box);

    // Post Title label + input
    const label1 = document.createElement("label");
    label1.htmlFor = "textBox1";
    label1.textContent = "Post Title";
    label1.className = "copyTextboxLabel";
    textBoxesContainer.appendChild(label1);

    const textBox1 = document.createElement("input");
    textBox1.id = "textBox1";
    textBox1.readOnly = true;
    textBox1.type = "text";
    textBox1.style.cssText = "width:100%; height:28px; margin-bottom:8px; font-size:12px; font-family:'Oswald', sans-serif; padding:6px 8px; border-radius:6px; border:1px solid #ccc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;";
    textBox1.title = "Click to copy text";
    textBoxesContainer.appendChild(textBox1);

    // Hype Phrase Description label + input
    const label2 = document.createElement("label");
    label2.htmlFor = "textBox2";
    label2.textContent = "Hype Phrase Description";
    label2.className = "copyTextboxLabel";
    textBoxesContainer.appendChild(label2);

    const textBox2 = document.createElement("input");
    textBox2.id = "textBox2";
    textBox2.readOnly = true;
    textBox2.type = "text";
    textBox2.style.cssText = "width:100%; height:28px; font-size:12px; font-family:'Oswald', sans-serif; padding:6px 8px; border-radius:6px; border:1px solid #ccc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;";
    textBox2.title = "Click to copy text";
    textBoxesContainer.appendChild(textBox2);

    // Copy-to-clipboard for inputs
    [textBox1, textBox2].forEach(textBox => {
      textBox.addEventListener("click", () => {
        navigator.clipboard.writeText(textBox.value).then(() => {
          alert("Copied to clipboard!");
        }).catch(() => {
          alert("Failed to copy.");
        });
      });
    });
  }

  // Set textbox values
  document.getElementById("textBox1").value = window.selectedHypePostTitle || "No Hype Phrase Selected";
  document.getElementById("textBox2").value = (window.selectedHypeRow && window.selectedHypeRow.Promo) || "No Description Available";

  // Create loader below textBoxesContainer, above iframe container
  let loader = document.getElementById("imageLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "imageLoader";
    loader.style.textAlign = "center";
    loader.style.marginBottom = "10px";
    loader.style.fontFamily = "'Oswald', sans-serif";
    loader.style.fontSize = "14px";
    loader.innerHTML = `
      <div class="loader" style="
        border: 6px solid #f3f3f3;
        border-top: 6px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 8px auto;">
      </div>
      <div>Creating Images</div>
    `;
    textBoxesContainer.insertAdjacentElement('afterend', loader);
  }
  loader.style.display = "block";

  // Add spinner CSS if not present
  if (!document.getElementById("loader-style")) {
    const styleEl = document.createElement("style");
    styleEl.id = "loader-style";
    styleEl.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .loader {
        display: inline-block;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Prepare encodedPayload (unchanged, your existing logic)
  const encodedPayload = encodeURIComponent(JSON.stringify({
    "FULL_TEAM_ENTERED": matchedTeam,
    "FULL_BET_TYPE": wager,
    "FULL_WAGER_OUTPUT": `${unitInput} Unit(s)`,
    "PICK_DESC": pickDescValue,
    "NOTES": notes,
    "FULL_LEAGUE_NAME": selectedMatch["Sport Name"],
    "FULL_SPORT_NAME": selectedMatch["League (Group)"],
    "HOME_TEAM_FULL_NAME": selectedMatch["Home Team"],
    "AWAY_TEAM_FULL_NAME": selectedMatch["Away Team"],
    "DATE and TIME OF GAME START": formattedTime,
    "TITLE": window.overrideTitle || "[[TITLE]]",
    "PICKID": pickId,
    "CAPPERS NAME": capperName,
    "USER_INPUT_VALUE": allInputsRaw,
    "24HR_LONG_DATE_SECONDS": estString
  }));

  // Create iframes hidden initially
  const createIframe = (slideNum, visible) => {
    const iframe = document.createElement("iframe");
    iframe.className = "slipFrame";
    iframe.dataset.slide = slideNum;
    iframe.style.display = visible ? "block" : "none";
    iframe.src = `${BASE_URL}?json=${encodedPayload}&slideNum=${slideNum}`;
    iframe.style.width = "100%";
    iframe.style.maxWidth = "400px";
    iframe.style.border = "none";
    iframe.style.pointerEvents = "auto";
    iframe.style.height = "100%";
    iframe.style.minHeight = "400px";
    return iframe;
  };

  const iframe1 = createIframe(1, false);
  const iframe2 = createIframe(2, false);

  // Track loaded iframes
  let loadedCount = 0;
  const onIframeLoad = () => {
    loadedCount++;
    if (loadedCount === 2) {
      loader.style.display = "none";
      box.classList.remove("hidden");
      toggleBtn.style.display = "block";
      iframe1.style.display = "block";
    }
  };

  iframe1.onload = onIframeLoad;
  iframe2.onload = onIframeLoad;

  box.innerHTML = ""; // clear before appending iframes
  box.appendChild(iframe1);
  box.appendChild(iframe2);

  // Create toggle button, hidden initially
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "toggleImageBtn";
  toggleBtn.textContent = "Switch to Paid Image";
  toggleBtn.style.marginTop = "10px";
  toggleBtn.style.width = "100%";
  toggleBtn.style.maxWidth = "400px";
  toggleBtn.style.padding = "12px";
  toggleBtn.style.fontSize = "16px";
  toggleBtn.style.backgroundColor = "#2a9fd6";
  toggleBtn.style.color = "white";
  toggleBtn.style.border = "none";
  toggleBtn.style.borderRadius = "6px";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.display = "none";

  toggleBtn.onclick = () => {
    const frames = box.querySelectorAll(".slipFrame");
    let visibleIndex = -1;
    frames.forEach((frame, i) => {
      if (frame.style.display !== "none") visibleIndex = i;
      frame.style.display = "none";
      frame.onclick = null;
      frame.style.cursor = "default";
    });
    const nextIndex = (visibleIndex + 1) % frames.length;
    const nextFrame = frames[nextIndex];
    nextFrame.style.display = "block";

    nextFrame.style.cursor = "default";
    nextFrame.onclick = null;

    toggleBtn.textContent = nextIndex === 0 ? "Switch to Paid Image" : "Switch to Regular Image";
  };

  box.parentElement.insertBefore(toggleBtn, box);

  // Adjust container height after images load
  setTimeout(() => {
    box.style.overflow = "visible";
    box.style.height = box.scrollHeight + "px";
  }, 0);
}
