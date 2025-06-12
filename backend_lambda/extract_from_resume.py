from openai import OpenAI
import json
import fitz
import boto3
import os
import uuid
import tempfile
import io
from pypdf import PdfReader
import tracemalloc
tracemalloc.start()

os.environ['AWS_ACCESS_KEY_ID'] = 'AKIAZR7BH5KNJM727DVT'
os.environ['AWS_SECRET_ACCESS_KEY'] = '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'
s3 = boto3.client('s3')

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table("resumes")

client = OpenAI(api_key="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")

def extract_text_and_links(bucket, key, max_pages=None):
    """
    Stream the PDF from S3 into memory and extract text using pypdf, without writing to disk.
    """
    # Get object and stream body
    obj = s3.get_object(Bucket=bucket, Key=key)
    body = obj['Body'].read()
    # Use BytesIO to wrap binary PDF
    pdf_stream = io.BytesIO(body)
    reader = PdfReader(pdf_stream)
    lines = []
    page_count = len(reader.pages)
    limit = min(page_count, max_pages) if max_pages else page_count
    for i in range(limit):
        page = reader.pages[i]
        text = page.extract_text()
        if text:
            lines.extend(text.splitlines())
    return "\n".join(lines)

# S3 event trigger: get bucket and object key
try:
    bucket = "app-autofill-resumes"
    key = "resume.pdf"  # Replace with the actual key from the event
except (KeyError, IndexError):
    pass

s3 = boto3.client('s3')
# Download the PDF to a temp file
extracted_text = extract_text_and_links(bucket, key)

