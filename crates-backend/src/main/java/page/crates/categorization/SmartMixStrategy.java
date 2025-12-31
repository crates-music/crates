package page.crates.categorization;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Component;
import page.crates.entity.Album;
import page.crates.entity.Genre;

import java.time.Instant;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Categorize albums by combining decade + genre for iconic combinations
 * (e.g., "90s Hip Hop", "80s Rock", "2000s Indie")
 */
@Slf4j
@Component
public class SmartMixStrategy implements CategoryStrategy {

    private static final int MIN_ALBUMS_PER_CRATE = 8;

    @Override
    public List<CrateProposal> analyze(List<Album> albums) {
        log.info("Running SmartMixStrategy on {} albums", albums.size());

        // Cross-tabulate decade × genre
        // Use Map<Long, Album> where key is album ID to prevent duplicates
        Map<String, Map<Long, Album>> mixCombinations = new HashMap<>();
        int albumsWithoutGenres = 0;

        for (Album album : albums) {
            if (album.getReleaseDate() == null) {
                continue;
            }

            String decade = getDecade(album);
            Set<String> genres = getConsolidatedGenres(album);

            if (genres.isEmpty()) {
                albumsWithoutGenres++;
            }

            for (String genre : genres) {
                String key = decade + "_" + genre;
                // Only add if album ID not already in this combo
                mixCombinations
                        .computeIfAbsent(key, k -> new HashMap<>())
                        .putIfAbsent(album.getId(), album);
            }
        }

        log.info("Found {} decade+genre combinations, {} albums missing genres",
                mixCombinations.size(), albumsWithoutGenres);

        // Create proposals for ALL combinations with enough albums
        List<CrateProposal> proposals = new ArrayList<>();

        for (Map.Entry<String, Map<Long, Album>> entry : mixCombinations.entrySet()) {
            String key = entry.getKey();
            List<Album> mixAlbums = new ArrayList<>(entry.getValue().values());

            // Create crate if we have enough albums - let the user decide what's interesting!
            if (mixAlbums.size() >= MIN_ALBUMS_PER_CRATE) {
                String[] parts = key.split("_");
                String decade = parts[0];
                String genre = parts[1];
                String crateName = decade + " " + genre;

                CrateProposal proposal = CrateProposal.builder()
                        .name(crateName)
                        .albums(mixAlbums)
                        .strategy(CrateProposal.CategorizationStrategy.SMART_MIX)
                        .priority(calculatePriority(mixAlbums))
                        .publicCrate(true)
                        .build();

                proposals.add(proposal);
                log.debug("Created smart mix proposal: {} with {} albums",
                        crateName, mixAlbums.size());
            }
        }

        log.info("SmartMixStrategy generated {} proposals from {} decade+genre combinations",
                proposals.size(), mixCombinations.size());
        return proposals;
    }

    /**
     * Get decade string (e.g., "1990s", "2000s")
     */
    private String getDecade(Album album) {
        int year = Instant.ofEpochMilli(album.getReleaseDate().toEpochMilli())
                .atZone(ZoneId.systemDefault())
                .getYear();

        int decade = (year / 10) * 10;
        return decade + "s";
    }

    /**
     * Get consolidated genres for album (from album + artists)
     */
    private Set<String> getConsolidatedGenres(Album album) {
        Set<String> genres = new HashSet<>();

        // Get album genres
        if (CollectionUtils.isNotEmpty(album.getGenres())) {
            genres.addAll(album.getGenres().stream()
                    .map(Genre::getName)
                    .map(this::consolidateGenre)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet()));
        }

        // Fallback to artist genres if no album genres
        if (genres.isEmpty() && CollectionUtils.isNotEmpty(album.getArtists())) {
            album.getArtists().forEach(artist -> {
                if (CollectionUtils.isNotEmpty(artist.getGenres())) {
                    genres.addAll(artist.getGenres().stream()
                            .map(Genre::getName)
                            .map(this::consolidateGenre)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet()));
                }
            });
        }

        return genres;
    }

    /**
     * Consolidate genre to parent genre
     * (mirrors GenreStrategy's consolidation logic)
     */
    private String consolidateGenre(String genre) {
        if (genre == null) {
            return null;
        }

        String lower = genre.toLowerCase();

        // Rock
        if (lower.contains("rock") && !lower.contains("hip hop")) {
            return "Rock";
        }
        // Hip Hop
        if (lower.contains("hip hop") || lower.equals("rap") || lower.equals("trap")) {
            return "Hip Hop";
        }
        // Electronic
        if (lower.contains("electronic") || lower.contains("techno") ||
                lower.contains("house") || lower.equals("edm") ||
                lower.equals("dubstep") || lower.equals("ambient")) {
            return "Electronic";
        }
        // Pop
        if (lower.contains("pop") && !lower.contains("hip hop")) {
            return "Pop";
        }
        // R&B/Soul
        if (lower.contains("r&b") || lower.contains("rnb") ||
                lower.contains("soul") || lower.contains("funk")) {
            return "R&B/Soul";
        }
        // Metal
        if (lower.contains("metal")) {
            return "Metal";
        }
        // Jazz
        if (lower.contains("jazz")) {
            return "Jazz";
        }
        // Indie
        if (lower.contains("indie") && !lower.contains("rock")) {
            return "Indie";
        }
        // Alternative
        if (lower.contains("alternative")) {
            return "Alternative";
        }

        // Return as-is if no consolidation rule
        return toTitleCase(genre);
    }

    /**
     * Convert to title case
     */
    private String toTitleCase(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        String[] words = text.split("\\s+");
        StringBuilder titleCase = new StringBuilder();

        for (String word : words) {
            if (word.length() > 0) {
                titleCase.append(Character.toUpperCase(word.charAt(0)))
                        .append(word.substring(1).toLowerCase())
                        .append(" ");
            }
        }

        return titleCase.toString().trim();
    }

    /**
     * Calculate priority - smart mixes prioritized above simple genre/decade crates
     */
    private double calculatePriority(List<Album> albums) {
        // Base priority higher than all other strategies to prioritize hybrid crates
        return albums.size() * 1.5;
    }
}
