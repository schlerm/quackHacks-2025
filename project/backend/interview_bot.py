import json
import random
from openai import OpenAI

client = OpenAI(api_key="")

def get_humanized_text(prompt, title, company_name):
    professional_prompt = f"Rephrase this as if you're the {title} at {company_name} conducting a professional interview: {prompt}"
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": professional_prompt}],
        max_tokens=150,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

def evaluate_answer(answer, job_title):
    prompt = f"As the {job_title} at a company, evaluate this answer. Respond in format: 'Score: X/10 - Feedback: ...'.\nAnswer: {answer}"
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100,
        temperature=0.5
    )
    content = response.choices[0].message.content.strip()
    try:
        score_part = content.split("Score:")[1].split("/")[0].strip()
        feedback = content.split("Feedback:")[1].strip()
        return int(score_part), feedback
    except Exception:
        return 5, "Unable to parse response."

def generate_interview_questions(job_data):
    title = job_data.get("title", "Professional")
    company_name = job_data.get("company_name", "the company")
    main_category = job_data.get("main_category", "your field")
    tags = job_data.get("tags", [])

    questions = []

    # Fixed questions
    questions.append(f"Tell me about yourself. What drew you to a career in {main_category}?")
    questions.append(f"At {company_name}, {main_category.lower()} is key to our success. Can you share an experience where you contributed to a project in this area?")
    questions.append("Pick an experience from your resume and explain how you approached a challenge in that role.")
    questions.append(f"Discuss a technical or managerial challenge you’ve faced in {main_category}.")
    questions.append(f"What’s a critical concept in {main_category} that every professional in this field should master?")

    # Dynamic questions based on tags
    chosen_tags = random.sample(tags, min(2, len(tags)))
    for tag in chosen_tags:
        questions.append(f"How have you worked with or led a team on something related to {tag}?")

    # Closing questions
    questions.append(f"What do you know about {company_name}? Why are you interested in joining us?")
    questions.append(f"How do you see yourself contributing to {company_name}’s goals or mission?")
    questions.append(f"Do you have any questions for me about the role or working at {company_name}?")

    return questions  # Always 10 total

