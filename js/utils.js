// js/utils.js
(() => {
  // Utility functions such as reset button, clearing inputs, etc.
  // You can add reset button logic here if needed.

  window.resetApp = function() {
    // Reset all state and UI to initial
    window.location.reload();
  };

  // Example reset button creation if you want it
  // const resetBtn = document.createElement("button");
  // resetBtn.textContent = "Reset";
  // resetBtn.onclick = window.resetApp;
  // document.body.appendChild(resetBtn);
})();
