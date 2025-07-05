const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { createCanvas, loadImage } = require("canvas");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.generateImage = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const docId = req.query.docId;
      if (!docId) {
        res.status(400).send("Missing docId param");
        return;
      }

      // Fetch Firestore document from 'users' collection
      const docSnap = await db.collection("users").doc(docId).get();
      if (!docSnap.exists) {
        res.status(404).send("Document not found");
        return;
      }
      const data = docSnap.data();

      // Your template image URL
      const templateUrl = "https://capper.ogcapperbets.com/admin/images/blankWatermark.png";

      // Load the template image
      const image = await loadImage(templateUrl);

      // Create canvas
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      // Draw the template image on canvas
      ctx.drawImage(image, 0, 0);

      // Draw header text
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("User Profile", 50, 70);

      // Draw Firestore fields (name and email as example)
      ctx.font = "30px Arial";
      ctx.fillText(`Name: ${data.name || "N/A"}`, 50, 140);
      ctx.fillText(`Email: ${data.email || "N/A"}`, 50, 190);

      // Draw watermark bottom right
      const watermark = "© MyCompany";
      ctx.font = "20px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      const textWidth = ctx.measureText(watermark).width;
      ctx.fillText(watermark, image.width - textWidth - 20, image.height - 30);

      // Convert canvas to PNG buffer
      const buffer = canvas.toBuffer("image/png");

      // Send with CORS headers
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Content-Type", "image/png");
      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
});
