import spacy

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# Hardcoded mappings from common terms to ontology entities/properties
ENTITY_MAP = {
    "john": ":John",
    "mary": ":Mary",
    "bill": ":Bill"
}

PROPERTY_MAP = {
    "uncle": ":hasUncle",
    "parent": ":hasParent",
    "brother": ":hasBrother",
    "mother": ":hasParent",
    "father": ":hasParent",
    "sibling": ":hasBrother"  # Simplified for demo
}

PREFIX = "PREFIX : <http://test.org/family.owl#>"

def extract_subject_object(doc):
    subject = None
    relation = None

    for token in doc:
        if token.pos_ in ("AUX"):
            word = token.text.lower()
            print(word)
        if token.pos_ in ("PROPN", "NOUN"):
            word = token.text.lower()
            if word in ENTITY_MAP:
                subject = ENTITY_MAP[word]
        if token.lemma_.lower() in PROPERTY_MAP:
            relation = PROPERTY_MAP[token.lemma_.lower()]
    print(subject, relation)
    return subject, relation

def build_sparql(subject, relation):
    if not subject or not relation:
        return None
    return f"""{PREFIX}

SELECT ?result WHERE {{
  {subject} {relation} ?result .
}}"""

def main():
    while True:
        user_input = input("Ask a question (or 'exit'): ").strip()
        if user_input.lower() in ["exit", "quit"]:
            break

        doc = nlp(user_input)
        subject, relation = extract_subject_object(doc)
        query = build_sparql(subject, relation)

        if query:
            print("\nGenerated SPARQL Query:\n")
            print(query)
        else:
            print("Sorry, I couldn't understand the question.\n")

if __name__ == "__main__":
    main()

