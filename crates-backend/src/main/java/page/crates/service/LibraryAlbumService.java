package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.entity.Album;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;

import java.time.Instant;

public interface LibraryAlbumService {
    LibraryAlbum create(Album album, SpotifyUser spotifyUser, Instant addedAt);

    LibraryAlbum findByAlbumAndUser(Album album, SpotifyUser spotifyUser);

    Page<LibraryAlbum> findByUser(SpotifyUser spotifyUser, Pageable pageable);

    void markCrated(Album album, SpotifyUser spotifyUser);

    LibraryAlbum save(LibraryAlbum libraryAlbum);
}
