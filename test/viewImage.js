// viewImage.js
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { app } from "./firebaseInit.js"; // fixed import path

const db = getFirestore(app);

function getEasternDateStringMMDDYYYY() {
  const now = new Date();
  const easternDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // e.g. "07/18/2025"
  return easternDate;
}

function createModal() {
  console.log("[Modal] Creating modal...");
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "imageModalOverlay";
  Object.assign(modalOverlay.style, {
    position: "fixed",
    top: "0", left: "0", right: "0", bottom: "0",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "none",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000",
  });

  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    maxWidth: "90vw",
    maxHeight: "90vh",
  });

  const modalImage = document.createElement("img");
  modalImage.style.width = "300px";
  modalImage.style.maxWidth = "100%";
  modalImage.style.borderRadius = "6px";

  const buttonsDiv = document.createElement("div");
  Object.assign(buttonsDiv.style, {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  });

  const okButton = document.createElement("button");
  okButton.textContent = "OK";
  okButton.style.padding = "8px 16px";
  okButton.style.fontSize = "1rem";
  okButton.style.cursor = "pointer";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.style.padding = "8px 16px";
  cancelButton.style.fontSize = "1rem";
  cancelButton.style.cursor = "pointer";

  buttonsDiv.appendChild(okButton);
  buttonsDiv.appendChild(cancelButton);
  modalContent.appendChild(modalImage);
  modalContent.appendChild(buttonsDiv);
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  function closeModal() {
    console.log("[Modal] Closing modal.");
    modalOverlay.style.display = "none";
    modalImage.src = "";
  }

  okButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      console.log("[Modal] Overlay clicked - closing modal.");
      closeModal();
    }
  });

  return {
    modalOverlay,
    modalImage,
    show: (src) => {
      console.log("[Modal] Showing image:", src);
      modalImage.src = src;
      modalOverlay.style.display = "flex";
    },
  };
}

function createImageGrid(sportName, images, modal) {
  console.log(`[UI] Creating image grid for sport: "${sportName}" with ${images.length} images.`);
  const section = document.createElement("section");
  section.style.marginBottom = "20px";

  const title = document.createElement("h4");
  title.textContent = sportName;
  title.style.fontFamily = "'Oswald', sans-serif";
  title.style.marginBottom = "8px";
  section.appendChild(title);

  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
    maxWidth: "400px",
  });

  images.forEach(({ strThumb }) => {
    const imgBtn = document.createElement("img");
    imgBtn.src = strThumb;
    imgBtn.alt = sportName;
    imgBtn.width = 125;
    imgBtn.height = "auto";
    imgBtn.style.cursor = "pointer";
    imgBtn.style.borderRadius = "4px";
    imgBtn.style.objectFit = "cover";
    imgBtn.style.width = "125px";

    imgBtn.addEventListener("click", () => {
      modal.show(strThumb);
    });

    grid.appendChild(imgBtn);
  });

  section.appendChild(grid);
  return section;
}

async function loadImages() {
  console.log("[Load] Starting to load images...");

  const container = document.createElement("div");
  container.id = "imagesContainer";
  Object.assign(container.style, {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "0 5px",
  });
  document.body.insertBefore(container, document.querySelector("footer"));

  const modal = createModal();

  const todayStr = getEasternDateStringMMDDYYYY();
  console.log("[Load] Eastern Time today's date (MM/DD/YYYY):", todayStr);

  try {
    const collRef = collection(db, "gameEvents_1");
    const q = query(collRef, where("dateEastern", "==", todayStr));
    const querySnapshot = await getDocs(q);

    console.log("[Load] Documents found:", querySnapshot.size);

    if (querySnapshot.empty) {
      console.warn("[Load] No documents found for today.");
      const noDataMsg = document.createElement("p");
      noDataMsg.textContent = "No games found for today.";
      container.appendChild(noDataMsg);
      return;
    }

    const docs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.strSport && data.strThumb) {
        docs.push(data);
      } else {
        console.warn("[Load] Skipping doc missing strSport or strThumb:", doc.id);
      }
    });

    console.log("[Load] Filtered documents with strSport and strThumb:", docs.length);

    docs.sort((a, b) => {
      const sportA = a.strSport.toLowerCase();
      const sportB = b.strSport.toLowerCase();
      if (sportA < sportB) return -1;
      if (sportA > sportB) return 1;
      const thumbA = a.strThumb.toLowerCase();
      const thumbB = b.strThumb.toLowerCase();
      if (thumbA < thumbB) return -1;
      if (thumbA > thumbB) return 1;
      return 0;
    });

    console.log("[Load] Sorted documents");

    const grouped = docs.reduce((acc, curr) => {
      if (!acc[curr.strSport]) acc[curr.strSport] = [];
      acc[curr.strSport].push(curr);
      return acc;
    }, {});

    console.log("[Load] Grouped by sport:", Object.keys(grouped));

    for (const sport in grouped) {
      const section = createImageGrid(sport, grouped[sport], modal);
      container.appendChild(section);
    }
  } catch (error) {
    console.error("[Load] Error loading images:", error);
    const errorMsg = document.createElement("p");
    errorMsg.style.color = "red";
    errorMsg.textContent = `Error loading images: ${error.message}`;
    container.appendChild(errorMsg);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadImages();
});
