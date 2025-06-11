import boto3
from botocore.exceptions import ClientError
import os
from openai import OpenAI
import json

os.environ['AWS_ACCESS_KEY_ID'] = 'AKIAZR7BH5KNJM727DVT'
os.environ['AWS_SECRET_ACCESS_KEY'] = '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'
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
client = OpenAI(api_key="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")

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

def get_item_by_partition_key(dynamodb, table_name, partition_key_name, partition_key_value):
    """
    Retrieves an item from DynamoDB table using the partition key.

    Args:
        dynamodb (boto3.resource): The DynamoDB resource
        table_name (str): The name of the DynamoDB table
        partition_key_name (str): The name of the partition key
        partition_key_value (str): The value of the partition key

    Returns:
        dict: The item as a dictionary if found, None otherwise
    """
    try:
        # Get the table
        table = dynamodb.Table(table_name)

        # Get the item
        response = table.get_item(
            Key={
                partition_key_name: partition_key_value
            }
        )

        # Check if item exists
        if 'Item' in response:
            return response['Item']
        else:
            print(f"No item found with {partition_key_name} = {partition_key_value}")
            return None

    except ClientError as e:
        print(f"Error retrieving item: {e}")
        return None

print(get_item_by_partition_key(dynamodb, 'resumes', 'id', '8bb821d4-007a-4df1-8c9a-1b79e8da9322'))


def get_fill_form_schema():
    return {
        "name": "fill_form",
        "description": "Fills out a job application form using resume data.",
        "parameters": {
            "type": "object",
            "properties": {
                "filled_form": {
                    "type": "object",
                    "description": "A dictionary where keys are form input IDs and values are the corresponding form values."
                }
            },
            "required": ["filled_form"],
            "additionalProperties": False
        }
    }

def call_openai_fill_form(resume_data, form_schema):
    tools = [
        {
            "type": "function",
            "name": "fill_form",
            "description": "Fills out a job application form using resume data.",
            # <-- Only the JSON Schema goes here
            "parameters": get_fill_form_schema()["parameters"]
        }
    ]

    response = client.responses.create(
        model="gpt-4.1-nano",
        temperature=0.1,
        input=[
            {
                "role": "system",
                "content": (
                    "Map the following resume JSON to the provided form schema. "
                    "Return a JSON object (via the 'fill_form' function) where keys are form input IDs and values are the best matching values. "
                    "Include all repeatable group entries. "
                    "Use true/false for checkboxes and omit file fields if not present."
                    "- You **must** return every single `id` from the form schema. If certain information is not specified, just set the value to null..  \n"
                    "- If you can’t find a value for a field, set its value to `null`.  \n"
                    "- For checkboxes, use `true` or `false`.  \n"
                    "- Omit file fields only if there truly isn’t a file key in the resume.  \n"
                    "- Return your output via the `fill_form` function call, and no other text."
                )
            },
            {"role": "user", "content": f"Resume data: {resume_data}"},
            {"role": "user", "content": f"Form schema: {form_schema}"}
        ],
        tools=tools,
    )

    return response

# Example usage
resume_data = get_item_by_partition_key(dynamodb, 'resumes', 'id', '906309e5-9d11-4c82-a8f1-9d99eb999992')
if resume_data:
    filled = call_openai_fill_form(resume_data, form)
    print(filled)

# Lambda function handler for API Gateway integration
# Ensure Lambda Proxy Integration is enabled for this function in API Gateway

def lambda_handler(event, context):
    """
    AWS Lambda handler to process HTTP requests via API Gateway.
    Expects a JSON body with 'resume_id'.
    """
    # Parse and validate request body
    try:
        body = json.loads(event.get('body', '{}'))
        resume_id = body['resume_id']
    except (KeyError, json.JSONDecodeError):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Missing or invalid resume_id in request body.'})
        }

    # Fetch resume data from DynamoDB
    resume_data = get_item_by_partition_key(dynamodb, 'resumes', 'id', resume_id)
    if not resume_data:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Resume with id {resume_id} not found.'})
        }

    # Call OpenAI to fill the form
    try:
        ai_response = call_openai_fill_form(resume_data, form)
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Error processing form: {str(e)}'})
        }

    # Return the AI response in the response body
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'result': ai_response})
    }
