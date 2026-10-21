import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJob } from "../api/api";
import { useNavigate } from "react-router-dom";


export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJob();
  }, []);

  const fetchJob = async () => {
    try {
      const res = await getJob(id);
      setJob(res.data);
    } catch (err) {
      console.error("Failed to load job:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
  if (!job) return <div style={{ padding: "2rem" }}>Job not found</div>;

  return (
    <div className="two-page">
      <div style={{ marginBottom: "1rem" }}>
        <button className="details-button" onClick={() => navigate("/jobs")}>
         ← Back to Listings
        </button>
    </div>

  
      <div className="job-item expanded">
        <div className="job-header">
          <img className="company-logo" src={job.company_logo} alt={job.company_name} />
          <h2>{job.company_name}</h2>
        </div>
  
        <h1 className="job-title">{job.title}</h1>
        <p><strong>Seniority:</strong> {job.seniority_level}</p>
        <p><strong>Work Model:</strong> {job.work_model}</p>
        <p><strong>Location:</strong> {job.locations?.join(", ") || "N/A"}</p>
        <p>
        <strong>Salary:</strong>{" "}
        {job.min_salary && job.max_salary
            ? `$${job.min_salary.toLocaleString()} - $${job.max_salary.toLocaleString()}`
            : job.min_salary
            ? `$${job.min_salary.toLocaleString()}+`
            : "Not listed"}
        </p>
        <p><strong>Skills:</strong></p>

        <div className="job-tags">
          {job.tags?.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
  
        <div className="job-description" dangerouslySetInnerHTML={{ __html: job.description }} />
  
        <button className="details-button" onClick={() => navigate(`/interview/${id}`)}>
          💬 Practice Interview
        </button>
      </div>
    </div>
  );
  
}
