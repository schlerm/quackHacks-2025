from flask import Flask, request, jsonify, send_file
from resume_parser import parse_resume_to_criteria
from job_matcher import match_jobs, refine_tags
from interview_bot import generate_interview_questions, get_humanized_text, evaluate_answer
import os
import uuid
import json
from flask_cors import CORS
from flask import send_from_directory

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    file = request.files.get("file")
    if not file or not file.filename.endswith(".pdf"):
        return jsonify({"error": "Please upload a PDF file"}), 400

    filename = f"{uuid.uuid4()}.pdf"
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(path)

    # Extract search criteria from resume using GPT
    criteria = parse_resume_to_criteria(path)

    # Match jobs
    top_matches = match_jobs(criteria)

    # Save matches to disk (optional for re-use)
    with open("top_matches.json", "w") as f:
        json.dump(top_matches, f, indent=2)

    return jsonify(top_matches)

@app.route("/get_matches", methods=["GET"])
def get_matches():
    try:
        with open("top_matches.json", "r") as f:
            matches = json.load(f)
        return jsonify(matches)
    except FileNotFoundError:
        return jsonify({"error": "No matches found"}), 404

@app.route("/refine_tags", methods=["POST"])
def refine():
    data = request.json
    if not data or "prompt" not in data or "resume_path" not in data:
        return jsonify({"error": "Missing data"}), 400

    new_tags = refine_tags(data["resume_path"], data["prompt"])

    # Replace tags in last used criteria
    with open("top_matches.json", "r") as f:
        matches = json.load(f)

    # Get last criteria from one of the matches (assuming consistency)
    old_criteria = {
        "main_category": matches[0]["main_category"],
        "location": matches[0]["locations"][0],
        "seniority_level": matches[0]["seniority_level"],
        "tags": new_tags
    }

    new_matches = match_jobs(old_criteria)
    with open("top_matches.json", "w") as f:
        json.dump(new_matches, f, indent=2)

    return jsonify(new_matches)

@app.route("/job/<int:job_id>", methods=["GET"])
def get_job(job_id):
    with open("top_matches.json", "r") as f:
        matches = json.load(f)
    if 0 <= job_id < len(matches):
        return jsonify(matches[job_id])
    return jsonify({"error": "Invalid job ID"}), 404

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/start_interview", methods=["POST"])
def start_interview():
    data = request.json
    job_index = data.get("job_id")
    resume_text = data.get("resume_text", "")

    with open("top_matches.json") as f:
        matches = json.load(f)

    job = matches[job_index]
    questions = generate_interview_questions(job)
    humanized_questions = [get_humanized_text(q, job["title"], job["company_name"]) for q in questions]

    return jsonify({
        "job": job,
        "questions": humanized_questions
    })

@app.route("/submit_answer", methods=["POST"])
def submit_answer():
    data = request.json
    answer = data.get("answer")
    job_title = data.get("job_title")

    score, feedback = evaluate_answer(answer, job_title)
    return jsonify({
        "score": score,
        "feedback": feedback
    })

@app.route("/finish_interview", methods=["POST"])
def finish_interview():
    data = request.json
    with open("interview_results.json", "w") as f:
        json.dump(data, f, indent=2)
    return jsonify({"status": "saved"})

@app.route("/interview_results.json", methods=["GET"])
def get_interview_results():
    return send_from_directory(directory=".", path="interview_results.json")

@app.route("/generate_suggestions", methods=["POST"])
def generate_suggestions():
    from openai import OpenAI
    client = OpenAI(api_key="")

    data = request.json.get("results", [])
    combined_feedback = "\n".join(f"Q{i+1}: {item['feedback']}" for i, item in enumerate(data))

    prompt = (
        "Given the following feedback from a mock interview:\n\n"
        f"{combined_feedback}\n\n"
        "Generate 2 specific suggestions to help the user improve their future interview answers. "
        "Respond as a JSON list like [\"suggestion 1\", \"suggestion 2\"]"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content.strip()

        import re, json as pyjson
        match = re.search(r"\[.*\]", content, re.DOTALL)
        suggestions = pyjson.loads(match.group(0)) if match else []

        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e), "suggestions": []}), 500

