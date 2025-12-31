package page.crates.categorization;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Component;
import page.crates.entity.Album;
import page.crates.entity.Genre;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Categorize albums by genre with consolidation of similar genres
 */
@Slf4j
@Component
public class GenreStrategy implements CategoryStrategy {

    private static final int MIN_ALBUMS_PER_CRATE = 8;

    // Genre consolidation map: specific genre -> parent genre
    private static final Map<String, String> GENRE_HIERARCHY = new HashMap<>();

    static {
        // Rock family
        GENRE_HIERARCHY.put("indie rock", "Rock");
        GENRE_HIERARCHY.put("alternative rock", "Rock");
        GENRE_HIERARCHY.put("classic rock", "Rock");
        GENRE_HIERARCHY.put("hard rock", "Rock");
        GENRE_HIERARCHY.put("punk rock", "Rock");
        GENRE_HIERARCHY.put("progressive rock", "Rock");
        GENRE_HIERARCHY.put("folk rock", "Rock");
        GENRE_HIERARCHY.put("garage rock", "Rock");
        GENRE_HIERARCHY.put("psychedelic rock", "Rock");
        GENRE_HIERARCHY.put("rock", "Rock");

        // Hip Hop family
        GENRE_HIERARCHY.put("hip hop", "Hip Hop");
        GENRE_HIERARCHY.put("rap", "Hip Hop");
        GENRE_HIERARCHY.put("trap", "Hip Hop");
        GENRE_HIERARCHY.put("east coast hip hop", "Hip Hop");
        GENRE_HIERARCHY.put("west coast hip hop", "Hip Hop");
        GENRE_HIERARCHY.put("conscious hip hop", "Hip Hop");
        GENRE_HIERARCHY.put("underground hip hop", "Hip Hop");

        // Electronic family
        GENRE_HIERARCHY.put("electronic", "Electronic");
        GENRE_HIERARCHY.put("edm", "Electronic");
        GENRE_HIERARCHY.put("techno", "Electronic");
        GENRE_HIERARCHY.put("house", "Electronic");
        GENRE_HIERARCHY.put("deep house", "Electronic");
        GENRE_HIERARCHY.put("electro", "Electronic");
        GENRE_HIERARCHY.put("ambient", "Electronic");
        GENRE_HIERARCHY.put("idm", "Electronic");
        GENRE_HIERARCHY.put("dubstep", "Electronic");
        GENRE_HIERARCHY.put("drum and bass", "Electronic");

        // Pop family
        GENRE_HIERARCHY.put("pop", "Pop");
        GENRE_HIERARCHY.put("indie pop", "Pop");
        GENRE_HIERARCHY.put("synth-pop", "Pop");
        GENRE_HIERARCHY.put("electropop", "Pop");
        GENRE_HIERARCHY.put("dream pop", "Pop");
        GENRE_HIERARCHY.put("art pop", "Pop");

        // R&B/Soul family
        GENRE_HIERARCHY.put("r&b", "R&B/Soul");
        GENRE_HIERARCHY.put("rnb", "R&B/Soul");
        GENRE_HIERARCHY.put("soul", "R&B/Soul");
        GENRE_HIERARCHY.put("neo soul", "R&B/Soul");
        GENRE_HIERARCHY.put("funk", "R&B/Soul");

        // Metal family
        GENRE_HIERARCHY.put("metal", "Metal");
        GENRE_HIERARCHY.put("heavy metal", "Metal");
        GENRE_HIERARCHY.put("death metal", "Metal");
        GENRE_HIERARCHY.put("black metal", "Metal");
        GENRE_HIERARCHY.put("thrash metal", "Metal");
        GENRE_HIERARCHY.put("doom metal", "Metal");

        // Jazz family
        GENRE_HIERARCHY.put("jazz", "Jazz");
        GENRE_HIERARCHY.put("bebop", "Jazz");
        GENRE_HIERARCHY.put("cool jazz", "Jazz");
        GENRE_HIERARCHY.put("free jazz", "Jazz");
        GENRE_HIERARCHY.put("jazz fusion", "Jazz");

        // Country family
        GENRE_HIERARCHY.put("country", "Country");
        GENRE_HIERARCHY.put("alt-country", "Country");
        GENRE_HIERARCHY.put("americana", "Country");
        GENRE_HIERARCHY.put("bluegrass", "Country");

        // Classical family
        GENRE_HIERARCHY.put("classical", "Classical");
        GENRE_HIERARCHY.put("baroque", "Classical");
        GENRE_HIERARCHY.put("romantic", "Classical");
        GENRE_HIERARCHY.put("contemporary classical", "Classical");

        // Reggae family
        GENRE_HIERARCHY.put("reggae", "Reggae");
        GENRE_HIERARCHY.put("dub", "Reggae");
        GENRE_HIERARCHY.put("ska", "Reggae");
    }

