import type { Status } from "./status.types";
import type { Ticket } from "./ticket.types";

export interface StatusWithTickets extends Status {
  tickets: Ticket[];
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  statuses: StatusWithTickets[];
}
