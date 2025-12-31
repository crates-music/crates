package page.crates.external.lastfm;

import page.crates.entity.Album;
import page.crates.entity.Artist;

import java.util.List;

/**
 * Service for enriching albums and artists with genre data from Last.fm
 */
public interface LastFmService {

    /**
     * Get genre tags for an album from Last.fm
     * @param album Album entity with name and artists
     * @return List of genre names
     */
    List<String> getAlbumGenres(Album album);

    /**
     * Get genre tags for an artist from Last.fm
     * @param artist Artist entity with name
     * @return List of genre names
     */
    List<String> getArtistGenres(Artist artist);
}
