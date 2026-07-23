import type { Pool } from "pg";
import type {
  EmailNotificationRecord,
  NotificationRepository,
} from "./types.js";

type NotificationRow = {
  id: string;
  type: string;
  payload_json: EmailNotificationRecord["payload"];
  email: string;
  display_name: string;
  email_status: EmailNotificationRecord["emailStatus"];
};

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async findForEmail(id: string) {
    const result = await this.pool.query<NotificationRow>(
      `SELECT n.id, n.type, n.payload_json, n.email_status, u.email, u.display_name
       FROM notifications n
       INNER JOIN users u ON u.id = n.user_id
       WHERE n.id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row
      ? {
          id: row.id,
          type: row.type,
          payload: row.payload_json,
          recipientEmail: row.email,
          recipientName: row.display_name,
          emailStatus: row.email_status,
        }
      : null;
  }

  async recordAttempt(id: string, attempt: number, errorName: string) {
    await this.pool.query(
      `UPDATE notifications
       SET email_attempts = GREATEST(email_attempts, $2), email_last_error = $3
       WHERE id = $1`,
      [id, attempt, errorName.slice(0, 240)],
    );
  }

  async markSent(id: string, attempt: number) {
    await this.pool.query(
      `UPDATE notifications
       SET email_status = 'sent', email_attempts = GREATEST(email_attempts, $2),
           email_last_error = NULL, emailed_at = NOW()
       WHERE id = $1`,
      [id, attempt],
    );
  }

  async markFailed(id: string, attempt: number, errorName: string) {
    await this.pool.query(
      `UPDATE notifications
       SET email_status = 'failed', email_attempts = GREATEST(email_attempts, $2),
           email_last_error = $3
       WHERE id = $1`,
      [id, attempt, errorName.slice(0, 240)],
    );
  }
}
