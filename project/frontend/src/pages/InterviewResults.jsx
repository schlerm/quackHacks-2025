import React, { useEffect, useState } from "react";

export default function InterviewResults() {
  const [results, setResults] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/interview_results.json")
      .then((res) => res.json())
      .then(async (data) => {
        setResults(data);
        const scores = data.map((q) => q.score);
        const total = scores.reduce((sum, s) => sum + s, 0);
        const avg = (total / scores.length).toFixed(1);
        setAverageScore(avg);

        // Generate suggestions from backend
        const res = await fetch("http://127.0.0.1:5000/generate_suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results: data }),
        });
        const suggestionText = await res.json();
        setSuggestions(suggestionText.suggestions || []);
      })
      .catch(() => alert("Could not load interview results."));
  }, []);

  return (
    <div className="two-page">
      <h1 className="two-header">📝 Interview Results</h1>
  
      {averageScore && (
        <p className="score-line">Total Score: {averageScore} / 10</p>
      )}
  
      {suggestions.length > 0 && (
        <div className="suggestions-box">
          <h3>🧠 Suggestions for Improvement</h3>
          <ul>
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
  
      {results.map((item, i) => (
        <div key={i} className="job-item expanded">
          <h3>Q{i + 1}: {item.question}</h3>
          <p><strong>Your Answer:</strong> {item.answer}</p>
          <p><strong>Score:</strong> {item.score}/10</p>
          <p><strong>Feedback:</strong> {item.feedback}</p>
        </div>
      ))}
    </div>
  );
  
}
