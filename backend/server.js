require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ws = require("ws");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- Supabase Setup ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    realtime: {
      transport: ws,
      enabled: false, // safer for Node 18
    },
  }
);

// ---------- File Upload Setup ----------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// Upload audio (basic test route)
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", req.file.originalname);

    // Example: upload file to Supabase Storage (optional)
    const fileName = `${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from("audio-files")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "File uploaded successfully",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- Start Server ----------
app.listen(5000, () => {
  console.log("Server running on port 5000");
});