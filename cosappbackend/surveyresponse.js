const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql2");

// Middleware
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "cosappdb",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database");
});

// API to handle survey responses
app.post("/api/survey-responses", (req, res) => {
  const { userEmail, responses } = req.body;

  if (!userEmail || !responses) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const query = "INSERT INTO survey_responses (user_email, question_id, rating) VALUES ?";
  const values = responses.map(({ questionId, rating }) => [userEmail, questionId, rating]);

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error inserting responses:", err);
      return res.status(500).json({ message   : "Failed to store responses" });
    }

    res.status(200).json({ message: "Survey responses stored successfully" });
  });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
