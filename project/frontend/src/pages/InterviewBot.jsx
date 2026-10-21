import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Webcam from "react-webcam";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import mascot from "../assets/mascot.png";

export default function InterviewBot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [resumeText, setResumeText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [job, setJob] = useState(null);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const speakQuestion = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1; // normal speed
    utterance.pitch = 1;
    speechSynthesis.cancel(); // cancel anything currently playing
    speechSynthesis.speak(utterance);
  };
  

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    fetch("/uploads/example.pdf")
      .then((res) => res.text())
      .then((text) => {
        setResumeText(text);
        return axios.post("http://127.0.0.1:5000/start_interview", {
          job_id: parseInt(id),
          resume_text: text,
        });
      })
      .then((res) => {
        setQuestions(res.data.questions);
        setJob(res.data.job);
        speakQuestion(res.data.questions[0]); // speak first question
      })
      .catch((err) => {
        console.error(err);
        alert("Interview setup failed");
      });
  }, [id]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      handleDoneSpeaking();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const startRecording = () => {
    resetTranscript();
    setTimer(30);
    setIsTimerRunning(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopRecording = () => {
    setIsTimerRunning(false);
    SpeechRecognition.stopListening();
  };

  const handleDoneSpeaking = async () => {
    stopRecording();
    const answer = transcript.trim();
    if (!answer) return;

    const res = await axios.post("http://127.0.0.1:5000/submit_answer", {
      answer,
      job_title: job.title,
    });

    setUserAnswers((prev) => [...prev, answer]);
    setFeedbacks((prev) => [...prev, { score: res.data.score, feedback: res.data.feedback }]);

    if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => {
          const nextIndex = i + 1;
          speakQuestion(questions[nextIndex]);
          return nextIndex;
        });
        resetTranscript();
        setTimer(30);
      } else {
      finishInterview([...userAnswers, answer], [...feedbacks, res.data]);
    }
  };

  const finishInterview = async (answers, feedback) => {
    const final = questions.map((q, i) => ({
      questionNumber: i + 1,
      question: q,
      answer: answers[i],
      score: feedback[i].score,
      feedback: feedback[i].feedback,
    }));

    await axios.post("http://127.0.0.1:5000/finish_interview", final);
    navigate("/interview-results");
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="two-page">Browser does not support speech recognition.</div>;
  }

  return (
    <div className="interview-page">
    <div className="interview-header">
    <h1 className="two-header">🧠 Practice Interview</h1>
    </div>
    <div className="interview-container">
      {/* Left Half */}
      <div className="left-panel">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{ facingMode: "user" }}
          className="camera-feed"
        />
  
        {listening && (
          <div className="speech-indicator">
            <div className="pulse-ring"></div>
            <div className="mic-icon">🎤 Listening</div>
            <div className="timer-display">{timer}s</div>
          </div>
        )}
  
        <div className="controls-container">
          <button onClick={startRecording} disabled={listening} className="details-button">
            Start Recording
          </button>
          <button onClick={handleDoneSpeaking} disabled={!listening} className="details-button">
            Done Speaking
          </button>
        </div>
  
        <div className="transcript-box">
          <strong>Transcript:</strong>
          <p>{transcript || <em>Waiting for your voice...</em>}</p>
        </div>
      </div>
  
      {/* Right Half */}
      <div className="right-panel">
        <img src={mascot} alt="Mascot" className="mascot-image" />
        <div className="question-box">
          <h3>Question {currentIndex + 1} of {questions.length}</h3>
          <p>{questions[currentIndex]}</p>
        </div>
      </div>
    </div>
    </div>
  );
}
