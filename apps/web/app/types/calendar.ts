import type {
  Publication,
  PublicationStatus,
  SocialNetwork,
} from "~/types/publication";

export type CalendarViewMode = "month" | "week" | "list";

export type CalendarEvent = Publication & {
  projectName: string;
  projectTimezone: string;
  clientId: string;
  clientName: string;
};

export type CalendarFilters = {
  start: string;
  end: string;
  timezone: string;
  projectId?: string;
  clientId?: string;
  network?: SocialNetwork | "";
  status?: PublicationStatus | "";
  includeUndated?: boolean;
  page?: number;
  perPage?: number;
};

export type CalendarResponse = {
  data: CalendarEvent[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    start: string;
    end: string;
    timezone: string;
    durationMs: number;
  };
  filters: {
    projects: Array<{
      id: string;
      name: string;
      clientId: string;
      timezone: string;
    }>;
    clients: Array<{ id: string; name: string }>;
  };
};
