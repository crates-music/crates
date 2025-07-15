package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.ai.SimpleLibraryAlbum;
import page.crates.controller.api.LibraryAlbumFilter;
import page.crates.entity.Library;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;
import page.crates.spotify.client.api.Album;

import java.util.List;

public interface LibraryService {
    Library findOrCreateLibrary(SpotifyUser user);

    Page<Album> getAlbums(Pageable pageable);

    Library getLibrary(SpotifyUser user);

    Page<LibraryAlbum> getLibraryAlbums(Pageable pageable);

    Library save(Library library);

    Page<LibraryAlbum> searchLibraryAlbums(String search, Pageable pageable, LibraryAlbumFilter... filters);
    
    /**
     * Get user's recent library albums in simplified format for AI analysis
     * @param userId The Spotify user ID
     * @param limit Maximum number of albums to return (default 100)
     * @return List of simplified album data (artist, album, year)
     */
    List<SimpleLibraryAlbum> getRecentLibraryAlbumsForAI(String userId, int limit);
}
