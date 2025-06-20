import boto3
from botocore.exceptions import ClientError
import os
from openai import OpenAI
import json

=
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
client = OpenAI()

form={
    "inputs": [
        {
            "id": "first_name",
            "type": "text",
            "label": "First Name*",
            "options": None
        },
        {
            "id": "last_name",
            "type": "text",
            "label": "Last Name*",
            "options": None
        },
        {
            "id": "email",
            "type": "text",
            "label": "Email*",
            "options": None
        },
        {
            "id": "phone",
            "type": "text",
            "label": "Phone*",
            "options": None
        },
        {
            "id": "resume",
            "type": "file",
            "label": "Attach",
            "options": None
        },
        {
            "id": "question_30223599002",
            "type": "text",
            "label": "Please confirm your graduation time frame.*",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "question_30223607002",
            "type": "text",
            "label": "What are your preferred pronouns?*",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "question_31964051002",
            "type": "text",
            "label": "LinkedIn Profile",
            "options": None
        },
        {
            "id": "question_31226333002",
            "type": "text",
            "label": "Current Location*",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "question_30223600002",
            "type": "text",
            "label": "Current Employer",
            "options": None
        },
        {
            "id": "question_30223601002",
            "type": "text",
            "label": "Work Authorization*",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "question_30223602002",
            "type": "text",
            "label": "Sponsorship Requirements*",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "question_30223603002",
            "type": "text",
            "label": "If so, please explain (visa status and expiration)",
            "options": None
        },
        {
            "id": "question_30223604002",
            "type": "text",
            "label": "How did you hear about Optiver? *",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "question_30223605002",
            "type": "text",
            "label": "If other, please explain",
            "options": None
        },
        {
            "id": "question_30223606002[]_199112700002",
            "type": "checkbox",
            "label": "Austin",
            "options": None
        },
        {
            "id": "question_30223606002[]_199112701002",
            "type": "checkbox",
            "label": "Chicago",
            "options": None
        },
        {
            "id": "question_30223608002",
            "type": "text",
            "label": "Terms and Conditions*",
            "options": None
        },
        {
            "id": "",
            "type": "text",
            "label": "",
            "options": None
        },
        {
            "id": "gender",
            "type": "text",
            "label": "Gender",
            "options": None
        },
        {
            "id": "hispanic_ethnicity",
            "type": "text",
            "label": "Are you Hispanic/Latino?",
            "options": None
        },
        {
            "id": "veteran_status",
            "type": "text",
            "label": "Veteran Status",
            "options": None
        },
        {
            "id": "disability_status",
            "type": "text",
            "label": "Disability Status",
            "options": [
                "Yes, I have a disability, or have had one in the past",
                "No, I do not have a disability and have not had one in the past",
                "I do not want to answer"
            ]
        }
    ],
    "groups": {
        "education--form": [
            {
                "id": "school--0",
                "type": "text",
                "label": "School",
                "options": None
            },
            {
                "id": "degree--0",
                "type": "text",
                "label": "Degree",
                "options": None
            },
            {
                "id": "discipline--0",
                "type": "text",
                "label": "Discipline",
                "options": None
            },
            {
                "id": "start-month--0",
                "type": "text",
                "label": "Start date month",
                "options": None
            },
            {
                "id": "start-year--0",
                "type": "number",
                "label": "Start date year",
                "options": None
            },
            {
                "id": "end-month--0",
                "type": "text",
                "label": "End date month",
                "options": None
            },
            {
                "id": "end-year--0",
                "type": "number",
                "label": "End date year",
                "options": None
            }
        ]
    }
}

