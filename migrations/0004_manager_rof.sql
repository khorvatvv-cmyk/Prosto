-- 0004: АРМ менеджера, организации, кампании, задачи, аудит

CREATE TABLE IF NOT EXISTS offices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  office_id INTEGER NOT NULL,
  inn TEXT NOT NULL UNIQUE,
  name TEXT,
  manager_id INTEGER,
  service_status TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TEXT,
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS organization_users (
  organization_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  membership_status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS client_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  previous_manager_id INTEGER,
  new_manager_id INTEGER,
  changed_by INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (previous_manager_id) REFERENCES users(id),
  FOREIGN KEY (new_manager_id) REFERENCES users(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS manager_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  client_user_id INTEGER NOT NULL,
  manager_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (client_user_id) REFERENCES users(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS manager_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES manager_conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  office_id INTEGER,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  short_text TEXT,
  full_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'info',
  action_type TEXT,
  action_label TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  target_status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (office_id) REFERENCES offices(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  delivered_at TEXT,
  opened_at TEXT,
  clicked_at TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  manager_task_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS manager_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER,
  user_id INTEGER,
  manager_id INTEGER,
  source TEXT NOT NULL DEFAULT 'manual',
  source_request_id INTEGER,
  source_campaign_id INTEGER,
  description TEXT NOT NULL,
  diagnosis TEXT,
  expected_result TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  next_step TEXT,
  next_step_date TEXT,
  result TEXT,
  result_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

ALTER TABLE requests ADD COLUMN organization_id INTEGER;
ALTER TABLE requests ADD COLUMN client_user_id INTEGER;
ALTER TABLE requests ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE requests ADD COLUMN return_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE requests ADD COLUMN manager_task_id INTEGER;
ALTER TABLE requests ADD COLUMN out_of_l1_reason TEXT;
ALTER TABLE requests ADD COLUMN result_check_method TEXT;

CREATE INDEX IF NOT EXISTS idx_org_inn ON organizations(inn);
CREATE INDEX IF NOT EXISTS idx_org_manager ON organizations(manager_id);
CREATE INDEX IF NOT EXISTS idx_org_users_status ON organization_users(membership_status);
CREATE INDEX IF NOT EXISTS idx_conv_client ON manager_conversations(client_user_id);
CREATE INDEX IF NOT EXISTS idx_conv_manager ON manager_conversations(manager_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON manager_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_user ON campaign_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_manager ON manager_tasks(manager_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_requests_org ON requests(organization_id);
