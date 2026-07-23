import type { EmailNotificationRecord, RenderedEmail } from "./types.js";

const labels: Record<string, string> = {
  "publication.comment_created": "Un nouveau commentaire est disponible.",
  "publication.review_approved": "Une publication a été approuvée.",
  "publication.review_changes_requested": "Des corrections ont été demandées.",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class UnsupportedNotificationError extends Error {
  override name = "UnsupportedNotificationError";
}

export function renderNotificationEmail(
  notification: EmailNotificationRecord,
  webAppUrl: string,
): RenderedEmail {
  const activity = labels[notification.type];
  if (!activity || !notification.payload.publicationId) {
    throw new UnsupportedNotificationError(
      "Type de notification non pris en charge.",
    );
  }
  const name = escapeHtml(notification.recipientName);
  const url = new URL(
    `/publications/${notification.payload.publicationId}`,
    webAppUrl,
  ).toString();
  const safeUrl = escapeHtml(url);
  return {
    to: notification.recipientEmail,
    subject: "Nouvelle activité sur Wepost.pro",
    text: `Bonjour ${notification.recipientName},\n\n${activity}\n\nConsulter la publication : ${url}\n`,
    html: `<!doctype html><html lang="fr"><body><main><h1>Nouvelle activité</h1><p>Bonjour ${name},</p><p>${escapeHtml(activity)}</p><p><a href="${safeUrl}">Consulter la publication</a></p></main></body></html>`,
  };
}
