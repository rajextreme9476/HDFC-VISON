import { onRequest } from "firebase-functions/v2/https";
import cors from "cors"; // ✅ Default import
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger"; // ✅ Logger import

const corsHandler = cors({ origin: true });

export const proxyGeminiRequest = onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      logger.info("Received a request", { structuredData: true });

      const GEMINI_API_KEY = "AIzaSyC35nTY2y-ospXRdM_9bywBreQiIO1jF7w";
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status: ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      logger.error("Error processing request", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});