def build_fill_form_json_schema(form):
    """
    Given a form spec:
      form['inputs'] = [{id, type, ...}, ...]
      form['groups'] = { groupKey: [ {id, type, ...}, ... ], ... }
    Return a JSON Schema dict suitable for the 'fill_form' function.
    """
    properties = {}
    required = []

    # Single inputs
    for inp in form.get('inputs', []):
        fid = inp.get('id')
        if not fid:
            continue
        required.append(fid)

        # Map HTML types to JSON types
        t = inp.get('type')
        if t == 'checkbox':
            jtype = 'boolean'
        elif t in ('number',):
            jtype = 'number'
        else:
            jtype = 'string'

        properties[fid] = {'type': [jtype, 'null']}

    # Group inputs become arrays of objects
    for group_key, fields in form.get('groups', {}).items():
        required.append(group_key)

        # Build the schema for one entry in this group
        item_props = {}
        item_required = []

        for f in fields:
            fid = f.get('id')
            if not fid:
                continue
            item_required.append(fid)

            ft = f.get('type')
            if ft == 'checkbox':
                jt = 'boolean'
            elif ft == 'number':
                jt = 'number'
            else:
                jt = 'string'
            item_props[fid] = {'type': [jt, 'null']}

        properties[group_key] = {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': item_props,
                'required': item_required,
                'additionalProperties': False
            }
        }

    return {
        'name': 'fill_form',
        'description': 'Auto-fill a form by mapping resume data to form input IDs.',
        'parameters': {
            'type': 'object',
            'properties': {
                'filled_form': {
                    'type': 'object',
                    'properties': properties,
                    'required': required,
                    'additionalProperties': False
                }
            },
            'required': ['filled_form'],
            'additionalProperties': False
        }
    }

def call_openai_fill_form(resume_data, form_schema):
    schema_tool = build_fill_form_json_schema(form)
    tools = [{
                "type": "function",
                "name": "get_form_data",
                "description": "Given all the information needed to fill a form, return the filled form data.",
                "parameters": schema_tool["parameters"]
            }]

    response = client.responses.create(
        model="gpt-4o-mini",
        temperature=0.3,
        tools=tools,
        input=[
            {
                "role": "system",
                "content": (
                    "You are an assistant that maps resume JSON data into an HTML form schema.\n\n"
                    "You will receive:\n"
                    "  • `resume_data`: a JSON object with the applicant’s fields (strings, numbers, booleans).\n"
                    "  • `form_schema`: an object with two keys:\n"
                    "      – `inputs`: an array of { id, type, label, options }\n"
                    "      – `groups`: an object mapping groupKey → array of input-descriptors\n\n"
                    "Your job is to return a single JSON function call exactly of the form:\n\n"
                    "  {\n"
                    "    \"name\": \"fill_form\",\n"
                    "    \"arguments\": {\n"
                    "      \"filled_form\": { ... }\n"
                    "    }\n"
                    "  }\n\n"
                    "Where `filled_form` is an object whose keys are every form field ID (including all repeatable-group IDs), and whose values are:\n\n"
                    "  • A primitive value (string/number) for single inputs\n"
                    "  • `true` or `false` for checkboxes\n"
                    "  • An array of objects for each repeatable group key, where each entry maps that group’s field IDs to values\n\n"
                    "Rules:\n"
                    "1. You *must* include every ID exactly as it appears in the schema.\n"
                    "2. If data is not available for a field, set its value to `null`.\n"
                    "3. Do *not* output any text—only the JSON function call."
                    "4. If you aren't sure what a field is asking you about, take a look at the label property for the input field to try and figure it out.\n"
                    "5. If you aren't sure about what a field's value should be, set it to null.\n"
                    "6. If the options property is not null, you must choose one of the options for that field.\n"
                    "7. The `pdf_url` property from the Resume Data is the URL to the resume. If any fields ask you to upload a resume, this is what you need to upload..\n"
                ),
            },
            {
                "role": "user",
                "content": f"Resume data:\n{resume_data}\n\nForm schema:\n{form_schema}"
            }
        ]
    )

    return response

# Lambda function handler for API Gateway integration
# Ensure Lambda Proxy Integration is enabled for this function in API Gateway

def lambda_handler():
    table = dynamodb.Table('resumes')
    response = table.get_item(Key={'id': '7c710118-2e35-4db6-9415-1650ce437f22'})
    resume_data = response.get('Item')
    print(resume_data)

    # Call OpenAI to fill the form
    ai_response = call_openai_fill_form(resume_data, form)
    print(ai_response)
    print(json.loads(ai_response.output[0].content[0].text))

lambda_handler()
