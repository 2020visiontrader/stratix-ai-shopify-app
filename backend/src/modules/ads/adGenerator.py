# Source: https://github.com/rotemweiss57/gpt-marketer, https://github.com/Social-GPT/agent (adapted for Stratix)
# Ad Generator - Generate ad copy using OpenAI

import os
import openai

openai.api_key = os.environ.get("OPENAI_API_KEY")

def generate_ad_copy(product_name: str, product_details: str) -> str:
    """Generate a short ad or social media post for the given product."""
    prompt = (
        f"Write a compelling ad for the product '{product_name}'. "
        f"Highlight: {product_details}. "
        f"Include a clear call-to-action."
    )
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8
    )
    ad_text = response.choices[0].message.content.strip()
    return ad_text

# Example usage:
# text = generate_ad_copy("EcoSip Water Bottle", "keeps drinks cold 24h, made from recycled materials")
# print(text) 