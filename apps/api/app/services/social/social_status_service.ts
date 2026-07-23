import db from '@adonisjs/lucid/services/db'

export async function markSocialScheduleFailed(scheduleId: string, publicationId: string) {
  await db.transaction(async (trx) => {
    await trx.from('scheduled_publications').where('id', scheduleId).update({ status: 'failed' })
    await trx.rawQuery(
      `UPDATE publications p
       SET status = CASE
         WHEN EXISTS (
           SELECT 1 FROM scheduled_publications active
           WHERE active.publication_id = p.id
             AND active.status IN ('queued', 'publishing')
         ) THEN 'scheduled'
         ELSE 'failed'
       END,
       updated_at = NOW()
       WHERE p.id = ?`,
      [publicationId]
    )
  })
}
