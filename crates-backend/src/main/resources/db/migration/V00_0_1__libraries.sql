CREATE TABLE IF NOT EXISTS library
(
    id              SERIAL,
    spotify_user_id BIGINT      NOT NULL,
    state           VARCHAR(64) NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (spotify_user_id) REFERENCES spotify_user (id),
    CONSTRAINT uk_library_spotify_user_id UNIQUE (spotify_user_id)
);

CREATE TABLE IF NOT EXISTS library_album
(
    id              SERIAL,
    album_id        BIGINT      NOT NULL,
    spotify_user_id BIGINT      NOT NULL,
    state           VARCHAR(64) NOT NULL,
    added_at        TIMESTAMP   NOT NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at     TIMESTAMP   NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (spotify_user_id) REFERENCES spotify_user (id),
    FOREIGN KEY (album_id) REFERENCES album (id),
    CONSTRAINT uk_library_album_user_album UNIQUE (album_id, spotify_user_id)
);