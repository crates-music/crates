CREATE TABLE IF NOT EXISTS image
(
    id     SERIAL,
    url    VARCHAR(512) NOT NULL,
    width  INT          NULL,
    height INT          NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS token
(
    id            SERIAL,
    auth_token    VARCHAR(512)  NOT NULL,
    code          VARCHAR(1024) NOT NULL,
    access_token  VARCHAR(1024) NOT NULL,
    expiration    TIMESTAMP     NOT NULL,
    refresh_token VARCHAR(1024) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS spotify_user
(
    id           SERIAL,
    spotify_id   VARCHAR(40)  NOT NULL,
    country      VARCHAR(48)  NULL,
    href         VARCHAR(512) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    email        VARCHAR(128) NULL,
    spotify_uri  VARCHAR(255) NOT NULL,
    token_id     BIGINT       NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_spotify_user_spotify_id UNIQUE (spotify_id)
);

CREATE TABLE IF NOT EXISTS spotify_user_to_image
(
    spotify_user_id BIGINT NOT NULL,
    image_id        BIGINT NOT NULL,
    PRIMARY KEY (spotify_user_id, image_id),
    FOREIGN KEY (spotify_user_id) REFERENCES spotify_user (id),
    FOREIGN KEY (image_id) REFERENCES image (id)
);

CREATE TABLE IF NOT EXISTS genre
(
    id   SERIAL,
    name VARCHAR(128) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_genre_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS artist
(
    id          SERIAL,
    spotify_id  VARCHAR(40)  NOT NULL,
    spotify_uri VARCHAR(255) NOT NULL,
    name        VARCHAR(128) NOT NULL,
    popularity  INT          NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_artist_spotify_id UNIQUE (spotify_id)
);
CREATE INDEX idx_artist_name ON artist (name);

CREATE TABLE IF NOT EXISTS artist_to_genre
(
    artist_id BIGINT NOT NULL,
    genre_id  BIGINT NOT NULL,
    PRIMARY KEY (artist_id, genre_id),
    FOREIGN KEY (artist_id) REFERENCES artist (id),
    FOREIGN KEY (genre_id) REFERENCES genre (id)
);

CREATE TABLE IF NOT EXISTS artist_to_image
(
    artist_id BIGINT NOT NULL,
    image_id  BIGINT NOT NULL,
    PRIMARY KEY (artist_id, image_id),
    FOREIGN KEY (artist_id) REFERENCES artist (id),
    FOREIGN KEY (image_id) REFERENCES image (id)
);

CREATE TABLE IF NOT EXISTS album
(
    id           SERIAL,
    spotify_id   VARCHAR(40)  NOT NULL,
    upc          VARCHAR(32)  NOT NULL,
    href         VARCHAR(512) NOT NULL,
    name         VARCHAR(128) NOT NULL,
    popularity   INT          NOT NULL,
    release_date TIMESTAMP    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_album_spotify_id UNIQUE (spotify_id)
);
CREATE INDEX idx_album_upc ON album (upc);
CREATE INDEX idx_album_name ON album (name);


CREATE TABLE IF NOT EXISTS album_to_artist
(
    album_id  BIGINT NOT NULL,
    artist_id BIGINT NOT NULL,
    PRIMARY KEY (album_id, artist_id),
    FOREIGN KEY (album_id) REFERENCES album (id),
    FOREIGN KEY (artist_id) REFERENCES artist (id)
);

CREATE TABLE IF NOT EXISTS album_to_image
(
    album_id BIGINT NOT NULL,
    image_id BIGINT NOT NULL,
    PRIMARY KEY (album_id, image_id),
    FOREIGN KEY (album_id) REFERENCES album (id),
    FOREIGN KEY (image_id) REFERENCES image (id)
);

CREATE TABLE IF NOT EXISTS album_to_genre
(
    album_id BIGINT NOT NULL,
    genre_id BIGINT NOT NULL,
    PRIMARY KEY (album_id, genre_id),
    FOREIGN KEY (album_id) REFERENCES album (id),
    FOREIGN KEY (genre_id) REFERENCES genre (id)
);

CREATE TABLE IF NOT EXISTS crate
(
    id         SERIAL,
    name       VARCHAR(255) NOT NULL,
    handle     VARCHAR(64)  NOT NULL,
    user_id    BIGINT       NOT NULL,
    state      VARCHAR(64)  NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_crate_handle UNIQUE (handle),
    FOREIGN KEY (user_id) REFERENCES spotify_user (id)
);
CREATE INDEX idx_crate_user_id ON crate (user_id);

CREATE TABLE IF NOT EXISTS crate_album
(
    id         SERIAL,
    crate_id   BIGINT    NOT NULL,
    album_id   BIGINT    NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_crate_album UNIQUE (crate_id, album_id),
    FOREIGN KEY (crate_id) REFERENCES crate (id),
    FOREIGN KEY (album_id) REFERENCES album (id)
);