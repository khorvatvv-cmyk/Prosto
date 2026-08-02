-- 0003: L1 specialist workflow

ALTER TABLE requests ADD COLUMN assigned_to INTEGER;
ALTER TABLE requests ADD COLUMN l1_transferred_at TEXT;
ALTER TABLE requests ADD COLUMN l1_taken_at TEXT;
ALTER TABLE requests ADD COLUMN last_message_at TEXT;
ALTER TABLE requests ADD COLUMN result_message TEXT;

ALTER TABLE messages ADD COLUMN is_internal INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_requests_assigned ON requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_status_level ON requests(status, level);
