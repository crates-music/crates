package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.controller.api.LibraryAlbumFilter;
import page.crates.entity.Library;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;
import page.crates.spotify.client.api.Album;

public interface LibraryService {
    Library findOrCreateLibrary(SpotifyUser user);

    Page<Album> getAlbums(Pageable pageable);

    Library getLibrary(SpotifyUser user);

    Page<LibraryAlbum> getLibraryAlbums(Pageable pageable);

    Library save(Library library);

    Page<LibraryAlbum> searchLibraryAlbums(String search, Pageable pageable, LibraryAlbumFilter... filters);
}
