CREATE TABLE feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL REFERENCES spotify_user(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
