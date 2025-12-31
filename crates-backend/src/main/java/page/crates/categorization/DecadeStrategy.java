package page.crates.categorization;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import page.crates.entity.Album;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Categorize albums by decade (1970s, 1980s, 1990s, 2000s, 2010s, 2020s)
 */
@Slf4j
@Component
public class DecadeStrategy implements CategoryStrategy {

    private static final int MIN_ALBUMS_PER_CRATE = 8;
    private static final int CURRENT_YEAR = 2025;

    @Override
    public List<CrateProposal> analyze(List<Album> albums) {
        log.info("Running DecadeStrategy on {} albums", albums.size());

        // Group albums by decade
        Map<String, List<Album>> albumsByDecade = albums.stream()
                .filter(album -> album.getReleaseDate() != null)
                .collect(Collectors.groupingBy(this::getDecadeLabel));

        // Create proposals for decades with sufficient albums
        List<CrateProposal> proposals = new ArrayList<>();

        for (Map.Entry<String, List<Album>> entry : albumsByDecade.entrySet()) {
            String decade = entry.getKey();
            List<Album> decadeAlbums = entry.getValue();

            // Only create crate if we have enough albums
            if (decadeAlbums.size() >= MIN_ALBUMS_PER_CRATE) {
                CrateProposal proposal = CrateProposal.builder()
                        .name(decade)
                        .albums(decadeAlbums)
                        .strategy(CrateProposal.CategorizationStrategy.DECADE)
                        .priority(calculatePriority(decadeAlbums))
                        .publicCrate(true)
                        .build();

                proposals.add(proposal);
                log.debug("Created decade proposal: {} with {} albums", decade, decadeAlbums.size());
            } else {
                log.debug("Skipping decade {} with only {} albums (need {})",
                        decade, decadeAlbums.size(), MIN_ALBUMS_PER_CRATE);
            }
        }

        log.info("DecadeStrategy generated {} proposals", proposals.size());
        return proposals;
    }

    /**
     * Get decade label for an album (e.g., "1990s", "2000s", "New Releases 2025")
     */
    private String getDecadeLabel(Album album) {
        int year = Instant.ofEpochMilli(album.getReleaseDate().toEpochMilli())
                .atZone(ZoneId.systemDefault())
                .getYear();

        // Handle classic/vintage music (pre-1950)
        if (year < 1950) {
            return "Classic & Vintage";
        }

        // Handle current year separately
        if (year >= CURRENT_YEAR) {
            return "New Releases " + year;
        }

        // Calculate decade (1990-1999 -> "1990s")
        int decade = (year / 10) * 10;
        return decade + "s";
    }

    /**
     * Calculate priority based on number of albums (more albums = higher priority)
     */
    private double calculatePriority(List<Album> albums) {
        // Base priority on album count
        double basePriority = albums.size() * 1.0;

        // Boost priority for iconic decades (80s, 90s, 2000s)
        if (albums.size() > 0) {
            String decade = getDecadeLabel(albums.get(0));
            if (decade.equals("1980s") || decade.equals("1990s") || decade.equals("2000s")) {
                basePriority *= 1.2; // 20% boost for popular decades
            }
        }

        return basePriority;
    }
}
