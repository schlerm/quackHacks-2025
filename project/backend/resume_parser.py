import json
import re
from pypdf import PdfReader
from openai import OpenAI

client = OpenAI(api_key="")

# Load category/tag info
with open("element_ids.json", "r") as f:
    attribute_data = json.load(f)

attribute_json_str = json.dumps(attribute_data, separators=(',', ':'))

def parse_resume_to_criteria(pdf_path):
    # Extract resume text
    reader = PdfReader(pdf_path)
    text = "".join(page.extract_text() or "" for page in reader.pages)

    # Build prompt
    prompt = (
        f"Here is a resume:\n\n{text}\n\n"
        f"Given the following available options in JSON:\n{attribute_json_str}\n\n"
        f"Choose the best-matching:\n"
        f"- main_category\n- location\n- seniority_level\n- 5 tags\n\n"
        f"Respond ONLY with a JSON object in this format:\n"
        f'{{"main_category":"...", "location":"...", "seniority_level":"...", "tags":["...","...","...","...","..."]}}'
    )

    # Send to GPT
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    gpt_output = response.choices[0].message.content.strip()

    # Try to extract JSON from response
    match = re.search(r'\{.*\}', gpt_output, re.DOTALL)
    if not match:
        raise ValueError("No JSON found in GPT response.")

    return json.loads(match.group(0))
