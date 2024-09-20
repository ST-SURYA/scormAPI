const express = require("express");
const multer = require("multer");
const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = 3000;

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
    credentials: true, // Fix typo from `Credential` to `credentials`
  })
);

// Setup storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/scorm";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Serve static files for SCORM content
app.use("/scorm-content", express.static(path.join(__dirname, "public/scorm")));

// Route for uploading SCORM files
app.post("/upload-scorm", upload.single("scorm"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Extract ZIP file
  const filePath = req.file.path;
  const zip = new AdmZip(filePath);
  const extractPath = `./public/scorm/${path.basename(filePath, ".zip")}`;

  // Ensure extraction directory exists
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  // Extract the zip file to the extractPath
  zip.extractAllTo(extractPath, true);

  // Remove the zip file after extraction
  fs.unlinkSync(filePath);

  return res.json({
    message: "SCORM package uploaded and extracted successfully",
    url: `/scorm-content/${path.basename(filePath, ".zip")}/index.html`,
  });
});

// Route for viewing SCORM packages
app.get("/scorm/view/:scormId", (req, res) => {
  const scormId = req.params.scormId;
  const scormPath = path.join(__dirname, "public/scorm", scormId, "index.html");

  // Check if the SCORM content exists
  if (fs.existsSync(scormPath)) {
    res.sendFile(scormPath);
  } else {
    res.status(404).send("SCORM package not found");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
