# QA Test Cases — Edge & Failure Scenarios

## TC-201: Quote Rejected — Missing Base Price
**Objective:** Ensure fallback behavior if no base price exists  
**Steps:**  
1. Attempt to quote a new or rare iPhone model not in catalog  
2. Submit quote  
**Expected Result:**  
- Error or fallback message shown  
- Suggest manual contact  
**Priority:** High

## TC-202: Pickup Fee — Exceeds Max Cap
**Objective:** Confirm pickup fee caps at $50  
**Steps:**  
1. Enter pickup address >50 km away  
2. Submit quote  
**Expected Result:**  
- Pickup fee = $50  
- Final payout shows deduction  
**Priority:** High

## TC-203: Token Abuse — Reuse Attempt
**Objective:** Confirm single-use verification token cannot be reused  
**Steps:**  
1. Submit quote and verify email  
2. Try verifying again using the same token  
**Expected Result:**  
- Reuse is blocked  
- Token marked as consumed  
**Priority:** Medium

## TC-204: Over-Damage — Floor Enforced
**Objective:** Ensure device with excessive damage still returns $50 minimum  
**Steps:**  
1. Quote old device with multiple damages  
2. Force low-value outcome  
**Expected Result:**  
- Final payout = $50  
- “Floor applied” label visible  
**Priority:** High

## TC-205: Duplicate Leads — Auto-Merge
**Objective:** Prevent duplicates from polluting database  
**Steps:**  
1. Submit quote for same device/email twice  
2. Check database entries  
**Expected Result:**  
- Leads merged  
- Latest details kept  
- Earliest creation date retained  
**Priority:** Medium

## TC-206: Invalid IMEI or Blacklisted User
**Objective:** Handle fraud scenario with known bad data  
**Steps:**  
1. Submit quote with blacklisted IMEI or email  
2. Try to schedule pickup  
**Expected Result:**  
- System blocks lead  
- Admin receives alert  
**Priority:** High

## TC-207: Drop-off Suggestion for Ineligible Lead
**Objective:** Show fallback path for rejected pickups  
**Steps:**  
1. Quote device outside 60 km or >60 min ETA  
2. Submit  
**Expected Result:**  
- Pickup denied  
- Drop-off suggestion + “Request manual review” visible  
**Priority:** High

## TC-208: Rounding to $5 (Cash Handling)
**Objective:** Ensure all payouts round down to nearest $5  
**Steps:**  
1. Generate quote resulting in $247  
**Expected Result:**  
- Final payout = $245  
**Priority:** High