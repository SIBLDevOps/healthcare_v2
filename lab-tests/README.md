# BeyondSure – Lab Tests module (static front-end)

Complete, clickable front-end for the **multi-lab marketplace** Lab Tests flow, built from
`../lab-tests-flow-documentation.txt`. HTML + CSS + vanilla JS + Bootstrap 5.3 — no build step.
All data comes from dummy JS files through a Promise-based mock API (`LT.api`).

## How to run
Double-click `lab-tests/index.html` (works on `file://`), or open it from any static server.
The site's home page (`../index.html`) already links here.

**Demo shortcuts**
- OTP is always **123456** (demo account: **9876543210 – Riya Malhotra**, with 5 family members).
- Login popup has **Login / Register** tabs. Register asks full name, date of birth (18+), gender, mobile, optional email
  and consent, then OTP – this becomes the complete "Self" profile. A new number on the Login tab switches to Register.
- **Demo tools** button (bottom-left on every page): login as demo user (with family) / logout,
  **New user (fresh login – only Self, no family)** – logs in instantly with a new number, toggle mode, fail next API
  call, payment result (success / failed / processing), advance booking status, mark a
  prescription as identified, reset demo data, jump to any page. Hide with `?demo=0`.
- "Reset demo data" link is also in the footer.
- Profile menu → **Family Members**: view every member (age, gender, mobile, email, tests in cart), add, edit or remove.

## Theme
Reuses the website theme `../assets/css/style.css`: the same site header and footer, dotted hero
band, tag pills, large section titles and gradient pill buttons as the home and doctor pages.
`assets/css/lab.css` only adds Lab-Tests components; its `--lt-*` tokens map onto the site's
brand variables (`--primary`, `--navy`, …). The lab cart is separate from the shop basket
(header eyedropper icon → `cart.html`).

## Folder structure
```
lab-tests/
  index.html                 Phase 1-4  one location popup (with collection method) + landing
  prescription-upload.html   Phase 6    upload pages + details → popup → My Prescription Requests
  my-requests.html                      prescription requests + confirm → cart
  search.html                Phase 7    search, chips, filters, tests / packages
  test-detail.html?id=       Phase 7    test detail
  packages.html              Phase 7    packages + detail drawer + overlap rule
  cart.html                  Phase 8-10 cart grouped by family member (tests per person, add test for X, add / edit member)
  compare-labs.html          Phase 11   the "Lab" step: your lab + the same tests at other labs, Select & Continue
                                        (partial-lab popup: Cancel / Continue)
  location.html              Phase 12   address (home) / centre confirmation
  slot.html                  Phase 13   date & slot
  summary.html               Phase 14   summary, coupons, bill, payment
  confirmation.html?id=                 booking confirmed (.ics, invoice, share)
  appointments.html          Phase 15
  appointment-detail.html?id= Phase 15-18, 20, 21 timeline, reschedule, cancel, feedback…
  reports.html / report-view.html?id=   Phase 19   PDF reports: list (name / View / Download) + PDF viewer
  assets/css/lab.css
  assets/js/core/   store, api, pricing, matching, cart, members-ui (add for Self, member form),
                    lab-picker (lab side-bar "Choose a lab" after the first Add), ui, layout, guards,
                    report-pdf (demo PDF report + View / Download helpers)
  assets/js/data/   cities, tests, packages, labs, members, addresses, slots, coupons,
                    bookings, reports, requests, ocr
  assets/js/pages/  one script per page
```
HTML files are thin shells; header, footer, stepper, cart bar and modals are injected by
`layout.js` / `ui.js`, and every page renders from `LT.api` results.

## Suggested demo path
1. `index.html` → pick location (Use my current location → Wakad 411057) → Home Collection.
2. Book Lab Test → Search & Select → click **Add** on CBC → *Login to continue* (OTP 123456) → added for Riya (no member
   popup). Tapping **Added** removes it (Undo). Members are chosen in the **Lab Cart**: tap Karan's card to book all tests
   for him, or use the member chips on each test; PSA is greyed out for women.
   On the FIRST test the **lab side-bar** opens: small cards with the price at every lab that does
   the test → *Select* (the side-bar closes, you stay on the page; every test card shows the lab name top-right; later
   tests use this lab without asking) → Cart → **Compare labs**: your lab's "Tests & prices" drop-down (member names per test) on top, other
   labs below (each with its own drop-down; Metro Path Labs shows "2 of 3 tests" when B12 is in the cart) →
   *Select & Continue* → popup (Cancel stays / Continue removes B12) → Address → Slot → Summary → Pay.
3. Cart: tests are grouped per person → Members / Remove per test, "Add test for Rajesh", tap another family member
   chip to book for them, edit a profile → Continue to Compare labs → Address → Slot → Summary (try CARE15 / EXPIRED10) → Pay
   (set Failed first to see retry) → Confirmation.
4. Appointments → open a booking → Advance status (demo) → reports, feedback, repeat order.
5. Prescription: Upload Prescription → add all pages + details → Submit → popup "our team will connect with you" →
   My Prescription Requests (use Demo tools → "Mark request as identified" to simulate the call) → confirm → cart.

## Assumptions
- Every test in the cart belongs to at least one family member (`assignments`); adding always asks who it is for.
  A new account has only "Self" (Demo tools → New user). Bookings, requests and reports are per account.
- Service is available only in **Pune and Mumbai** (`LT.data.servedCities`). Pincodes 411057 / 411045 / 411038 /
  400001 / 400069 serve both modes, 411014 home only, 411005 centre only. Every other city in the search
  (Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Ahmedabad, Dhule, Nashik, Nagpur, Jaipur) and any unlisted
  pincode shows "Service not available at your location" with a Change location button.
  A saved location that is no longer served is caught on the home page and by the `location` guard.
- MRP is the same at every lab; only the selling price changes (`price × lab.priceFactor`).
- Diagnostic tests are GST-exempt, so taxes show ₹0. Collection charge is once per booking.
- A booking is created as `PENDING_PAYMENT` and becomes `CONFIRMED` on successful payment;
  "Pay at collection/centre" confirms immediately.
- Slots: 13 one-hour windows a day – Morning 05:00 AM – 12:00 PM and Afternoon & Evening 12:00 – 07:00 PM
  (no 3–4 PM slot) – for every lab, mode and group size;
  same-day slots need 2 hours' notice and a chosen slot is held for 10 minutes.
- Seeded members, addresses and reports belong to the demo account; a new mobile number gets its
  own "Self" member.
- "Aarogya Pathology" is *pending*, so it is not listed (6 live Pune labs). The lab-partner / admin demo pages were removed.
- Imaging tests (Ultrasound, X-Ray, ECG) are centre-only and blocked in home mode.

## How to make this dynamic
- Replace each `LT.api.*` body in `core/api.js` with a `fetch()` to a REST endpoint — keep the
  function names and return shapes, pages need no rewrite.
- Replace the localStorage store (`core/store.js`) with a server cart/session; keep the
  `LT.store` interface (`get / set / subscribe / clearBooking`).
- `data/*.js` become database tables; their field lists are the schema.
- Move `pricing.js` and `matching.js` (price, bill, coupon, lab ranking score, assignment
  validation) to the server; the client only displays results.
- Replace the OTP 123456 with real SMS OTP, the mock payment with the gateway; prescriptions go to a review queue where the team identifies tests (ocr.js stays unused)
