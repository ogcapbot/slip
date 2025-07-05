const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { createCanvas, loadImage, registerFont } = require("canvas");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Optional: Register system font (skip if default fonts are enough)
// registerFont('/path/to/your/font.ttf', { family: 'Arial' });

exports.generateImage = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Read document ID from query param
      const docId = req.query.docId;
      if (!docId) {
        res.status(400).send("Missing docId param");
        return;
      }

      // Fetch Firestore document
      const docSnap = await db.collection("your-collection").doc(docId).get();
      if (!docSnap.exists) {
        res.status(404).send("Document not found");
        return;
      }
      const data = docSnap.data();

      // Load your template image (make sure it's publicly accessible)
      const templateUrl = "https://storage.googleapis.com/YOUR_BUCKET/template.png";
      const image = await loadImage(templateUrl);

      // Create canvas
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      // Draw template image
      ctx.drawImage(image, 0, 0);

      // Draw header text
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("Your Header Here", 50, 70);

      // Draw Firestore fields (example: name and status)
      ctx.font = "30px Arial";
      ctx.fillText(`Name: ${data.name || "N/A"}`, 50, 140);
      ctx.fillText(`Status: ${data.status || "N/A"}`, 50, 190);

      // Draw watermark text bottom-right
      const watermark = "My Watermark";
      ctx.font = "20px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      const textWidth = ctx.measureText(watermark).width;
      ctx.fillText(watermark, image.width - textWidth - 20, image.height - 30);

      // Convert canvas to PNG buffer
      const buffer = canvas.toBuffer("image/png");

      // Send CORS headers and image
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Content-Type", "image/png");
      res.send(buffer);

    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
});
