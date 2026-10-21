import axios from "axios";

const API_BASE = "http://127.0.0.1:5000";

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${API_BASE}/upload_resume`, formData);
};

export const getMatches = () => axios.get(`${API_BASE}/get_matches`);

export const refineTags = (resumePath, prompt) =>
  axios.post(`${API_BASE}/refine_tags`, { resume_path: resumePath, prompt });

export const getJob = (id) => axios.get(`${API_BASE}/job/${id}`);
