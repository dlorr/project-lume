import * as yup from "yup";
import type { TicketType, TicketPriority } from "@/types/ticket.types";

export const createTicketSchema = yup.object({
  title: yup
    .string()
    .required("Title is required")
    .max(255, "Must be at most 255 characters"),

  description: yup.string().optional(),

  type: yup
    .string<TicketType>()
    .oneOf(["TASK", "BUG", "STORY", "EPIC"])
    .optional(),

  priority: yup
    .string<TicketPriority>()
    .oneOf(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional(),

  assigneeId: yup.string().optional(),
});

export type CreateTicketFormValues = yup.InferType<typeof createTicketSchema>;
