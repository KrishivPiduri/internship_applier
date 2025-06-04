from openai import OpenAI
# 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
#embedding = openai.Embedding.create(input="Are you authorized to work in the US?", model="text-embedding-3-small")["data"][0]["embedding"]
client = OpenAI(api_key="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")

response=client.embeddings.create(
  model="text-embedding-ada-002",
  input="The food was delicious and the waiter...",
  encoding_format="float"
)

print(response)