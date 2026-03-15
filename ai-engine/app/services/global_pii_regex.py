import re

PATTERNS = {
    # Indian Patterns (Legacy/Supported)
    "AADHAAR": re.compile(r'\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b'),
    "PAN": re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'),
    "MOBILE": re.compile(r'(?<!\d)[6-9][0-9]{9}(?!\d)'),
    "EMAIL": re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,7}\b'),
    "VOTER_ID": re.compile(r'\b[A-Z]{3}[0-9]{7}\b'),
    "PASSPORT": re.compile(r'\b[A-Z]{1}[0-9]{7}\b'),
    "IFSC": re.compile(r'\b[A-Z]{4}0[A-Z0-9]{6}\b'),
    "GSTIN": re.compile(r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b'),
    "UPI": re.compile(r'\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b'),
    "DOB": re.compile(r'\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](19|20)\d\d\b'),
    
    # Global/International Patterns
    "US_SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "UK_NI": re.compile(r'\b[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}[0-9]{6}[A-D]{1}\b'),
    "IBAN": re.compile(r'\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b'),
    "CREDIT_CARD": re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b'),
    "US_PHONE": re.compile(r'\b(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})\b'),
}

def mask_value(value: str, pii_type: str) -> str:
    """Mask PII value for safe display"""
    if pii_type == "EMAIL":
        parts = value.split('@')
        if len(parts) == 2:
            return f"{parts[0][:2]}***@{parts[1]}"
    if pii_type == "AADHAAR":
        val = value.replace(' ', '')
        return f"XXXX XXXX {val[-4:]}"
    if pii_type == "PAN":
        return f"{value[:3]}**{value[-2:]}"
    if pii_type == "MOBILE":
        return f"{value[:2]}*****{value[-3:]}"
    if pii_type == "BANK_ACCOUNT":
        return f"{'*' * (len(value)-4)}{value[-4:]}"
    if len(value) > 6:
        return f"{value[:2]}{'*' * (len(value) - 4)}{value[-2:]}"
    return "***"

def detect_patterns(text: str):
    """Run all regex patterns and return matches"""
    results = []
    for pii_type, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            value = match.group()
            # Get surrounding context
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            context = text[start:end].replace(value, f"[{pii_type}]")
            results.append({
                "pii_type": pii_type,
                "value": value,
                "masked_value": mask_value(value, pii_type),
                "start": match.start(),
                "end": match.end(),
                "context": context
            })
    return results
