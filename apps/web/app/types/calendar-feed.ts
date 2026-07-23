export type CalendarFeed = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type CalendarExportFilters = {
  start: string;
  end: string;
  timezone: string;
  projectId?: string;
};

export type CalendarFeedCreation = {
  data: CalendarFeed;
  feedPath: string;
};
