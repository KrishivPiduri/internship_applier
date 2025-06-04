from openai import OpenAI
from scipy.spatial.distance import cosine

client = OpenAI(api_key="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")

vector1=client.embeddings.create(
  model="text-embedding-ada-002",
  input="What is your Grade Point Average?",
  encoding_format="float"
).data[0].embedding

vector2=client.embeddings.create(
  model="text-embedding-ada-002",
  input="GPA",
  encoding_format="float"
).data[0].embedding

print(1-cosine(vector1, vector2))