export const CURRENCIES = [
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "LKR", label: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "SAR", label: "Saudi Riyal", symbol: "SAR" },
  { code: "QAR", label: "Qatari Riyal", symbol: "QAR" },
  { code: "KWD", label: "Kuwaiti Dinar", symbol: "KWD" },
  { code: "BHD", label: "Bahraini Dinar", symbol: "BHD" },
  { code: "OMR", label: "Omani Rial", symbol: "OMR" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "AED";

export const WEDDING_TYPES = [
  "traditional",
  "destination",
  "beach",
  "garden",
  "hotel",
  "religious",
  "civil",
  "other",
] as const;

export const DEFAULT_BUDGET_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Decoration",
  "Flowers",
  "Wedding Dress",
  "Groom Outfit",
  "Beauty",
  "Entertainment",
  "Music",
  "Transportation",
  "Invitations",
  "Cake",
  "Jewelry",
  "Accommodation",
  "Honeymoon",
  "Legal",
  "Miscellaneous",
] as const;

export const DEFAULT_TASK_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Decoration",
  "Flowers",
  "Music",
  "Entertainment",
  "Wedding Dress",
  "Groom Outfit",
  "Beauty",
  "Transportation",
  "Invitations",
  "Guests",
  "Honeymoon",
  "Legal",
  "Ceremony",
  "Reception",
  "Accommodation",
  "Other",
] as const;

export const VENDOR_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Florist",
  "Decorator",
  "DJ",
  "Band",
  "Makeup",
  "Hair",
  "Transport",
  "Cake",
  "Stationery",
  "Planner",
  "Entertainment",
  "Other",
] as const;

export interface TaskTemplate {
  title: string;
  category: string;
  /** Months before the wedding date the task is due. Negative not allowed. */
  offsetMonths: number;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { title: "Set your budget", category: "Venue", offsetMonths: 12 },
  { title: "Create guest list", category: "Guests", offsetMonths: 12 },
  { title: "Research venues", category: "Venue", offsetMonths: 12 },
  { title: "Book venue", category: "Venue", offsetMonths: 10 },
  { title: "Hire wedding planner", category: "Other", offsetMonths: 11 },
  { title: "Research photographers", category: "Photography", offsetMonths: 10 },
  { title: "Research videographers", category: "Videography", offsetMonths: 10 },
  { title: "Book photographer", category: "Photography", offsetMonths: 9 },
  { title: "Book videographer", category: "Videography", offsetMonths: 9 },
  { title: "Choose wedding theme", category: "Decoration", offsetMonths: 9 },
  { title: "Start dress shopping", category: "Wedding Dress", offsetMonths: 9 },
  { title: "Book caterer", category: "Catering", offsetMonths: 8 },
  { title: "Book entertainment", category: "Entertainment", offsetMonths: 8 },
  { title: "Finalize guest list", category: "Guests", offsetMonths: 7 },
  { title: "Send save-the-dates", category: "Invitations", offsetMonths: 7 },
  { title: "Book transportation", category: "Transportation", offsetMonths: 6 },
  { title: "Order outfits", category: "Wedding Dress", offsetMonths: 6 },
  { title: "Plan honeymoon", category: "Honeymoon", offsetMonths: 6 },
  { title: "Send invitations", category: "Invitations", offsetMonths: 4 },
  { title: "Finalize menu", category: "Catering", offsetMonths: 4 },
  { title: "Finalize decoration", category: "Decoration", offsetMonths: 4 },
  { title: "Plan seating", category: "Reception", offsetMonths: 3 },
  { title: "Book beauty services", category: "Beauty", offsetMonths: 3 },
  { title: "Confirm all vendors", category: "Other", offsetMonths: 2 },
  { title: "Finalize guest count", category: "Guests", offsetMonths: 2 },
  { title: "Prepare payments", category: "Other", offsetMonths: 2 },
  { title: "Plan wedding rehearsal", category: "Ceremony", offsetMonths: 1 },
  { title: "Prepare emergency kit", category: "Other", offsetMonths: 1 },
  { title: "Confirm transportation", category: "Transportation", offsetMonths: 1 },
  { title: "Confirm day-of timeline", category: "Ceremony", offsetMonths: 1 },
  { title: "Final payment checks", category: "Other", offsetMonths: 1 },
  { title: "Final venue confirmation", category: "Venue", offsetMonths: 0 },
  { title: "Confirm vendors one last time", category: "Other", offsetMonths: 0 },
  { title: "Prepare documents", category: "Legal", offsetMonths: 0 },
  { title: "Pack wedding items", category: "Other", offsetMonths: 0 },
];
