CREATE TABLE IF NOT EXISTS generations (
    id                BIGSERIAL PRIMARY KEY,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    iteration         TEXT        NOT NULL,
    mode              TEXT        NOT NULL,
    toolset           TEXT,
    schema_name       TEXT,
    system_facts      TEXT,
    max_new_tokens    INTEGER     NOT NULL DEFAULT 512,
    model             TEXT        NOT NULL,
    prompt            TEXT        NOT NULL,
    response          JSONB       NOT NULL,
    function_calls    JSONB,
    suppressed_calls  JSONB,
    record            JSONB,
    reasoning         TEXT,
    confidence        REAL,
    success           BOOLEAN     NOT NULL DEFAULT TRUE,
    error             TEXT,
    error_code        TEXT,
    latency_ms        INTEGER     NOT NULL,
    roundtrip_ms      INTEGER     NOT NULL,
    prefill_tps       REAL,
    decode_tps        REAL,
    est_output_tokens INTEGER
);

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_mode       ON generations (mode);
CREATE INDEX IF NOT EXISTS idx_generations_toolset    ON generations (toolset);
CREATE INDEX IF NOT EXISTS idx_generations_schema     ON generations (schema_name);
