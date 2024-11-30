import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import questions from "../questiondatas/questions";
import axios from "axios";  // Assuming you are using axios for making HTTP requests

import "./surveyform.css";

const SurveyForm = () => {
  const username = localStorage.getItem("username");
  console.log("Username Retrieved is :"+username)
  
  const email = localStorage.getItem("email");
  console.log("Email Retrieved is :"+email)
  
  const [responses, setResponses] = useState(Array(questions.length).fill(null));
  const [error, setError] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const initialTime = parseInt(localStorage.getItem("timeLeft"), 10) || 1200;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      setHasSubmitted(true);

      if (responses.some((response) => response === null)) {
        setError(true);
        return;
      }

      setError(false);

      const payload = {
        email,
        
        responses: questions.map((question, index) => ({
          questionId: question.id,
          rating: responses[index],
        })),
      };

      try {
        // Send the data to your existing backend endpoint
        await axios.post('/api/submit-survey', payload);

        alert('Survey submitted successfully!');
        localStorage.removeItem("timeLeft");
        navigate("/results", { state: { responses } });
      } catch (err) {
        console.error("Error submitting survey:", err);
        alert("An error occurred while submitting the survey. Please try again.");
      }
    },
    [responses,email, navigate]
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        localStorage.setItem("timeLeft", newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
      <span>
        <span style={{ color: "#3498db" }}>{minutes.toString().padStart(2, "0")}</span>
        <span style={{ color: "#6cf7b2" }}>:{secs.toString().padStart(2, "0")}</span>
      </span>
    );
  };

  const handleChange = useCallback(
    (index, value) => {
      const updatedResponses = [...responses];
      updatedResponses[index] = value ? parseInt(value, 10) : null;
      setResponses(updatedResponses);
    },
    [responses]
  );

  return (
    <div className="survey-form-page">
      <header className="header">
        <h4>Career Inventory Survey</h4>
        <div className="welcome-message">Welcome, {username || "Guest"}!</div>
      </header>

      <form onSubmit={handleSubmit} className="survey-form">
        <div className="questionnaire">
          <div className="questions-container">
            <table className="survey-table">
              <thead>
                <tr>
                  <th>Question #</th>
                  <th>Question</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => (
                  <tr key={question.id}>
                    <td>{question.id}</td>
                    <td>{question.text}</td>
                    <td>
                      <select
                        value={responses[index] || ""}
                        onChange={(e) => handleChange(index, e.target.value)}
                        aria-label={`Rating for question ${question.id}`}
                      >
                        <option value="" disabled>
                          Please Choose
                        </option>
                        {[1, 2, 3, 4, 5, 6].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit
        </button>

        {hasSubmitted && error && (
          <p className="error-message">Please provide response to all the Questions.</p>
        )}
      </form>
      <div className="timer">Time Remaining: {formatTime(timeLeft)}</div>
    </div>
  );
};

export default SurveyForm;
