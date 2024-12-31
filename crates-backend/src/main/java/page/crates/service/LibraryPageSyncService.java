package page.crates.service;

import org.springframework.data.domain.Page;
import page.crates.entity.Library;
import page.crates.entity.SpotifyUser;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.api.LibraryAlbum;

public interface LibraryPageSyncService {
    boolean processPage(Page<LibraryAlbum> albumPage, SpotifyUser user, Library library);

    void processRemovals(Page<page.crates.entity.LibraryAlbum> libraryAlbumPage,
                         SpotifyUser user,
                         Context context);
}
