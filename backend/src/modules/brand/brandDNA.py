# Source: https://github.com/jerryjliu/llama_index (adapted for Stratix)
# Brand DNA Engine - LlamaIndex-based vector store for brand knowledge

from llama_index import GPTVectorStoreIndex, SimpleDirectoryReader

# Load brand documents (e.g., files in 'brand_docs' directory)
documents = SimpleDirectoryReader('brand_docs').load_data()
# Build a vector index of brand knowledge for retrieval augmentation
index = GPTVectorStoreIndex.from_documents(documents)  # Source: LlamaIndex

def query_brand_knowledge(query: str) -> str:
    """Query the brand DNA index for relevant context."""
    # Retrieve answer with brand-specific context (ensures on-brand tone)
    response = index.query(query)
    return str(response)  # convert response to string for usage

# Example usage:
# answer = query_brand_knowledge("What is our brand's tone?")
# print(answer) 