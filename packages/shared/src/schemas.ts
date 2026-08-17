import { z } from "zod";
import {
  ROLES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  VENDOR_STATUSES,
  LOCATION_STATUSES,
  LOCATION_TYPES,
  EVENT_TYPES,
  EVENT_STATUSES,
  NOTE_CATEGORIES,
} from "./enums";

export const moneyMinor = z
  .number()
  .int("Amount must be a whole number")
  .min(0, "Amount cannot be negative");

export const optionalMoneyMinor = moneyMinor.optional();

export const onboardingSchema = z.object({
  weddingName: z.string().min(2, "Give your wedding a name").max(120),
  partnerOneName: z.string().min(1, "Partner one name is required").max(80),
  partnerTwoName: z.string().max(80).optional().or(z.literal("")),
  weddingDate: z.string().min(1, "Wedding date is required"),
  location: z.string().max(200).optional(),
  currency: z.string().length(3).default("AED"),
  estimatedGuestCount: z.number().int().min(0).max(10000).optional(),
  totalBudgetMinor: moneyMinor.default(0),
  weddingType: z.string().max(60).optional(),
  planningStage: z.string().max(60).optional(),
  timezone: z.string().max(60).default("Asia/Dubai"),
});

export const weddingUpdateSchema = z.object({
  weddingName: z.string().min(2).max(120).optional(),
  partnerOneName: z.string().min(1).max(80).optional(),
  partnerTwoName: z.string().max(80).optional(),
  weddingDate: z.string().optional(),
  timezone: z.string().max(60).optional(),
  currency: z.string().length(3).optional(),
  estimatedGuestCount: z.number().int().min(0).max(10000).optional(),
  totalBudgetMinor: moneyMinor.optional(),
  weddingType: z.string().max(60).optional(),
  location: z.string().max(200).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  dueDate: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  estimatedCostMinor: optionalMoneyMinor,
  actualCostMinor: optionalMoneyMinor,
  vendorId: z.string().optional().or(z.literal("")),
  eventId: z.string().optional().or(z.literal("")),
});

export const taskUpdateSchema = taskSchema.partial();

export const expenseSchema = z.object({
  name: z.string().min(1, "Expense name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  vendorId: z.string().optional().or(z.literal("")),
  estimatedMinor: moneyMinor,
  actualMinor: optionalMoneyMinor,
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  receiptUrl: z.string().url().optional().or(z.literal("")),
});

export const expenseUpdateSchema = expenseSchema.partial();

export const paymentSchema = z.object({
  vendorId: z.string().optional().or(z.literal("")),
  expenseId: z.string().optional().or(z.literal("")),
  amountMinor: moneyMinor,
  paymentDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(PAYMENT_STATUSES).default("unpaid"),
  method: z.enum(PAYMENT_METHODS).default("bank_transfer"),
  reference: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const paymentUpdateSchema = paymentSchema.partial();

export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(200),
  category: z.string().min(1).max(80),
  contactName: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  instagram: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  priceMinor: optionalMoneyMinor,
  status: z.enum(VENDOR_STATUSES).default("researching"),
  rating: z.number().min(0).max(5).optional(),
  meetingDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export const vendorUpdateSchema = vendorSchema.partial();

export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required").max(200),
  type: z.enum(LOCATION_TYPES).default("venue"),
  address: z.string().max(300).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactName: z.string().max(120).optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
  capacity: z.number().int().min(0).optional(),
  estimatedCostMinor: optionalMoneyMinor,
  actualCostMinor: optionalMoneyMinor,
  status: z.enum(LOCATION_STATUSES).default("researching"),
  visitDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  images: z.array(z.string().url()).max(20).default([]),
  parking: z.boolean().optional(),
  catering: z.boolean().optional(),
  decoration: z.boolean().optional(),
  accommodation: z.boolean().optional(),
});

export const locationUpdateSchema = locationSchema.partial();

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(200),
  type: z.enum(EVENT_TYPES).default("ceremony"),
  date: z.string().min(1, "Event date is required"),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  locationId: z.string().optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  dressCode: z.string().max(200).optional().or(z.literal("")),
  guestCount: z.number().int().min(0).optional(),
  status: z.enum(EVENT_STATUSES).default("planned"),
});

export const eventUpdateSchema = eventSchema.partial();

export const noteSchema = z.object({
  title: z.string().min(1, "Note title is required").max(200),
  content: z.string().max(20000).default(""),
  category: z.enum(NOTE_CATEGORIES).default("general"),
});

export const noteUpdateSchema = noteSchema.partial();

export const invitationSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(ROLES).refine((r) => r !== "owner", {
    message: "A wedding can only have one owner",
  }),
});

export const attachmentSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().url(),
  mimeType: z.string().max(100),
  size: z.number().int().min(0).max(10 * 1024 * 1024),
  kind: z.enum(["image", "document"]),
});

export const budgetUpdateSchema = z.object({
  totalBudgetMinor: moneyMinor.optional(),
});

export const budgetCategorySchema = z.object({
  name: z.string().min(1).max(80),
  plannedMinor: moneyMinor.default(0),
});

export const categoryNameSchema = z.object({
  name: z.string().min(1, "Category name is required").max(80),
});

export const memberRoleSchema = z.object({
  role: z.enum(ROLES).refine((r) => r !== "owner", {
    message: "Ownership cannot be transferred",
  }),
});
