# QA Test Cases — Customer Flow

## TC-001: Generate Instant Quote (Unlocked Device)
**Objective:** Verify quote generation with standard model and damage selection  
**Steps:**  
1. Open quote page  
2. Select “iPhone 13 Pro”, 256GB  
3. Select 2 damages (e.g. screen + back glass)  
4. Enter pickup address within 10 km  
5. Submit  
**Expected Result:**  
- Instant quote displays correctly with:  
  - Base price  
  - Damage deduction  
  - Pickup fee = $0 (free)  
  - Final payout ≥ $50  
  - Validity = 7 days  
**Priority:** High

## TC-002: Activation Locked Device Quote
**Objective:** Verify locked-tier pricing and fee deduction  
**Steps:**  
1. Quote an “iPhone 13 Pro Max”  
2. Mark as “Activation Locked”  
3. Set address = 22 km from hub  
4. Submit  
**Expected Result:**  
- Fixed payout = $150  
- Pickup fee = $30  
- Final payout = $120  
**Priority:** High

## TC-003: Email Verification Flow
**Objective:** Confirm token system with 15-minute TTL  
**Steps:**  
1. Submit quote with valid email  
2. Click email token link  
3. Wait >15 minutes  
4. Attempt to verify  
**Expected Result:**  
- Success if verified within 15 min  
- Expired token error after 15 min  
**Priority:** High

## TC-004: Calendar Scheduling Post-Verification
**Objective:** Verify scheduling unlock and slot booking  
**Steps:**  
1. Complete quote + verify email  
2. View calendar  
3. Select future day + time (not same day)  
4. Confirm booking  
**Expected Result:**  
- Scheduling allowed  
- Appointment confirmation shown  
- Quote is locked  
**Priority:** High

## TC-005: Quote Floor Enforcement
**Objective:** Ensure $50 floor is enforced post-deductions  
**Steps:**  
1. Select device with low base value  
2. Select multiple damages  
3. Add long-distance pickup (e.g. 45 km)  
**Expected Result:**  
- Quote total ≥ $50  
- Floor applied and noted  
**Priority:** High