// viewImage.js
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { app } from "./firebaseInit.js"; // assuming firebaseInit exports initialized app

const db = getFirestore(app);

function formatDate(date) {
  // Format date as YYYY-MM-DD to match dateEastern format
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createModal() {
  // Modal container and overlay
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

  // Modal content box
  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    maxWidth: "90vw",
    maxHeight: "90vh",
  });

  // Image element (large)
  const modalImage = document.createElement("img");
  modalImage.style.width = "300px";
  modalImage.style.maxWidth = "100%";
  modalImage.style.borderRadius = "6px";

  // Buttons container
  const buttonsDiv = document.createElement("div");
  Object.assign(buttonsDiv.style, {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  });

  // OK Button
  const okButton = document.createElement("button");
  okButton.textContent = "OK";
  okButton.style.padding = "8px 16px";
  okButton.style.fontSize = "1rem";
  okButton.style.cursor = "pointer";

  // Cancel Button
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

  // Close modal handler
  function closeModal() {
    modalOverlay.style.display = "none";
    modalImage.src = "";
  }

  okButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal(); // click outside modal content closes modal
  });

  return {
    modalOverlay,
    modalImage,
    show: (src) => {
      modalImage.src = src;
      modalOverlay.style.display = "flex";
    },
  };
}

function createImageGrid(sportName, images, modal) {
  // Container for one sport section
  const section = document.createElement("section");
  section.style.marginBottom = "20px";

  // Title for sport
  const title = document.createElement("h4");
  title.textContent = sportName;
  title.style.fontFamily = "'Oswald', sans-serif";
  title.style.marginBottom = "8px";
  section.appendChild(title);

  // Grid container for images
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

    // On click show modal with larger image
    imgBtn.addEventListener("click", () => {
      modal.show(strThumb);
    });

    grid.appendChild(imgBtn);
  });

  section.appendChild(grid);
  return section;
}

async function loadImages() {
  const container = document.createElement("div");
  container.id = "imagesContainer";
  Object.assign(container.style, {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "0 5px",
  });
  document.body.insertBefore(container, document.querySelector("footer"));

  const modal = createModal();

  // Get today date string
  const todayStr = formatDate(new Date());

  // Query Firestore
  const collRef = collection(db, "gameEvents_1");
  const q = query(collRef, where("dateEastern", "==", todayStr));
  const querySnapshot = await getDocs(q);

  // Collect and group by sport
  const docs = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.strSport && data.strThumb) {
      docs.push(data);
    }
  });

  // Sort by strSport then strThumb
  docs.sort((a, b) => {
    if (a.strSport.toLowerCase() < b.strSport.toLowerCase()) return -1;
    if (a.strSport.toLowerCase() > b.strSport.toLowerCase()) return 1;
    // Same sport, sort by strThumb
    if (a.strThumb.toLowerCase() < b.strThumb.toLowerCase()) return -1;
    if (a.strThumb.toLowerCase() > b.strThumb.toLowerCase()) return 1;
    return 0;
  });

  // Group by strSport
  const grouped = docs.reduce((acc, curr) => {
    if (!acc[curr.strSport]) acc[curr.strSport] = [];
    acc[curr.strSport].push(curr);
    return acc;
  }, {});

  // Create and append sections by sport
  for (const sport in grouped) {
    const section = createImageGrid(sport, grouped[sport], modal);
    container.appendChild(section);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadImages().catch((e) => {
    console.error("Error loading images:", e);
  });
});
