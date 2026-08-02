-- 0006: точечные аудитории кампаний и защита от повторной доставки

ALTER TABLE campaigns ADD COLUMN target_mode TEXT NOT NULL DEFAULT 'all_my';

CREATE TABLE IF NOT EXISTS campaign_targets (
  campaign_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id, organization_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_targets_org ON campaign_targets(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_delivery_unique ON campaign_deliveries(campaign_id, user_id);

UPDATE campaigns
SET target_mode = 'all_system'
WHERE author_id IN (SELECT id FROM users WHERE role IN ('rof', 'admin'));
