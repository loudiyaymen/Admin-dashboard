-- dummy data to test reports features
-- ============================================================
-- init.sql — reports schema + dummy data
-- matches the corrected getAll / getOne routes
-- ============================================================

-- Drop tables if re-running (order matters — child first)
DROP TABLE IF EXISTS report_attachments;
DROP TABLE IF EXISTS reports;

-- ============================================================
-- reports
-- ============================================================
CREATE TABLE reports (
    id          SERIAL PRIMARY KEY,

    -- type is an ENUM so the DB itself enforces valid values
    -- matches your getAll whitelist: lost_item / damaged_vehicle / safety_concern / sexual_violence
    type        TEXT NOT NULL CHECK (type IN (
                    'lost_item',
                    'damaged_vehicle',
                    'safety_concern',
                    'sexual_violence'
                )),

    description TEXT,

    -- optional pin drop — floor_id is which floor, position is {x,y} on a floor map
    floor_id    INTEGER,
    position    JSONB,                      -- e.g. {"x": 120, "y": 340}

    -- status lifecycle: new → in_review → resolved
    status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
                    'new',
                    'in_review',
                    'resolved'
                )),

    -- NO name / email / user_id stored — by design
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- report_attachments
-- ============================================================
CREATE TABLE report_attachments (
    id                  SERIAL PRIMARY KEY,
    report_id           INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

    -- the key used to retrieve the file from object storage (e.g. S3 / Supabase Storage)
    object_storage_key  TEXT NOT NULL,

    mime_type           TEXT,               -- e.g. image/jpeg, application/pdf
    size                INTEGER,            -- bytes

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- dummy reports — one per type, varied statuses + floors
-- ============================================================
INSERT INTO reports (type, description, floor_id, position, status, created_at)
VALUES
    (
        'lost_item',
        'Blue backpack left near the elevator on floor 2',
        2,
        '{"x": 210, "y": 145}'::JSONB,
        'new',
        NOW() - INTERVAL '2 hours'
    ),
    (
        'damaged_vehicle',
        'White sedan with cracked windshield in parking lot B, space 14',
        NULL,    -- no floor pin for outdoor/parking
        NULL,
        'in_review',
        NOW() - INTERVAL '1 day'
    ),
    (
        'safety_concern',
        'Broken stairwell light on floor 3 — stairwell is very dark',
        3,
        '{"x": 90, "y": 310}'::JSONB,
        'in_review',
        NOW() - INTERVAL '3 days'
    ),
    (
        'sexual_violence',
        'Incident reported near washrooms on floor 1 — details submitted verbally',
        1,
        '{"x": 340, "y": 200}'::JSONB,
        'new',
        NOW() - INTERVAL '30 minutes'
    ),
    (
        'lost_item',
        'AirPods case found at library study area, floor 4',
        4,
        '{"x": 500, "y": 88}'::JSONB,
        'resolved',
        NOW() - INTERVAL '5 days'
    ),
    (
        'safety_concern',
        'Fire exit door on floor 2 is blocked by storage boxes',
        2,
        '{"x": 60, "y": 420}'::JSONB,
        'resolved',
        NOW() - INTERVAL '7 days'
    );

-- ============================================================
-- dummy attachments — tied to specific reports above
-- ============================================================
INSERT INTO report_attachments (report_id, object_storage_key, mime_type, size, created_at)
VALUES
    -- report 1 (lost_item backpack) — one photo
    (1, 'reports/1/backpack-photo.jpg',       'image/jpeg',       204800,  NOW() - INTERVAL '2 hours'),

    -- report 3 (safety_concern stairwell) — one photo
    (3, 'reports/3/stairwell-dark.jpg',       'image/jpeg',       318000,  NOW() - INTERVAL '3 days'),

    -- report 4 (sexual_violence) — PDF form submitted
    (4, 'reports/4/intake-form.pdf',          'application/pdf',  54000,   NOW() - INTERVAL '29 minutes'),

    -- report 5 (lost_item AirPods) — two attachments
    (5, 'reports/5/airpods-found-front.jpg',  'image/jpeg',       189000,  NOW() - INTERVAL '5 days'),
    (5, 'reports/5/airpods-found-back.jpg',   'image/jpeg',       173000,  NOW() - INTERVAL '5 days');
