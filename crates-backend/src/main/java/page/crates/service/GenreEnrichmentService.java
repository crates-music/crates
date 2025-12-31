package page.crates.service;

import page.crates.entity.Album;
import page.crates.entity.Artist;

import java.util.List;
import java.util.Map;

/**
 * Service for genre enrichment (currently a no-op since genres come from Spotify)
 * Kept for backward compatibility with existing auto-categorize flow
 */
public interface GenreEnrichmentService {

    /**
     * No-op enrichment - genres now come directly from Spotify
     *
     * @param album Album to enrich
     * @return Album unchanged
     */
    Album enrichAlbumGenres(Album album);

    /**
     * No-op enrichment - genres now come directly from Spotify
     *
     * @param artist Artist to enrich
     * @return Artist unchanged
     */
    Artist enrichArtistGenres(Artist artist);

    /**
     * No-op bulk enrichment - all albums marked as successful
     *
     * @param albums Albums to enrich
     * @return Map of album ID to success status (all true)
     */
    Map<Long, Boolean> bulkEnrichAlbums(List<Album> albums);

    /**
     * Check if album already has sufficient genre data
     *
     * @param album Album to check
     * @return true if album has 3+ genres
     */
    boolean hasSufficientGenres(Album album);
}
