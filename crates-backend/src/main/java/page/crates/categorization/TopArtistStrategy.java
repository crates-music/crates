package page.crates.categorization;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import page.crates.entity.Album;
import page.crates.entity.Artist;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Categorize albums by top artists (create "Best of [Artist]" crates)
 */
@Slf4j
@Component
public class TopArtistStrategy implements CategoryStrategy {

    private static final int MIN_ALBUMS_PER_ARTIST = 8;
    private static final int MAX_ARTIST_CRATES = 3;

    @Override
    public List<CrateProposal> analyze(List<Album> albums) {
        log.info("Running TopArtistStrategy on {} albums", albums.size());

        // Count albums per artist
        // Use Map<Long, Album> where key is album ID to prevent duplicates
        Map<Artist, Map<Long, Album>> artistToAlbums = new HashMap<>();

        for (Album album : albums) {
            if (album.getArtists() != null && !album.getArtists().isEmpty()) {
                // Add album to each artist (handle collaborative albums)
                for (Artist artist : album.getArtists()) {
                    // Only add if album ID not already added for this artist
                    artistToAlbums
                            .computeIfAbsent(artist, k -> new HashMap<>())
                            .putIfAbsent(album.getId(), album);
                }
            }
        }

        // Find top artists (sorted by album count)
        List<Map.Entry<Artist, Map<Long, Album>>> topArtists = artistToAlbums.entrySet().stream()
                .filter(entry -> entry.getValue().size() >= MIN_ALBUMS_PER_ARTIST)
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .limit(MAX_ARTIST_CRATES)
                .collect(Collectors.toList());

        // Create proposals for top artists
        List<CrateProposal> proposals = new ArrayList<>();

        for (Map.Entry<Artist, Map<Long, Album>> entry : topArtists) {
            Artist artist = entry.getKey();
            List<Album> artistAlbums = new ArrayList<>(entry.getValue().values());

            CrateProposal proposal = CrateProposal.builder()
                    .name("Best of " + artist.getName())
                    .albums(artistAlbums)
                    .strategy(CrateProposal.CategorizationStrategy.TOP_ARTIST)
                    .priority(calculatePriority(artistAlbums))
                    .publicCrate(true)
                    .build();

            proposals.add(proposal);
            log.debug("Created top artist proposal: {} with {} albums",
                    artist.getName(), artistAlbums.size());
        }

        log.info("TopArtistStrategy generated {} proposals", proposals.size());
        return proposals;
    }

    /**
     * Calculate priority (slightly higher than genre/decade to ensure top artists are featured)
     */
    private double calculatePriority(List<Album> albums) {
        return albums.size() * 1.2;
    }
}