    @Override
    public List<CrateProposal> analyze(List<Album> albums) {
        log.info("Running GenreStrategy on {} albums", albums.size());

        // Collect all genres from all albums (and their artists)
        // Use Map<Long, Album> where key is album ID to prevent duplicates
        Map<String, Map<Long, Album>> genreToAlbums = new HashMap<>();

        for (Album album : albums) {
            Set<String> albumGenres = getAllGenresForAlbum(album);

            for (String genre : albumGenres) {
                String normalizedGenre = normalizeGenre(genre);
                if (normalizedGenre != null) {
                    // Only add if album ID not already in this genre
                    genreToAlbums
                            .computeIfAbsent(normalizedGenre, k -> new HashMap<>())
                            .putIfAbsent(album.getId(), album);
                }
            }
        }

        // Consolidate similar genres
        Map<String, Map<Long, Album>> consolidatedGenres = consolidateGenres(genreToAlbums);

        // Create proposals for genres with sufficient albums
        List<CrateProposal> proposals = new ArrayList<>();

        for (Map.Entry<String, Map<Long, Album>> entry : consolidatedGenres.entrySet()) {
            String genre = entry.getKey();
            List<Album> genreAlbums = new ArrayList<>(entry.getValue().values());

            if (genreAlbums.size() >= MIN_ALBUMS_PER_CRATE) {
                CrateProposal proposal = CrateProposal.builder()
                        .name(genre)
                        .albums(genreAlbums)
                        .strategy(CrateProposal.CategorizationStrategy.GENRE)
                        .priority(calculatePriority(genreAlbums))
                        .publicCrate(true)
                        .build();

                proposals.add(proposal);
                log.debug("Created genre proposal: {} with {} albums", genre, genreAlbums.size());
            }
        }

        log.info("GenreStrategy generated {} proposals", proposals.size());
        return proposals;
    }

    /**
     * Get all genres for an album (from album + artists)
     */
    private Set<String> getAllGenresForAlbum(Album album) {
        Set<String> genres = new HashSet<>();

        // Get album genres
        if (CollectionUtils.isNotEmpty(album.getGenres())) {
            genres.addAll(album.getGenres().stream()
                    .map(Genre::getName)
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet()));
        }

        // Fallback to artist genres if no album genres
        if (genres.isEmpty() && CollectionUtils.isNotEmpty(album.getArtists())) {
            album.getArtists().forEach(artist -> {
                if (CollectionUtils.isNotEmpty(artist.getGenres())) {
                    genres.addAll(artist.getGenres().stream()
                            .map(Genre::getName)
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet()));
                }
            });
        }

        return genres;
    }

    /**
     * Normalize genre name (lowercase, trim)
     */
    private String normalizeGenre(String genre) {
        if (genre == null || genre.trim().isEmpty()) {
            return null;
        }
        return genre.toLowerCase().trim();
    }

    /**
     * Consolidate similar genres using hierarchy map
     */
    private Map<String, Map<Long, Album>> consolidateGenres(Map<String, Map<Long, Album>> genreToAlbums) {
        Map<String, Map<Long, Album>> consolidated = new HashMap<>();

        for (Map.Entry<String, Map<Long, Album>> entry : genreToAlbums.entrySet()) {
            String genre = entry.getKey();
            Map<Long, Album> albumsById = entry.getValue();

            // Map to parent genre if exists in hierarchy
            String parentGenre = GENRE_HIERARCHY.getOrDefault(genre, toTitleCase(genre));

            // Add all albums by ID (putIfAbsent prevents duplicates)
            Map<Long, Album> consolidatedMap = consolidated.computeIfAbsent(parentGenre, k -> new HashMap<>());
            albumsById.forEach(consolidatedMap::putIfAbsent);
        }

        return consolidated;
    }

    /**
     * Convert genre to title case (indie rock -> Indie Rock)
     */
    private String toTitleCase(String genre) {
        if (genre == null || genre.isEmpty()) {
            return genre;
        }

        String[] words = genre.split("\\s+");
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
     * Calculate priority based on album count and genre popularity
     */
    private double calculatePriority(List<Album> albums) {
        return albums.size() * 1.1; // Slightly higher than decade strategy
    }
}
