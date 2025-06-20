# Source: https://python.langchain.com/docs/integrations/document_loaders/gutenberg (adapted for Stratix)
# Knowledge Feed Ingestion - LangChain GutenbergLoader for external content

from langchain_community.document_loaders import GutenbergLoader

# Example: load a Project Gutenberg eBook via URL
feed_url = "https://www.gutenberg.org/cache/epub/69972/pg69972.txt"
loader = GutenbergLoader(feed_url)
documents = loader.load()
print(f"Loaded {len(documents)} documents from feed")
# (Further processing like cleaning or indexing can be done here)

# Example usage:
# for doc in documents:
#     print(doc.page_content[:200]) 