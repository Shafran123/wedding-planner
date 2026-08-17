import type {
  TaskPriority,
  TaskStatus,
  ExpensePaymentStatus,
  PaymentStatus,
  PaymentMethod,
  VendorStatus,
  LocationStatus,
  LocationType,
  EventType,
  EventStatus,
  NoteCategory,
  Role,
  NotificationType,
} from "@wedding/shared";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  partner: "Partner",
  planner: "Planner",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full access, including members and wedding settings.",
  partner: "Can edit all planning data, budget and payments.",
  planner: "Can manage tasks, vendors and events.",
  viewer: "Read-only access.",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PAYMENT_STATUS_LABELS: Record<ExpensePaymentStatus | PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  online: "Online",
  other: "Other",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  researching: "Researching",
  contacted: "Contacted",
  meeting: "Meeting",
  shortlisted: "Shortlisted",
  booked: "Booked",
  rejected: "Rejected",
  completed: "Completed",
};

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  researching: "Researching",
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  visited: "Visited",
  booked: "Booked",
  rejected: "Rejected",
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ceremony: "Ceremony",
  reception: "Reception",
  bridal_prep: "Bridal Preparation",
  groom_prep: "Groom Preparation",
  hotel: "Hotel",
  photography: "Photography Location",
  transport_pickup: "Transportation Pickup",
  after_party: "After-Party",
  honeymoon: "Honeymoon Location",
  venue: "Venue",
  other: "Other",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  engagement: "Engagement",
  nikah: "Nikah",
  mehendi: "Mehendi",
  sangeet: "Sangeet",
  ceremony: "Wedding Ceremony",
  reception: "Reception",
  after_party: "After Party",
  brunch: "Brunch",
  honeymoon: "Honeymoon",
  other: "Other",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  general: "General Note",
  vendor: "Vendor Note",
  venue: "Venue Note",
  idea: "Wedding Idea",
  shopping_list: "Shopping List",
  meeting: "Meeting Notes",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_due_soon: "Task due soon",
  task_overdue: "Task overdue",
  payment_due: "Payment due",
  payment_overdue: "Payment overdue",
  budget_exceeded: "Budget alert",
  wedding_milestone: "Milestone",
  event_upcoming: "Event coming up",
};

export function labelFor(map: Record<string, string>, key: string | undefined): string {
  if (!key) return "—";
  return map[key] ?? key;
}
