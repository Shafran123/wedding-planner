# Per-record currency snapshots with manual rates

Money records (expenses, payments, vendors, tasks, locations) may be entered in any supported currency (currently AED and LKR). Each record stores its original amount, its entry currency, the exchange rate used, and a converted **base-currency snapshot** computed by the server at write time (`base = round(original × rate)`). All budget totals and dashboard money are summed from the base snapshots.

**Considered Options**

- **Live conversion at read time** (recompute against a current rate whenever displayed) — rejected. Totals would silently drift as rates move; budget history, alerts, and "remaining" figures would not be reproducible.
- **Live rate API** (frankfurter.dev) — rejected. The supported pair (AED/LKR) is not fully covered by the provider (LKR is not published), so every entry would still need manual intervention.
- **Per-record snapshot with manual rates** — chosen. The rate is captured once at entry time; the wedding remembers the last-used rate per currency and prefills forms. Changing the Wedding's base currency requires an explicit rate and re-denominates every stored base amount, category plan, and the total budget.

**Consequences**

- Budget arithmetic remains exact integer math on base snapshots; no rounding drift accumulates in totals.
- Historical amounts are immutable in meaning — a rate change later never rewrites the past.
- Data written before this decision (single-currency AED amounts) is backfilled once: `currency=AED`, `rate=1`, base snapshot = original amount.
- Currencies beyond AED and LKR require schema-level enum updates plus a manual rate for every entry.
