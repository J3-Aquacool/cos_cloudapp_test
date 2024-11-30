
require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
//const mysql = require('mysql');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const cors = require('cors'); 

const app = express();

const path = require('path');

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../cosapp/build')));

// Fallback route to serve React's `index.html` for unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../cosapp/build', 'index.html'));
});

app.use(cors({
  origin: '*',  // Allow requests only from the frontend on port 3000
  methods: 'GET,POST,PUT,DELETE',  // Allowed HTTP methods
  credentials: true                // Allow credentials like cookies if needed
}));
app.use(bodyParser.json());

// Configure MySQL database connection
const db = mysql.createConnection({
  // host: '127.0.0.1',  // Replace with your MySQL host
  // user: 'root',  // Replace with your MySQL username
  // password: 'admin',  // Replace with your MySQL password
  // database: 'cosappdb' , // Replace with your MySQL database name
  // port: 3306
host: process.env.DB_HOST || '127.0.0.1',  // Replace with your MySQL host
  user: process.env.DB_USER || 'root',      // Replace with your MySQL username
  password: process.env.DB_PASS || 'admin1234', // Replace with your MySQL password
  database: process.env.DB_NAME || 'cosappdb',
  port: process.env.DB_PORT || 3306         // Default MySQL port

});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to the database');
  }
});

// Login route
app.post('/auth/login', (req, res) => {
 // const { username, password } = req.body;
  const { email } = req.body;
  // Query to check if the username and password are correct
 // const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
 const query = 'SELECT * FROM users_new WHERE email= ?';
   
 
 //db.query(query, [username, password], (err, results) => {
   
  db.query(query, [email], (err, results) => {
   
  if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      // Successful login
      const user = results[0];
      if (user.has_taken_survey) {
        return res.json({ success: false, message: 'You have already taken the survey.' });
      }

      console.log("login success")

     console.log({ success: true, username: results[0].username ,email:results[0].email});
     // res.json({ success: true, message: 'Login successful' });
     //res.json({ success: true, username: results[0].username,email:results[0].email });
    
     res.json({ success: true, username:user.username,email:user.email });
    
    } else {
      console.log("login failed")
      // Invalid credentials
      res.json({ success: false, message: 'Invalid email or password' });
    }
  });
});



// code for surveyform-response data submision end point
app.post("/api/submit-survey", (req, res) => {
  console.log("Request received at /api/submit-survey:", req.body);
 // const { user_email,userEmail, responses } = req.body;
 const { email, responses } = req.body;
  
 
 //const email = myemail;
  // Input validation
  if (!email || !responses) {
    console.error("Invalid data received:", req.body);
    return res.status(400).json({ message: "Invalid data received." });
  }

  // Create the insert query
  const query = `
  INSERT INTO survey_responses (user_email, responses)
  VALUES (?, ?)
  ON DUPLICATE KEY UPDATE responses = VALUES(responses), submission_date = CURRENT_TIMESTAMP
`;

db.execute(query, [email, JSON.stringify(responses)], (err, result) => {
  if (err) {
    console.error("Database error:", err);
    //console.error(err);
    return res.status(500).json({ error: "Failed to save survey responses" });
  }


// Update `has_taken_survey` to TRUE
const updateQuery = 'UPDATE users_new SET has_taken_survey = TRUE WHERE email = ?';
db.execute(updateQuery, [email], (updateErr) => {
  if (updateErr) {
    console.error('Failed to update survey status:', updateErr);
    return res.status(500).json({ error: 'Failed to update survey status' });
  }

  res.status(200).json({ message: 'Survey responses saved successfully' });
});


 



});
});






//******************************** */


