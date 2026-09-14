import db from '@adonisjs/lucid/services/db'
import type Publication from '#models/publication'
import ScheduledPublication from '#models/scheduled_publication'

/** Recover legacy partial deliveries without changing the approved content or enqueueing a job. */
export async function statusForRemainingNetwork(
  publication: Publication,
  network: Publication['targetNetworks'][number]
) {
  if (
    publication.status !== 'published' ||
    publication.approvedVersion !== publication.contentVersion ||
    !publication.targetNetworks.includes(network)
  )
    return publication.status

  const deliveries = await ScheduledPublication.query()
    .where('publicationId', publication.id)
    .where('publicationVersion', publication.contentVersion)
  const otherNetworkDelivered = deliveries.some(
    (delivery) => delivery.network !== network && delivery.status === 'published'
  )
  const networkAlreadyScheduled = deliveries.some((delivery) => delivery.network === network)
  return otherNetworkDelivered && !networkAlreadyScheduled ? 'scheduled' : publication.status
}

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
