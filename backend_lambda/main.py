from openai import OpenAI
import pdfplumber
import os
client = OpenAI(api_key="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")


def extract_text_from_pdf(pdf_path: str) -> str:
  """
  Opens the PDF, extracts all text, and returns a single string with newlines.
  """
  if not os.path.isfile(pdf_path):
    raise FileNotFoundError(f"File not found: {pdf_path}")

  pages_text = []
  with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
      text = page.extract_text() or ""
      pages_text.append(text)
  return "\n".join(pages_text)

response = client.responses.create(
  model="gpt-4.1-nano",
  input=[
    {
      "role": "system",
      "content": [
        {
          "type": "input_text",
          "text": "You are a resume parser. Return all sections, and for 'Education', structure entries into institution, location, start_date, end_date, GPA_weighted, GPA_unweighted, and relevant_coursework."
        }
      ]
    }
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
      "description": "Extract structured sections from resume text, including contact, education, experience, projects, and more.",
      "parameters": {
        "type": "object",
        "required": [
          "sections"
        ],
        "properties": {
          "sections": {
            "type": "object",
            "properties": {
              "Contact": {
                "type": "object",
                "properties": {
                  "email": {
                    "type": "string"
                  },
                  "phone": {
                    "type": "string"
                  },
                  "linkedin": {
                    "type": "string"
                  },
                  "github": {
                    "type": "string"
                  },
                  "portfolio": {
                    "type": "string"
                  }
                },
                "required": [
                  "email",
                  "phone",
                  "linkedin",
                  "github",
                  "portfolio"
                ],
                "additionalProperties": True
              },
              "Education": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "institution": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "degree": {
                      "type": "string"
                    },
                    "major": {
                      "type": "string"
                    },
                    "minor": {
                      "type": "string"
                    },
                    "start_date": {
                      "type": "string"
                    },
                    "end_date": {
                      "type": "string"
                    },
                    "GPA_weighted": {
                      "type": [
                        "number",
                        "null"
                      ]
                    },
                    "GPA_unweighted": {
                      "type": [
                        "number",
                        "null"
                      ]
                    },
                    "relevant_coursework": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "honors": {
                      "type": "array",
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
                  ]
                }
              },
              "Experience": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string"
                    },
                    "company": {
                      "type": "string"
                    },
                    "location": {
                      "type": "string"
                    },
                    "start_date": {
                      "type": "string"
                    },
                    "end_date": {
                      "type": "string"
                    },
                    "description": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "technologies": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "achievements": {
                      "type": "array",
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
                  ]
                }
              },
              "Projects": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    },
                    "technologies": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "link": {
                      "type": "string"
                    },
                    "collaboration": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name",
                    "description",
                    "technologies",
                    "link",
                    "collaboration"
                  ]
                }
              },
              "Skills": {
                "type": "object",
                "properties": {
                  "languages": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "frameworks": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "tools": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "platforms": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  },
                  "other": {
                    "type": "array",
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
                ]
              },
              "Certifications": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "issuer": {
                      "type": "string"
                    },
                    "issue_date": {
                      "type": "string"
                    },
                    "expiration_date": {
                      "type": "string"
                    },
                    "credential_id": {
                      "type": "string"
                    },
                    "credential_url": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name",
                    "issuer",
                    "issue_date",
                    "expiration_date",
                    "credential_id",
                    "credential_url"
                  ]
                }
              },
              "Awards": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "Volunteering": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "organization": {
                      "type": "string"
                    },
                    "role": {
                      "type": "string"
                    },
                    "start_date": {
                      "type": "string"
                    },
                    "end_date": {
                      "type": "string"
                    },
                    "description": {
                      "type": "array",
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
                  ]
                }
              },
              "Publications": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "title": {
                      "type": "string"
                    },
                    "journal": {
                      "type": "string"
                    },
                    "date": {
                      "type": "string"
                    },
                    "link": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "title",
                    "journal",
                    "date",
                    "link"
                  ]
                }
              },
              "Misc": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            },
            "required": [
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
)
print(response)