// Endpoint to save survey responses
// Endpoint to save survey responses
app.post("/api/submit-responses", async (req, res) => {
  console.log("Request received at /api/submit-responses:", req.body);

  const requestData = Array.isArray(req.body) ? req.body : [req.body];
  
  // Function to format the timestamp
  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace("T", " ");
  };

  // Validate the array format (checking if necessary fields exist)
  if (requestData.some(item => !item.timestamp || !item.questionNumber)) {
    return res.status(400).json({ message: "Invalid data format. Missing required fields." });
  }

  const myquery = `
    INSERT INTO career_inventory_responses 
    (email, timestamp, question_number, category, rating, additional_marks, grand_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    // Use Promise.all to process all queries and await their completion
    const promises = requestData.map((result) => {
      const {
        email,
        timestamp,
        questionNumber,
        category,
        rating,
        additionalMarks,
        grandTotal,
      } = result;

      // Format timestamp before inserting
      const formattedTimestamp = formatTimestamp(timestamp);

      return new Promise((resolve, reject) => {
        db.execute(
          myquery,
          [
            email,
            formattedTimestamp,
            questionNumber,
            category,
            rating,
            additionalMarks,
            grandTotal,
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });



    // Wait for all insertions to complete
    await Promise.all(promises);
   // Send success response after processing all results
    res.status(200).json({ message: "Results saved successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to save survey responses" });
  }
});





// Endpoint to download PDF of survey responses
app.get('/api/download-pdf', (req, res) => {
  console.log("hello iam here");

  console.log("Received request to download PDF for email:", req.query.email);
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Step 1: Query to fetch the responses and calculate total score and grand total
  const query = `
    SELECT 
      r.email,
      r.category,
      r.question_number,
      r.rating,
      SUM(r.rating) OVER (PARTITION BY r.email, r.category) AS total_score,
      (SUM(r.rating) OVER (PARTITION BY r.email, r.category) + 4) AS grand_total
    FROM career_inventory_responses r
    WHERE r.email = ? AND r.additional_marks = 4
    ORDER BY r.category, r.question_number
  `;
  
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Failed to retrieve responses' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No responses found for this email' });
    }

    // Step 2: Insert aggregated results into report_data table
    const insertQuery = `
     -- Check if the record already exists before inserting
INSERT INTO report_data (email, category, question_number, rating, total_score, grand_total)
SELECT 
  email, 
  category, 
  question_number, 
  rating, 
  total_score, 
  grand_total
FROM 
  (SELECT 
    r.email,
    r.category,
    r.question_number,
    r.rating,
    SUM(r.rating) OVER (PARTITION BY r.email, r.category) AS total_score,
    (SUM(r.rating) OVER (PARTITION BY r.email, r.category) + 4) AS grand_total
  FROM career_inventory_responses r
  WHERE r.email = ? AND r.additional_marks = 4
  ORDER BY r.category, r.question_number) AS calculated_results
ON DUPLICATE KEY UPDATE
  rating = VALUES(rating), 
  total_score = VALUES(total_score),
  grand_total = VALUES(grand_total);

    `;

    db.query(insertQuery, [email], (insertErr, insertResults) => {
      if (insertErr) {
        console.error('Error inserting into report table:', insertErr);
        return res.status(500).json({ error: 'Failed to insert report data' });
      }
      console.log('Report data inserted successfully');
    });

    // Step 3: Generate PDF report
    const pdfDoc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=career_inventory_${email}.pdf`);

    pdfDoc.pipe(res);

    // Add Logo in the Right Top Corner
    const logoPath = './logo/unextlogo.png'; // Replace with actual logo path
    pdfDoc.image(logoPath, 450, 30, { width: 100 });

    // Add Title and Line
    pdfDoc.fontSize(18).text('Career Inventory Results', { align: 'center' });
    pdfDoc.moveTo(50, 100).lineTo(550, 100).stroke(); // Underline the title

    // Add Email ID below the Title
    const emailYPosition = 110; // Positioning below the title and underline
    pdfDoc.fontSize(12).text(`Email: ${email}`, 50, emailYPosition);

    // Set the starting point for the table
    const tableTop = 140;
 
    const columnSpacing = 150; // Adjust space between columns

    // Table Headers
    pdfDoc.fontSize(12).text('Category', 50, tableTop);
    pdfDoc.text('Total Score(Ratings)', 50 + columnSpacing, tableTop);
    pdfDoc.text('Grand Total', 50 + 2 * columnSpacing, tableTop);

    // Table Rows: Loop through data and display each row
    const rowHeight = 35;
    let lastCategory = '';
    let totalScore = 0;
    let grandTotal = 0;
    results.forEach((row, index) => {
      const yPosition = tableTop + rowHeight * (index + 1);
      
      if (lastCategory !== row.category) {
        // Add total score and grand total only once per category
        if (lastCategory !== '') {
          // pdfDoc.moveTo(50, yPosition)
          // .lineTo(350, yPosition)
          // .stroke();
        }
        totalScore = row.total_score;  // Reset total score and grand total for new category
        grandTotal = row.grand_total;
        lastCategory = row.category;

        // Add category name
        pdfDoc.text(row.category, 50, yPosition);
        pdfDoc.text(row.total_score, 50 + columnSpacing, yPosition);
        pdfDoc.text(row.grand_total, 50 + 2 * columnSpacing, yPosition);
      } else {
        // Continue for the same category
        pdfDoc.text(row.question_number, 50, yPosition);
        pdfDoc.text(row.rating, 50 + columnSpacing, yPosition);
      }
    });
// Add the additional content after the table
// Starting position for the additional content




// Add the additional content after the table
const additionalContentStartY = 300; // Adjust starting position for additional content
const marginLeft = 10; // Set a small margin to avoid cutting off at the extreme edge

// Add the additional content after the table
pdfDoc.moveDown().fontSize(10).text('TF - Technical Function', marginLeft, undefined, { underline: true, align: 'left' });
pdfDoc.fontSize(12).text('1. Enjoys: Building competence in technical or functional areas', marginLeft, undefined, { align: 'left' });
pdfDoc.fontSize(12).text('2. Wants to be: Challenged in technical areas, Recognized as a functional or technical expert.', marginLeft, undefined, { align: 'left' });
pdfDoc.fontSize(12).text('3. Does not want to be: A manager for the sake of it. May not mind managing other technical colleagues.', marginLeft, undefined, { align: 'left' });

pdfDoc.moveDown().fontSize(10).text('GM - General Managerial Competence', marginLeft, undefined, { underline: true, align: 'left' });
pdfDoc.fontSize(12).text('1. Enjoys: Working in roles that need generic general management competences', marginLeft, undefined, { align: 'left' });
pdfDoc.fontSize(12).text('2. Wants to be: A generalist responsible for working with various functions and departments in the organization, Responsible for overall results of the organization.', marginLeft, undefined, { align: 'left' });
pdfDoc.fontSize(12).text('3. Does not want to be: Seen as a specialist in one area. Though may use the functional competence as a steppingstone.', marginLeft, undefined, { align: 'left' });

pdfDoc.moveDown().fontSize(10).text('AU – Autonomy/Independence', marginLeft, undefined, { underline: true, align: 'left' });
pdfDoc.fontSize(12).text('1. Enjoys: Defining own work, making decisions, and taking responsibility for it.', marginLeft, undefined, { align: 'left' });
pdfDoc.fontSize(12).text('2. Wants to be: In a role that allows autonomy and independence.', marginLeft, undefined, { align: 'left' });



    // Finalize the PDF document
    pdfDoc.end();
  });
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(3001, () => {
  console.log('CosAppDB Server running on port 3001');
});
