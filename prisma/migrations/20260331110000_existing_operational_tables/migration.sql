CREATE TABLE IF NOT EXISTS admin_credentials (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_credentials_username_key
    ON admin_credentials (username);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    alert_type TEXT,
    message TEXT NOT NULL,
    severity TEXT,
    campus_id TEXT,
    building_id TEXT,
    starts_at TIMESTAMP(3),
    ends_at TIMESTAMP(3),
    created_by_admin_id TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT,
    severity TEXT,
    campus_id TEXT,
    building_id TEXT,
    published_at TIMESTAMP(3),
    expires_at TIMESTAMP(3),
    created_by_admin_id TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buildings (
    building_id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL,
    code TEXT,
    name TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floors (
    floor_id TEXT PRIMARY KEY,
    building_id TEXT NOT NULL,
    floor_number INTEGER,
    floor_label TEXT,
    elevation_meters DOUBLE PRECISION,
    map_asset_key TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sos_events (
    sos_event_id TEXT PRIMARY KEY,
    device_installation_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP(3),
    estimated_floor_id TEXT
);
