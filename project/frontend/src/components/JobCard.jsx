import React from "react";
import { useNavigate } from "react-router-dom";

export default function JobCard({ job, index }) {
  const navigate = useNavigate();

  return (
    <div className="job-item" onClick={() => navigate(`/job/${index}`)}>
      <div className="job-header">
        <img className="company-logo" src={job.company_logo} alt={job.company_name} />
        <h2>{job.company_name}</h2>
      </div>
      <p className="job-title">{job.title}</p>
      <p>
        <strong>Salary:</strong>{" "}
        {job.min_salary && job.max_salary
            ? `$${job.min_salary.toLocaleString()} - $${job.max_salary.toLocaleString()}`
            : job.min_salary
            ? `$${job.min_salary.toLocaleString()}+`
            : "Not listed"}
        </p>
      <p className="job-description">
        {job.description?.replace(/<[^>]+>/g, "").slice(0, 200) || "No description available..."}
      </p>
      <div className="job-tags">
        {job.tags?.slice(0, 5).map((tag, i) => (
          <span className="tag" key={i}>{tag}</span>
        ))}
      </div>
      <button className="details-button">View Details</button>
    </div>
  );
}
