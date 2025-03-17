const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Home Page Route
app.get("/", (req, res) => {
  res.send("Welcome to the API server!"); // You can customize this message
});

const MAX_RETRIES = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );
      return res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn(
          `Rate limit exceeded. Retrying (${retries + 1}/${MAX_RETRIES})...`,
        );
        retries++;
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff
        await sleep(waitTime);
      } else {
        console.error(error);
        return res.status(500).send("Error communicating with OpenAI API");
      }
    }
  }

  return res.status(429).send("Rate limit exceeded. Please try again later.");
});

app.use(cors({ origin: "http://localhost:5500" }));
const PORT = process.env.PORT || 9090;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
