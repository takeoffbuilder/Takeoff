# Monthly Reporting CSV (Admin Feature)

This feature generates a 41-field CSV for credit reporting / downstream processing.

## Access

GET `/api/admin/reports/monthly-csv?year=YYYY&month=M`

Requires an authenticated Supabase user whose email is in `ADMIN_EMAILS` (comma‑separated) env var.

## Field Order (41)

1-6 Address: Street Address 1, Street Address 2, City, State, ZIP, Country Code (always US)
7-13 Personal: Last Name, First Name, Middle Initial, Generation Code, SSN (masked **\*-**-1234), DOB (MM/DD/YYYY), Phone (digits)
14-18 Account: Consumer Account ID (unique ≤7 digits), Credit Limit, Highest Credit Limit, Date Account Opened, Date Account Closed
19-23 Payment: Current Balance (placeholder), Amount Past Due, Date of Last Payment, Actual Payment Amount, Scheduled Payment Amount
24-28 Financial Constants: Portfolio Type=R, Account Type=7, Terms Duration=Rev, Terms Frequency=M, Interest Type=F
29-37 Blank placeholders: Identification Number, Special Comment, Compliance Condition Code, Date of Account Information, Date of First Delinquency, Residence Code, Address Indicator, Consumer Information Indicator, Original Charge Off
38-41 Mapped: Account Status (11 active, 13 closed), Payment Rating (blank or 1 on failure), Payment History Profile (blank), ECOA (1 individual)

## Data Sources

- `user_personal_info`: name, DOB, masked SSN last 4, phone, address fields, middle_initial, generation_code.
- `user_booster_accounts`: credit_limit, highest_credit_limit (backfilled if null), created_at, closed_at, consumer_account_id (auto-assigned if missing), status, monthly_amount.
- `payments`: latest record per booster account for last payment date/amount and payment status (completed/failed).

## Schema Additions

Migration adds:

- `user_booster_accounts.consumer_account_id` (unique int <10,000,000)
- `user_booster_accounts.highest_credit_limit`
- `user_booster_accounts.closed_at`
- `user_personal_info.middle_initial`
- `user_personal_info.generation_code`

Run migration then invoke `select public.backfill_highest_credit_limit();` once to seed highest limits.

## Extending

- Add real balance & past due logic when a ledger table exists.
- Implement 24‑month payment history profile and map Metro2 codes.
- Add more ECOA variations if joint accounts introduced.
- Month/year filtering: currently returns all accounts; apply date window on `created_at` or `payments.created_at` per business rule.

## Example Curl

```
curl -H "Authorization: Bearer <SUPABASE_SESSION_ACCESS_TOKEN>" \
  "http://localhost:3000/api/admin/reports/monthly-csv?year=2025&month=11" \
  -o monthly-report.csv
```

Ensure the access token corresponds to an email in `ADMIN_EMAILS`.
