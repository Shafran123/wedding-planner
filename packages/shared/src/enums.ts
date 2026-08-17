export const ROLES = ["owner", "partner", "planner", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const EXPENSE_PAYMENT_STATUSES = ["unpaid", "partial", "paid", "overdue"] as const;
export type ExpensePaymentStatus = (typeof EXPENSE_PAYMENT_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "overdue"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "online", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const VENDOR_STATUSES = [
  "researching",
  "contacted",
  "meeting",
  "shortlisted",
  "booked",
  "rejected",
  "completed",
] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const LOCATION_STATUSES = [
  "researching",
  "shortlisted",
  "contacted",
  "visited",
  "booked",
  "rejected",
] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export const LOCATION_TYPES = [
  "ceremony",
  "reception",
  "bridal_prep",
  "groom_prep",
  "hotel",
  "photography",
  "transport_pickup",
  "after_party",
  "honeymoon",
  "venue",
  "other",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const EVENT_TYPES = [
  "engagement",
  "nikah",
  "mehendi",
  "sangeet",
  "ceremony",
  "reception",
  "after_party",
  "brunch",
  "honeymoon",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["planned", "confirmed", "completed", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const NOTE_CATEGORIES = [
  "general",
  "vendor",
  "venue",
  "idea",
  "shopping_list",
  "meeting",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const INVITATION_STATUSES = ["pending", "accepted", "declined", "expired"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "task_due_soon",
  "task_overdue",
  "payment_due",
  "payment_overdue",
  "budget_exceeded",
  "wedding_milestone",
  "event_upcoming",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const ACTIVITY_TYPES = [
  "task_created",
  "task_updated",
  "task_completed",
  "task_deleted",
  "expense_created",
  "expense_updated",
  "expense_deleted",
  "payment_created",
  "payment_updated",
  "payment_paid",
  "payment_deleted",
  "budget_updated",
  "vendor_created",
  "vendor_updated",
  "vendor_deleted",
  "location_created",
  "location_updated",
  "event_created",
  "event_updated",
  "note_created",
  "note_updated",
  "member_invited",
  "member_joined",
  "member_removed",
  "wedding_updated",
  "attachment_added",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ATTACHMENT_KINDS = ["image", "document"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];
