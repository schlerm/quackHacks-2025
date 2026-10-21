import json
import re
from pypdf import PdfReader
from openai import OpenAI

client = OpenAI(api_key="")

with open("all_jobs.json", "r") as f:
    jobs = json.load(f)

def score_job(job, criteria):
    score = 0
    if job.get("main_category") == criteria["main_category"]:
        score += 2
    if job.get("seniority_level") == criteria["seniority_level"]:
        score += 1
    if any(loc in job.get("locations", []) for loc in [criteria["location"]]):
        score += 1

    job_tags = set(tag.lower() for tag in job.get("tags", []))
    gpt_tags = set(tag.lower() for tag in criteria["tags"])
    tag_matches = job_tags.intersection(gpt_tags)
    score += len(tag_matches)

    return score

def match_jobs(criteria):
    scored = [(score_job(job, criteria), job) for job in jobs]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [job for score, job in scored[:10]]

def refine_tags(resume_path, user_prompt):
    # Extract resume text
    reader = PdfReader(resume_path)
    resume_text = "".join(page.extract_text() or "" for page in reader.pages)

    # Load available tags/categories
    with open("element_ids.json", "r") as f:
        attribute_data = json.load(f)
    attribute_json_str = json.dumps(attribute_data, separators=(',', ':'))

    prompt = (
        f"The resume is:\n{resume_text}\n\n"
        f"The user said they want to refine their search like this:\n\"{user_prompt}\"\n\n"
        f"Based on the resume and refinement, suggest 5 new tags (as a JSON list only). "
        f"Available tags are found in this JSON:\n{attribute_json_str}\n\n"
        f"Respond with: [\"tag1\", \"tag2\", \"tag3\", \"tag4\", \"tag5\"]"
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.choices[0].message.content.strip()
    try:
        return json.loads(raw)
    except Exception:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        return json.loads(match.group(0)) if match else []

