require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function check() {
  try {
    const list = await groq.models.list();
    console.log("AVAILABLE GROQ MODELS FOR YOUR KEY:");
    list.data.forEach(m => console.log("- " + m.id));
  } catch (e) {
    console.error("Key Error:", e.message);
  }
}
check();