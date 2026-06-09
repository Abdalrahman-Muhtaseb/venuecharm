-- ─── 010_pg_cron_complete_bookings.sql ───────────────────────────────────────
-- Enables pg_cron and schedules a job that flips CONFIRMED bookings to
-- COMPLETED every 5 minutes once their end_at has passed.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if present (safe when job doesn't exist — returns 0 rows)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'complete-ended-bookings';

SELECT cron.schedule(
  'complete-ended-bookings',
  '*/5 * * * *',
  $cron$
    UPDATE bookings
    SET status = 'COMPLETED'
    WHERE status = 'CONFIRMED'
      AND end_at < NOW();
  $cron$
);
