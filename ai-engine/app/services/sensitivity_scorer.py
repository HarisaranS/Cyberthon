TYPE_WEIGHTS = {
    "AADHAAR": 100, "BIOMETRIC": 100, "HEALTH": 95, "CASTE_RELIGION": 95,
    "SEXUAL_ORIENTATION": 95, "PAN": 90, "BANK_ACCOUNT": 85, "CREDIT_CARD": 88, 
    "FINANCIAL": 82, "PASSPORT": 82, "VOTER_ID": 78, "DRIVING_LICENSE": 75, 
    "GSTIN": 60, "MOBILE": 52, "EMAIL": 42, "NAME": 35, "ADDRESS": 45, 
    "DOB": 60, "PIN_CODE": 25, "UPI": 70, "IFSC": 70
}

def score(detections: list, context: dict = {}) -> dict:
    if not detections:
        return {"risk_score": 0, "sensitivity_level": "public", "tier": 5}
    
    # Base weight is highest PII type weight found
    base = max(TYPE_WEIGHTS.get(d.get("pii_type", "").upper(), 30) for d in detections)
    
    # Apply context multipliers (additive, capped at 100)
    score_val = base
    if context.get("unencrypted"): score_val += 20
    if context.get("internet_exposed"): score_val += 30
    if context.get("no_consent"): score_val += 25
    if context.get("retention_expired"): score_val += 15
    if context.get("children_data"): score_val += 20
    if context.get("cross_border"): score_val += 15
    if context.get("bulk_storage"): score_val += 10

    score_val = min(100, round(score_val))
    
    # Map to sensitivity Level
    if score_val >= 80:
        level, tier = "sensitive_personal", 1
    elif score_val >= 40:
        level, tier = "personal", 2
    elif score_val >= 10:
        level, tier = "internal", 3
    else:
        level, tier = "public", 4
    
    recs = []
    if score_val >= 80: recs.append("Immediate encryption and access restriction required (DPDPA Section 8)")
    if score_val >= 40: recs.append("Verify valid consent and purpose limitation")
    if context.get("no_consent"): recs.append("Critical: Data processed without documented consent")
    if context.get("retention_expired"): recs.append("Delete data: retention period exceeded")
    if level == "sensitive_personal": recs.append("Review for Data Protection Impact Assessment (DPIA) requirement")
    
    return {
        "risk_score": score_val,
        "sensitivity_level": level,
        "tier": tier,
        "recommendations": recs
    }
