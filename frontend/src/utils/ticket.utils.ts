import type { TicketPriority, TicketType } from "@/types/ticket.types";

export const priorityConfig: Record<
  TicketPriority,
  { label: string; color: string; bg: string }
> = {
  LOW: { label: "Low", color: "text-priority-low", bg: "bg-priority-low/10" },
  MEDIUM: {
    label: "Medium",
    color: "text-priority-medium",
    bg: "bg-priority-medium/10",
  },
  HIGH: {
    label: "High",
    color: "text-priority-high",
    bg: "bg-priority-high/10",
  },
  URGENT: {
    label: "Urgent",
    color: "text-priority-urgent",
    bg: "bg-priority-urgent/10",
  },
};

export const typeConfig: Record<TicketType, { label: string; color: string }> =
  {
    TASK: { label: "Task", color: "text-blue-500" },
    BUG: { label: "Bug", color: "text-red-500" },
    STORY: { label: "Story", color: "text-violet-500" },
    EPIC: { label: "Epic", color: "text-orange-500" },
  };

export const roleBadgeVariant: Record<
  string,
  "primary" | "success" | "warning" | "danger" | "default"
> = {
  OWNER: "primary",
  ADMIN: "warning",
  MEMBER: "default",
};

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
