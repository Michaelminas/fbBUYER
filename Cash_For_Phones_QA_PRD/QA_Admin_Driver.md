# QA Test Cases — Admin & Driver

## TC-101: Admin – View and Filter Leads
**Objective:** Ensure lead table and filters work  
**Steps:**  
1. Log into admin dashboard  
2. Search for lead by email  
3. Filter by “Verified” status  
**Expected Result:**  
- Lead visible with correct quote + slot  
**Priority:** Medium

## TC-102: Admin – Finalize Payout
**Objective:** Confirm payout entry and completion flow  
**Steps:**  
1. Open scheduled appointment  
2. Enter payout value  
3. Mark as completed  
**Expected Result:**  
- Status = Completed  
- Receipt emailed if split case  
**Priority:** High

## TC-103: Driver – View Assigned Jobs
**Objective:** Confirm job details are visible to driver  
**Steps:**  
1. Log in as driver  
2. View today’s assignments  
3. Tap into job  
**Expected Result:**  
- Show device, damage summary, location, time  
**Priority:** High

## TC-104: Driver – Mark Inspection & Payment
**Objective:** Ensure on-site workflow is working  
**Steps:**  
1. Open assigned job  
2. Tap “Arrived” → “Inspected” → “Paid”  
3. Select cash or PayID  
**Expected Result:**  
- Status transitions complete  
- No receipt unless 50/50  
**Priority:** High