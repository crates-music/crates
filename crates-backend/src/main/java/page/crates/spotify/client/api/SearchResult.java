package page.crates.spotify.client.api;

import java.io.Serializable;

public class SearchResult implements Serializable {
    private static final long serialVersionUID = 8427267749642784459L;
    private Page<Artist> artists;
    private Page<Album> albums;
    private Page<Track> tracks;
    private Page<Playlist> playlists;

    public Page<Album> getAlbums() {
        return albums;
    }

    public Page<Artist> getArtists() {
        return artists;
    }

    public Page<Playlist> getPlaylists() {
        return playlists;
    }

    public Page<Track> getTracks() {
        return tracks;
    }

    public void setAlbums(Page<Album> albums) {
        this.albums = albums;
    }

    public void setArtists(Page<Artist> artists) {
        this.artists = artists;
    }

    public void setPlaylists(Page<Playlist> playlists) {
        this.playlists = playlists;
    }

    public void setTracks(Page<Track> tracks) {
        this.tracks = tracks;
    }
}
