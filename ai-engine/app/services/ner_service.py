import spacy
import logging

logger = logging.getLogger(__name__)

class NERService:
    def __init__(self, model_name="en_core_web_sm"):
        try:
            self.nlp = spacy.load(model_name)
            logger.info(f"spaCy model {model_name} loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load spaCy model {model_name}: {e}. PII detection will be limited.")
            self.nlp = None

    def detect_entities(self, text):
        if not self.nlp or not text:
            return []
        
        # Process text in chunks if too large
        doc = self.nlp(text[:100000])
        entities = []
        
        # Map spaCy labels to DataSentinel PII types
        label_map = {
            "PERSON": "NAME",
            "ORG": "NAME",
            "GPE": "ADDRESS",
            "LOC": "ADDRESS",
            "DATE": "DOB"
        }
        
        for ent in doc.ents:
            if ent.label_ in label_map:
                entities.append({
                    "pii_type": label_map[ent.label_],
                    "text": ent.text,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "label": ent.label_,
                    "confidence": 0.8
                })
                
        return entities

ner_service = NERService()
