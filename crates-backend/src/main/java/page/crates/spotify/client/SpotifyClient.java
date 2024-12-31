package page.crates.spotify.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import page.crates.spotify.client.api.Album;
import page.crates.spotify.client.api.Artist;
import page.crates.spotify.client.api.FollowRequest;
import page.crates.spotify.client.api.LibraryAlbum;
import page.crates.spotify.client.api.Page;
import page.crates.spotify.client.api.Playlist;
import page.crates.spotify.client.api.PlaylistFollowRequest;
import page.crates.spotify.client.api.SearchResult;
import page.crates.spotify.client.api.Track;
import page.crates.spotify.client.api.User;

import java.util.List;

@FeignClient(name = "spotify-client")
public interface SpotifyClient {
    @RequestMapping(value = "/me/albums", method = RequestMethod.PUT)
    void addAlbumsToLibrary(@RequestBody List<String> ids);

    @RequestMapping(value = "/me/tracks", method = RequestMethod.PUT)
    void addTracksToLibrary(@RequestBody List<String> ids);

    @RequestMapping(value = "/me/following", method = RequestMethod.PUT)
    void followEntity(@RequestParam("type") String type, @RequestBody FollowRequest request);

    @RequestMapping(value = "/playlists/{id}/followers", method = RequestMethod.PUT)
    void followPlaylist(@PathVariable("id") String id, @RequestBody PlaylistFollowRequest request);

    @RequestMapping(value = "/albums/{id}", method = RequestMethod.GET)
    Album getAlbum(@PathVariable("id") String id);

    @RequestMapping(value = "/artists/{id}", method = RequestMethod.GET)
    Artist getArtist(@PathVariable("id") String id);

    @RequestMapping(value = "/me", method = RequestMethod.GET)
    User getCurrentUser();

    @RequestMapping(value = "/playlists/{id}", method = RequestMethod.GET)
    Playlist getPlaylist(@PathVariable("id") String id);

    @RequestMapping(value = "/tracks/{id}", method = RequestMethod.GET)
    Track getTrack(@PathVariable("id") String id);

    @RequestMapping(value = "/me/albums/contains", method = RequestMethod.GET)
    List<Boolean> libraryContainsAlbums(@RequestParam("ids") String ids);

    @RequestMapping(value = "/search")
    SearchResult search(@RequestParam("q") String query,
                        @RequestParam("type") String type,
                        @RequestParam("offset") int offset,
                        @RequestParam("limit") int limit);

    @RequestMapping(value = "/me/albums", method = RequestMethod.GET)
    Page<LibraryAlbum> getSavedAlbums(@RequestParam("offset") int offset,
                                      @RequestParam("limit") int limit);

    @RequestMapping(value = "/me/tracks", method = RequestMethod.GET)
    Page<Album> getSavedTracks(@RequestParam("offset") int offset,
                               @RequestParam("limit") int limit);
}
