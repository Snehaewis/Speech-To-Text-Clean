require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ws = require("ws");
const speech = require("@google-cloud/speech");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws,
      enabled: false,
    },
  }
);

// Google Speech Client
const speechClient = new speech.SpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

// Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// Upload Route
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    console.log("File received:", req.file.originalname);

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${req.file.originalname}`;

    const { data: storageData, error: storageError } =
      await supabase.storage
        .from("audio-files")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

    if (storageError) {
      return res.status(500).json({
        error: storageError.message,
      });
    }

    // Google Speech-to-Text
    const audioBytes = req.file.buffer.toString("base64");

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        languageCode: "en-US",
      },
    };
    console.log("Google request config:", request.config);
    const [response] = await speechClient.recognize(request);

    const transcript = response.results
      .map((result) => result.alternatives[0].transcript)
      .join(" ");

    // Save transcript
    const { data: dbData, error: dbError } = await supabase
      .from("transcriptions")
      .insert([
        {
          filename: req.file.originalname,
          transcription: transcript,
        },
      ])
      .select();

    if (dbError) {
      return res.status(500).json({
        error: dbError.message,
      });
    }

    res.json({
      message: "File uploaded and transcribed successfully",
      transcription: transcript,
      saved: dbData,
      storage: storageData,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});