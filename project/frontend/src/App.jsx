console.log("App component is rendering");

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import JobListings from "./pages/JobListings";
import JobDetail from "./pages/JobDetail";
import InterviewBot from "./pages/InterviewBot";
import InterviewResults from "./pages/InterviewResults";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/interview/:id" element={<InterviewBot />} />
        <Route path="/interview-results" element={<InterviewResults />} />
      </Routes>
    </Router>
  );
}
