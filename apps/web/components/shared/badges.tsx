import { Badge } from "@/components/ui/badge";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  VENDOR_STATUS_LABELS,
  LOCATION_STATUS_LABELS,
} from "@/lib/labels";
import type {
  TaskPriority,
  TaskStatus,
  ExpensePaymentStatus,
  PaymentStatus,
  VendorStatus,
  LocationStatus,
} from "@wedding/shared";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const variant =
    priority === "urgent"
      ? "red"
      : priority === "high"
        ? "amber"
        : priority === "medium"
          ? "blue"
          : "default";
  return <Badge variant={variant as never}>{TASK_PRIORITY_LABELS[priority]}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variant =
    status === "completed"
      ? "green"
      : status === "in_progress"
        ? "blue"
        : status === "cancelled"
          ? "outline"
          : "default";
  return <Badge variant={variant as never}>{TASK_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: ExpensePaymentStatus | PaymentStatus }) {
  const variant =
    status === "paid"
      ? "green"
      : status === "partial"
        ? "blue"
        : status === "overdue"
          ? "red"
          : "amber";
  return <Badge variant={variant as never}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const variant =
    status === "booked"
      ? "green"
      : status === "shortlisted"
        ? "gold"
        : status === "rejected"
          ? "red"
          : status === "completed"
            ? "blue"
            : "default";
  return <Badge variant={variant as never}>{VENDOR_STATUS_LABELS[status]}</Badge>;
}

export function LocationStatusBadge({ status }: { status: LocationStatus }) {
  const variant =
    status === "booked"
      ? "green"
      : status === "shortlisted"
        ? "gold"
        : status === "rejected"
          ? "red"
          : status === "visited"
            ? "blue"
            : "default";
  return <Badge variant={variant as never}>{LOCATION_STATUS_LABELS[status]}</Badge>;
}
