import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../api/api";
import attila from "../assets/attila.png";


export default function Home() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a PDF");
    try {
      await uploadResume(file);
      navigate("/jobs");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className="two-page">
      <h1 className="two-header">QuackTrack Job Finder</h1>

        <img src={attila} alt="Mascot" className="home-mascot"/>
    

      <p className="intro-text">Upload your resume to get matched with jobs.</p>

      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          type="file"
          accept="application/pdf"
          className="upload-input"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" className="details-button">
          Find Jobs
        </button>
      </form>
    </div>
  );
}
