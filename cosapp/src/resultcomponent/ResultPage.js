import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import questions from "../questiondatas/questions";
import axios from "axios";

import { useEffect } from "react";

import "./resultpage.css";

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { responses } = location.state || {};
  const email = location.state?.email || localStorage.getItem("email");
  const username = localStorage.getItem("username");

  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});


  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) {
      // Redirect if no session exists
      navigate("/login", { replace: true });
    }
  }, [navigate]);
  const [groupedQuestions, setGroupedQuestions] = useState(
    questions.reduce((acc, question, index) => {
      const { category } = question;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        questionNumber: question.id,
        score: responses[index],
        additionalScore: 0,
      });
      return acc;
    }, {})
  );

  const [isSummarySubmitted, setIsSummarySubmitted] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");

  const categories = Object.keys(groupedQuestions);

  const handleSummarySubmit = async () => {
    if (selectedCount < 3) {
      alert("Please select exactly 3 questions before proceeding.");
      return;
    }

    const resultData = [];
    categories.forEach((category) => {
      groupedQuestions[category].forEach((question) => {
        const { score, additionalScore, questionNumber } = question;
        const grandTotal = score + additionalScore;

        resultData.push({
          email,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
          questionNumber,
          category,
          rating: score,
          additionalMarks: additionalScore,
          grandTotal,
        });
      });
    });

    try {
      await axios.post("/api/submit-responses", resultData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Update UI state on successful submission
      setIsSummarySubmitted(true);
      setSubmissionMessage("Submission Successful! You can now view results.");
    } catch (error) {
      console.error("Error submitting responses:", error);
    }
  };

  const handleViewResults = async () => {
    try {
      const response = await axios.get(
        `/api/download-pdf?email=${encodeURIComponent(
          email
        )}`,
        { responseType: "blob" }
      );

      const pdfBlob = response.data;
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
       // Navigate to LogoutPage
    navigate("/logout", { replace: true });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleCheckboxChange = (event, index) => {
    const isChecked = event.target.checked;
    const newSelectedCheckboxes = { ...selectedCheckboxes };

    if (isChecked && selectedCount < 3) {
      newSelectedCheckboxes[index] = true;
      setSelectedCount(selectedCount + 1);
    } else if (!isChecked) {
      newSelectedCheckboxes[index] = false;
      setSelectedCount(selectedCount - 1);
    }

    setSelectedCheckboxes(newSelectedCheckboxes);

    const updatedGroupedQuestions = { ...groupedQuestions };
    questions.forEach((question, qIndex) => {
      const categoryQuestions = updatedGroupedQuestions[question.category];
      const questionInGroup = categoryQuestions.find(
        (q) => q.questionNumber === question.id
      );

      if (questionInGroup) {
        questionInGroup.additionalScore = newSelectedCheckboxes[qIndex]
          ? 4
          : 0;
      }
    });

    setGroupedQuestions(updatedGroupedQuestions);
  };

  return (
    <div className="results-page">
      <h4>Career Inventory Scoring Sheet</h4>
      <div className="top-left-content">
      <p>
        Welcome, {username} ({email})!
      </p>
    </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Score</th>
            <th>Select (Any 3)</th>
          </tr>
        </thead>
        <tbody>
          {questions
            .map((question, index) => ({
              question,
              score: responses[index],
              index,
            }))
            .filter(({ score }) => score >= 4 && score <= 6)
            .sort((a, b) => b.score - a.score)
            .map(({ question, score, index }) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{question.text}</td>
                <td>{score}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedCheckboxes[index] || false}
                    onChange={(e) => handleCheckboxChange(e, index)}
                    disabled={!selectedCheckboxes[index] && selectedCount >= 3}
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="button-container" style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleSummarySubmit}
          style={{ marginTop: "20px", padding: "10px 20px" }}
          disabled={isSummarySubmitted}
        >
          {isSummarySubmitted ? "Submission Completed" : "View Summary"}
        </button>

        <button
          onClick={handleViewResults}
          style={{ marginTop: "20px", padding: "10px 20px" }}
          disabled={!isSummarySubmitted}
        >
          View Results
        </button>
      </div>

      {submissionMessage && (
        <p style={{ marginTop: "20px", color: "green" }}>{submissionMessage}</p>
      )}
    </div>
  );
};

export default ResultsPage;
