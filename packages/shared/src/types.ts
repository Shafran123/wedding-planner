import type {
  Role,
  TaskStatus,
  TaskPriority,
  ExpensePaymentStatus,
  PaymentStatus,
  PaymentMethod,
  VendorStatus,
  LocationStatus,
  LocationType,
  EventType,
  EventStatus,
  NoteCategory,
  InvitationStatus,
  NotificationType,
  ActivityType,
  AttachmentKind,
} from "./enums";

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wedding {
  id: string;
  ownerId: string;
  weddingName: string;
  partnerOneName: string;
  partnerTwoName: string;
  weddingDate: string;
  timezone: string;
  currency: string;
  estimatedGuestCount?: number;
  totalBudgetMinor: number;
  weddingType?: string;
  location?: string;
  coverImageUrl?: string;
  plan?: string;
  subscriptionStatus?: string;
  rates?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  weddingId: string;
  userId: string;
  role: Role;
  displayName: string;
  email: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  weddingId: string;
  email: string;
  role: Role;
  token: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface TaskCategory {
  id: string;
  weddingId: string;
  name: string;
  taskCount?: number;
  createdAt: string;
}

export interface BudgetCategory {
  id: string;
  weddingId: string;
  name: string;
  plannedMinor: number;
  expenseCount?: number;
  createdAt: string;
}

export interface Task {
  id: string;
  weddingId: string;
  title: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  assigneeName?: string;
  estimatedCostMinor?: number;
  actualCostMinor?: number;
  currency?: string;
  rate?: number;
  baseEstimatedCostMinor?: number;
  baseActualCostMinor?: number;
  vendorId?: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Expense {
  id: string;
  weddingId: string;
  categoryId?: string;
  categoryName?: string;
  vendorId?: string;
  vendorName?: string;
  name: string;
  description?: string;
  estimatedMinor: number;
  actualMinor?: number;
  currency?: string;
  rate?: number;
  baseEstimatedMinor?: number;
  baseActualMinor?: number;
  status: "active" | "cancelled";
  paymentStatus: ExpensePaymentStatus;
  dueDate?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  weddingId: string;
  vendorId?: string;
  vendorName?: string;
  expenseId?: string;
  expenseName?: string;
  amountMinor: number;
  currency?: string;
  rate?: number;
  baseAmountMinor?: number;
  paymentDate?: string;
  dueDate: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  weddingId: string;
  name: string;
  category: string;
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  address?: string;
  priceMinor?: number;
  currency?: string;
  rate?: number;
  basePriceMinor?: number;
  status: VendorStatus;
  rating?: number;
  meetingDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  weddingId: string;
  name: string;
  type: LocationType;
  address?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  capacity?: number;
  estimatedCostMinor?: number;
  actualCostMinor?: number;
  currency?: string;
  rate?: number;
  baseEstimatedCostMinor?: number;
  baseActualCostMinor?: number;
  status: LocationStatus;
  visitDate?: string;
  notes?: string;
  images: string[];
  selectedVenue?: boolean;
  parking?: boolean;
  catering?: boolean;
  decoration?: boolean;
  accommodation?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  weddingId: string;
  name: string;
  type: EventType;
  date: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  locationName?: string;
  description?: string;
  dressCode?: string;
  guestCount?: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  weddingId: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  weddingId: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  uploadedBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  weddingId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  weddingId: string;
  actorId: string;
  actorName: string;
  type: ActivityType;
  entityType: string;
  entityId?: string;
  message: string;
  createdAt: string;
}

export interface BudgetAlert {
  level: "info" | "warning" | "critical" | "exceeded";
  message: string;
}

export interface BudgetTotals {
  totalBudgetMinor: number;
  plannedMinor: number;
  committedMinor: number;
  paidMinor: number;
  remainingMinor: number;
  percentUsed: number;
  alerts: BudgetAlert[];
}

export interface CategorySpend {
  categoryId: string;
  name: string;
  plannedMinor: number;
  spentMinor: number;
  overspentByMinor: number;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  passed: boolean;
  label: string;
}

export interface ProgressByCategory {
  categoryId: string;
  name: string;
  completed: number;
  total: number;
  percent: number;
}

export interface PlanningProgress {
  completed: number;
  total: number;
  percent: number;
  byCategory: ProgressByCategory[];
}

export interface Insight {
  kind: "budget" | "planning" | "payments" | "risk" | "info";
  message: string;
  actionUrl?: string;
}

export interface DashboardData {
  wedding: Wedding;
  role: Role;
  countdown: Countdown;
  budget: BudgetTotals;
  categorySpend: CategorySpend[];
  taskStats: { completed: number; total: number; overdue: number; dueThisWeek: number };
  progress: PlanningProgress;
  upcomingTasks: Task[];
  upcomingEvents: Event[];
  upcomingPayments: Payment[];
  recentActivity: Activity[];
  insights: Insight[];
  unreadNotifications: number;
}
