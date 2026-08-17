# Integer minor units for money

All monetary amounts are stored and computed as integer minor units (AED 1,500.00 → `150000`), with the currency attached to the Wedding. Formatting to display units happens only at the UI boundary.

**Considered Options**

- Floating-point numbers — simpler to read and write, but cumulative rounding errors corrupt financial math (budget totals, payment sums, percentage alerts).
- Integer minor units — chosen. All arithmetic is exact; alerts and totals are derived by integer addition and comparison.

**Consequences**

- Every amount field in the API and database is an integer; the API rejects non-integer or negative amounts.
- Once financial data exists, migrating to another representation is a full data rewrite — treat this as irreversible.
- Currency-specific minor-unit exponents (e.g. zero-decimal currencies) are out of scope; all supported currencies use two decimal places.
