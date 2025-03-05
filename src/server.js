const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = "AIzaSyC35nTY2y-ospXRdM_9bywBreQiIO1jF7w";

// Proxy endpoint to call Gemini API
app.post("/api/generate-brd", async (req, res) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: req.body.prompt }] }],
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to fetch Gemini API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
