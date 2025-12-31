package page.crates.external.musicbrainz;

import page.crates.entity.Album;
import page.crates.entity.Artist;

import java.util.List;

/**
 * Service for enriching albums and artists with genre data from MusicBrainz (fallback)
 */
public interface MusicBrainzService {

    /**
     * Get genre tags for an album from MusicBrainz
     * @param album Album entity with name and artists
     * @return List of genre names
     */
    List<String> getAlbumGenres(Album album);

    /**
     * Get genre tags for an artist from MusicBrainz
     * @param artist Artist entity with name
     * @return List of genre names
     */
    List<String> getArtistGenres(Artist artist);
}
