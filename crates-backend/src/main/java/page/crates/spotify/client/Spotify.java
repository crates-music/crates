package page.crates.spotify.client;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.spotify.client.api.Album;
import page.crates.spotify.client.api.Artist;
import page.crates.spotify.client.api.LibraryAlbum;
import page.crates.spotify.client.api.Playlist;
import page.crates.spotify.client.api.Track;
import page.crates.spotify.client.api.User;

import java.util.List;

/**
 * Main interface for interacting
 * with spotify's API.
 */
public interface Spotify {
    void addAlbumsToLibrary(Context context, List<String> ids);

    void addTracksToLibrary(Context context, List<String> ids);

    void followArtists(Context context, List<String> ids);

    void followPlaylist(Context context, String id);

    void followUsers(Context context, List<String> ids);

    Album getAlbum(Context context, String id);

    Artist getArtist(Context context, String id);

    User getCurrentUser(Context context);

    Playlist getPlaylist(Context context, String id);

    Page<Album> getSavedAlbums(Context context, Pageable pageable);

    Page<LibraryAlbum> getSavedLibraryAlbums(Context context, Pageable pageable);

    Track getTrack(Context context, String id);

    Page<Album> searchAlbums(Context context, String query, Pageable pageable);

    List<Boolean> libraryContainsAlbums(Context context, List<String> ids);
}
