/**
 * Backfills currency/rate/base-snapshot fields on legacy money records.
 * Every pre-existing amount is treated as AED (the old single-currency world).
 * Idempotent: only touches records missing the `currency` field.
 *
 *   MONGODB_URI='<atlas uri>' node --import tsx scripts/ci/backfill-currency.mjs
 */
import mongoose from "mongoose";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error("Set MONGODB_URI.");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
const { Expense, Payment, Vendor, Task, Location } = await import(
  "../../apps/api/src/models/index.js"
);

const filter = { currency: { $exists: false } };

const jobs = [
  [
    Expense,
    {
      baseEstimatedMinor: { $ifNull: ["$estimatedMinor", null] },
      baseActualMinor: { $ifNull: ["$actualMinor", null] },
    },
  ],
  [
    Payment,
    {
      baseAmountMinor: { $ifNull: ["$amountMinor", null] },
    },
  ],
  [
    Vendor,
    {
      basePriceMinor: { $ifNull: ["$priceMinor", null] },
    },
  ],
  [
    Task,
    {
      baseEstimatedCostMinor: { $ifNull: ["$estimatedCostMinor", null] },
      baseActualCostMinor: { $ifNull: ["$actualCostMinor", null] },
    },
  ],
  [
    Location,
    {
      baseEstimatedCostMinor: { $ifNull: ["$estimatedCostMinor", null] },
      baseActualCostMinor: { $ifNull: ["$actualCostMinor", null] },
    },
  ],
];

for (const [model, fields] of jobs) {
  const result = await model.updateMany(filter, [
    {
      $set: {
        currency: "AED",
        rate: 1,
        ...fields,
      },
    },
  ]);
  console.log(`${model.modelName}: backfilled ${result.modifiedCount}`);
}

await mongoose.disconnect();
console.log("backfill complete");
