
CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  page_url TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  meta TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_email ON leads(email);