# Call OpenAI to parse the resume
response = json.loads(client.responses.create(
    model="gpt-4.1-nano",
    input=[
        {
            "role": "system",
            "content": [
                {
                    "type": "input_text",
                    "text": "You are a resume parser. Extract personal information like full name, location, work authorization, and summary. Return all sections, and for 'Education', structure entries into institution, location, start_date, end_date, GPA_weighted, GPA_unweighted, and relevant_coursework. When something isn't provided, just set it to null. Also detect personal info. If there's a full name, split it into first and last name."
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": extracted_text
                }
            ]
        },
    ],
    text={
        "format": {
            "type": "text"
        }
    },
    reasoning={},
    tools=[
        {
            "type": "function",
            "name": "parse_resume_sections_structured",
            "description": "Extract structured sections from resume text, including personal info, contact, education, experience, projects, and more.",
            "parameters": {
                "type": "object",
                "required": [
                    "sections"
                ],
                "properties": {
                    "sections": {
                        "type": "object",
                        "properties": {
                            "personal_info": {
                                "type": "object",
                                "properties": {
                                    "first_name": {
                                        "type": ["string", "null"]
                                    },
                                    "email": {
                                        "type": ["string", "null"]
                                    },
                                    "last_name": {
                                        "type": ["string", "null"]
                                    },
                                    "preferred_name": {
                                        "type": ["string", "null"]
                                    },
                                    "location": {
                                        "type": ["string", "null"]
                                    },
                                    "work_authorization": {
                                        "type": ["string", "null"]
                                    },
                                    "summary": {
                                        "type": ["string", "null"]
                                    }
                                },
                                "required": ["first_name", "last_name", "email", "preferred_name", "location", "work_authorization", "summary"],
                                "additionalProperties": False
                            },
                            "Contact": {
                                "type": "object",
                                "properties": {
                                    "email": {
                                        "type": ["string", "null"]
                                    },
                                    "phone": {
                                        "type": ["string", "null"]
                                    },
                                    "linkedin": {
                                        "type": ["string", "null"]
                                    },
                                    "github": {
                                        "type": ["string", "null"]
                                    },
                                    "portfolio": {
                                        "type": ["string", "null"]
                                    }
                                },
                                "required": ["email", "phone", "linkedin", "github", "portfolio"],
                                "additionalProperties": False
                            },
                            "Education": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "institution": {
                                            "type": ["string", "null"]
                                        },
                                        "location": {
                                            "type": ["string", "null"]
                                        },
                                        "degree": {
                                            "type": ["string", "null"]
                                        },
                                        "major": {
                                            "type": ["string", "null"]
                                        },
                                        "minor": {
                                            "type": ["string", "null"]
                                        },
                                        "start_date": {
                                            "type": ["string", "null"]
                                        },
                                        "end_date": {
                                            "type": ["string", "null"]
                                        },
                                        "GPA_weighted": {
                                            "type": ["string", "null"]
                                        },
                                        "GPA_unweighted": {
                                            "type": ["string", "null"]
                                        },
                                        "relevant_coursework": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        },
                                        "honors": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        }
                                    },
                                    "required": [
                                        "institution",
                                        "location",
                                        "degree",
                                        "major",
                                        "minor",
                                        "start_date",
                                        "end_date",
                                        "GPA_weighted",
                                        "GPA_unweighted",
                                        "relevant_coursework",
                                        "honors"
                                    ],
                                    "additionalProperties": False
                                }
                            },
                            "Experience": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {
                                            "type": ["string", "null"]
                                        },
                                        "company": {
                                            "type": ["string", "null"]
                                        },
                                        "location": {
                                            "type": ["string", "null"]
                                        },
                                        "start_date": {
                                            "type": ["string", "null"]
                                        },
                                        "end_date": {
                                            "type": ["string", "null"]
                                        },
                                        "description": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        },
                                        "technologies": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        },
                                        "achievements": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        }
                                    },
                                    "required": [
                                        "title",
                                        "company",
                                        "location",
                                        "start_date",
                                        "end_date",
                                        "description",
                                        "technologies",
                                        "achievements"
                                    ],
                                    "additionalProperties": False
                                },
                                "additionalProperties": False
                            },
                            "Projects": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {
                                            "type": ["string", "null"]
                                        },
                                        "description": {
                                            "type": ["string", "null"]
                                        },
                                        "technologies": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        },
                                        "link": {
                                            "type": ["string", "null"]
                                        },
                                        "collaboration": {
                                            "type": ["string", "null"]
                                        }
                                    },
                                    "required": [
                                        "name",
                                        "description",
                                        "technologies",
                                        "link",
                                        "collaboration"
                                    ],
                                    "additionalProperties": False
                                },
                                "additionalProperties": False
                            },
                            "Skills": {
                                "type": ["object", "null"],
                                "properties": {
                                    "languages": {
                                        "type": ["array", "null"],
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "frameworks": {
                                        "type": ["array", "null"],
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "tools": {
                                        "type": ["array", "null"],
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "platforms": {
                                        "type": ["array", "null"],
                                        "items": {
                                            "type": "string"
                                        }
                                    },
                                    "other": {
                                        "type": ["array", "null"],
                                        "items": {
                                            "type": "string"
                                        }
                                    }
                                },
                                "required": [
                                    "languages",
                                    "frameworks",
                                    "tools",
                                    "platforms",
                                    "other"
                                ],
                                "additionalProperties": False
                            },
                            "Certifications": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {
                                            "type": ["string", "null"]
                                        },
                                        "issuer": {
                                            "type": ["string", "null"]
                                        },
                                        "issue_date": {
                                            "type": ["string", "null"]
                                        },
                                        "expiration_date": {
                                            "type": ["string", "null"]
                                        },
                                        "credential_id": {
                                            "type": ["string", "null"]
                                        },
                                        "credential_url": {
                                            "type": ["string", "null"]
                                        }
                                    },
                                    "required": [
                                        "name",
                                        "issuer",
                                        "issue_date",
                                        "expiration_date",
                                        "credential_id",
                                        "credential_url"
                                    ],
                                    "additionalProperties": False
                                },
                                "additionalProperties": False
                            },
                            "Awards": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "string"
                                }
                            },
                            "Volunteering": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "organization": {
                                            "type": ["string", "null"]
                                        },
                                        "role": {
                                            "type": ["string", "null"]
                                        },
                                        "start_date": {
                                            "type": ["string", "null"]
                                        },
                                        "end_date": {
                                            "type": ["string", "null"]
                                        },
                                        "description": {
                                            "type": ["array", "null"],
                                            "items": {
                                                "type": "string"
                                            }
                                        }
                                    },
                                    "required": [
                                        "organization",
                                        "role",
                                        "start_date",
                                        "end_date",
                                        "description"
                                    ],
                                    "additionalProperties": False
                                },
                                "additionalProperties": False
                            },
                            "Publications": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {
                                            "type": ["string", "null"]
                                        },
                                        "journal": {
                                            "type": ["string", "null"]
                                        },
                                        "date": {
                                            "type": ["string", "null"]
                                        },
                                        "link": {
                                            "type": ["string", "null"]
                                        }
                                    },
                                    "required": [
                                        "title",
                                        "journal",
                                        "date",
                                        "link"
                                    ],
                                    "additionalProperties": False
                                },
                                "additionalProperties": False
                            },
                            "Misc": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "string"
                                }
                            }
                        },
                        "required": [
                            "personal_info",
                            "Contact",
                            "Education",
                            "Experience",
                            "Projects",
                            "Skills",
                            "Certifications",
                            "Awards",
                            "Volunteering",
                            "Publications",
                            "Misc"
                        ],
                        "additionalProperties": False
                    }
                },
                "additionalProperties": False
            },
            "strict": True
        }
    ],
    temperature=0.55,
    max_output_tokens=2048,
    top_p=1,
    store=True
).output[0].arguments)

# Use the file name without extension as ID
id = key.split('.')[0]
response['id'] = id
response['pdf_url'] = f's3://{bucket}/{key}'

def clean_none(obj):
    if isinstance(obj, dict):
        return {k: clean_none(v) for k, v in obj.items() if v is not None}
    elif isinstance(obj, list):
        return [clean_none(i) for i in obj if i is not None]
    else:
        return obj

cleaned_data = clean_none(response)
table.put_item(Item=cleaned_data)
current, peak = tracemalloc.get_traced_memory()
print(f"Memory usage: Current={current / 1024:.1f} KB; Peak={peak / 1024:.1f} KB")
tracemalloc.stop()