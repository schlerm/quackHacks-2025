import React from "react";
import { useEffect, useState } from "react";
import { getMatches } from "../api/api";
import JobCard from "../components/JobCard";

export default function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getMatches();
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/refine_tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: refinePrompt,
          resume_path: "uploads/example.pdf" // 🔧 replace with dynamic path later
        })
      });
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
      alert("Refinement failed");
    }
  };

  return (
    <div className="two-page">
      <h1 className="two-header">Job Listings</h1>
  
      <div className="refine-search">
        <input
          type="text"
          placeholder="Refine your results..."
          value={refinePrompt}
          onChange={(e) => setRefinePrompt(e.target.value)}
        />
        <button onClick={handleRefine}>Refine</button>
      </div>
  
      <div className="box-content">
        {jobs.map((job, i) => (
          <JobCard key={i} job={job} index={i} />
        ))}
      </div>
    </div>
  );
  
}
