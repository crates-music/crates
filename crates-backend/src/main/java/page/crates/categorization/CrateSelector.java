package page.crates.categorization;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import page.crates.entity.Album;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Selects optimal 8-12 crates from all strategy proposals
 * Handles overlap, trimming, and ensures good coverage
 */
@Slf4j
@Component
public class CrateSelector {

    private static final int MIN_ALBUMS_PER_CRATE = 8;
    private static final int IDEAL_ALBUMS_PER_CRATE = 10;

    /**
     * Select optimal crates from all proposals
     * Scales dynamically based on library size for better coverage
     *
     * @param allProposals All proposals from all strategies
     * @param totalLibrarySize Total number of albums in library
     * @return Selected crate proposals (scales with library size)
     */
    public List<CrateProposal> selectOptimal(List<CrateProposal> allProposals, int totalLibrarySize) {
        log.info("Selecting optimal crates from {} proposals (library size: {})",
                allProposals.size(), totalLibrarySize);

        // Calculate dynamic limits based on library size
        int targetMinCrates = calculateMinCrates(totalLibrarySize);
        int targetMaxCrates = calculateMaxCrates(totalLibrarySize);
        int maxAlbumsPerCrate = calculateMaxAlbumsPerCrate(totalLibrarySize);
        double maxOverlapRatio = calculateMaxOverlapRatio(totalLibrarySize);

        log.info("Dynamic limits: {}-{} crates, max {} albums/crate, {:.0f}% max overlap",
                targetMinCrates, targetMaxCrates, maxAlbumsPerCrate, maxOverlapRatio * 100);

        // Handle edge case: very small library
        if (totalLibrarySize < MIN_ALBUMS_PER_CRATE * 8) {
            log.warn("Library too small ({} albums), relaxing constraints", totalLibrarySize);
            return selectForSmallLibrary(allProposals);
        }

        // Deduplicate by name (keep highest priority version of each crate name)
        Map<String, CrateProposal> uniqueProposals = new LinkedHashMap<>();
        allProposals.stream()
                .sorted(Comparator.comparingDouble(CrateProposal::getPriority).reversed())
                .forEach(proposal ->
                        uniqueProposals.putIfAbsent(proposal.getName(), proposal));

        log.info("Deduplicated {} proposals down to {} unique crate names",
                allProposals.size(), uniqueProposals.size());

        List<CrateProposal> sortedProposals = new ArrayList<>(uniqueProposals.values());

        // Greedy selection with overlap checking
        List<CrateProposal> selected = new ArrayList<>();
        Set<Album> coveredAlbums = new HashSet<>();

        for (CrateProposal proposal : sortedProposals) {
            // Stop if we've reached max crates
            if (selected.size() >= targetMaxCrates) {
                log.debug("Reached max crates ({}), stopping selection", targetMaxCrates);
                break;
            }

            // Calculate overlap with already selected crates
            long overlapCount = proposal.getAlbums().stream()
                    .filter(coveredAlbums::contains)
                    .count();

            double overlapRatio = (double) overlapCount / proposal.getAlbums().size();

            // Skip if too much overlap
            if (overlapRatio > maxOverlapRatio) {
                log.debug("Skipping proposal '{}' due to high overlap ({:.1f}%)",
                        proposal.getName(), overlapRatio * 100);
                continue;
            }

            // Trim albums to appropriate range
            List<Album> trimmedAlbums = trimAlbums(proposal.getAlbums(), coveredAlbums, maxAlbumsPerCrate);

            // Skip if not enough uncovered albums remain
            if (trimmedAlbums.size() < MIN_ALBUMS_PER_CRATE) {
                log.debug("Skipping proposal '{}' with only {} uncovered albums",
                        proposal.getName(), trimmedAlbums.size());
                continue;
            }

            // Create trimmed proposal
            CrateProposal trimmedProposal = CrateProposal.builder()
                    .name(proposal.getName())
                    .albums(trimmedAlbums)
                    .strategy(proposal.getStrategy())
                    .priority(proposal.getPriority())
                    .description(proposal.getDescription())
                    .publicCrate(proposal.isPublicCrate())
                    .build();

            selected.add(trimmedProposal);
            coveredAlbums.addAll(trimmedAlbums);

            log.debug("Selected proposal '{}' with {} albums (priority: {:.1f})",
                    proposal.getName(), trimmedAlbums.size(), proposal.getPriority());
        }

        // Ensure we have at least target min crates
        if (selected.size() < targetMinCrates) {
            log.warn("Only selected {} crates, trying to reach {} minimum",
                    selected.size(), targetMinCrates);
            // Relax overlap constraint and try again with remaining proposals
            selected = relaxAndSelectMore(selected, sortedProposals, coveredAlbums, targetMinCrates, maxOverlapRatio);
        }

        log.info("Final selection: {} crates covering {} albums",
                selected.size(), coveredAlbums.size());

        return selected;
    }

    /**
     * Trim albums to appropriate range
     * Removes already covered albums and selects best uncovered ones
     */
    private List<Album> trimAlbums(List<Album> albums, Set<Album> alreadyCovered, int maxAlbumsPerCrate) {
        // Filter out already covered albums
        List<Album> uncovered = albums.stream()
                .filter(album -> !alreadyCovered.contains(album))
                .collect(Collectors.toList());

        // If we have too many, select top albums by popularity
        if (uncovered.size() > maxAlbumsPerCrate) {
            uncovered = uncovered.stream()
                    .sorted(Comparator.comparingInt(Album::getPopularity).reversed())
                    .limit(IDEAL_ALBUMS_PER_CRATE)
                    .collect(Collectors.toList());
        }

        return uncovered;
    }

    /**
     * Relax overlap constraint to try to reach minimum crates
     */
    private List<CrateProposal> relaxAndSelectMore(
            List<CrateProposal> currentSelected,
            List<CrateProposal> allProposals,
            Set<Album> coveredAlbums,
            int targetMinCrates,
            double baseMaxOverlap) {

        List<CrateProposal> relaxedSelected = new ArrayList<>(currentSelected);

        // Relax overlap by 50%
        double relaxedOverlap = Math.min(0.7, baseMaxOverlap * 1.5);

        for (CrateProposal proposal : allProposals) {
            if (relaxedSelected.size() >= targetMinCrates) {
                break;
            }

            // Skip if already selected
            if (currentSelected.contains(proposal)) {
                continue;
            }

            // Check relaxed overlap
            long overlapCount = proposal.getAlbums().stream()
                    .filter(coveredAlbums::contains)
                    .count();

            double overlapRatio = (double) overlapCount / proposal.getAlbums().size();

            if (overlapRatio > relaxedOverlap) {
                continue; // Still too much overlap
            }

            int maxAlbums = calculateMaxAlbumsPerCrate(coveredAlbums.size());
            List<Album> trimmedAlbums = trimAlbums(proposal.getAlbums(), coveredAlbums, maxAlbums);

            if (trimmedAlbums.size() >= MIN_ALBUMS_PER_CRATE / 2) { // Relax min albums too
                CrateProposal trimmedProposal = CrateProposal.builder()
                        .name(proposal.getName())
                        .albums(trimmedAlbums)
                        .strategy(proposal.getStrategy())
                        .priority(proposal.getPriority())
                        .description(proposal.getDescription())
                        .publicCrate(proposal.isPublicCrate())
                        .build();

                relaxedSelected.add(trimmedProposal);
                coveredAlbums.addAll(trimmedAlbums);

                log.debug("Relaxed selection: added '{}' with {} albums",
                        proposal.getName(), trimmedAlbums.size());
            }
        }

        return relaxedSelected;
    }

    /**
     * Handle very small libraries (< 64 albums)
     * Create fewer crates with relaxed constraints
     */
    private List<CrateProposal> selectForSmallLibrary(List<CrateProposal> allProposals) {
        log.info("Selecting crates for small library");

        // Relax minimum albums per crate
        int relaxedMin = 5;

        List<CrateProposal> selected = allProposals.stream()
                .filter(p -> p.getAlbums().size() >= relaxedMin)
                .sorted(Comparator.comparingDouble(CrateProposal::getPriority).reversed())
                .limit(8)
                .collect(Collectors.toList());

        log.info("Small library selection: {} crates", selected.size());
        return selected;
    }

    /**
     * Calculate minimum crates based on library size
     * Scales up for larger libraries
     */
    private int calculateMinCrates(int librarySize) {
        if (librarySize < 100) return 8;
        if (librarySize < 300) return 12;
        if (librarySize < 600) return 16;
        if (librarySize < 1000) return 20;
        return 25; // 1000+ albums
    }

    /**
     * Calculate maximum crates based on library size
     * Allows more crates for larger libraries
     */
    private int calculateMaxCrates(int librarySize) {
        if (librarySize < 100) return 12;
        if (librarySize < 300) return 18;
        if (librarySize < 600) return 25;
        if (librarySize < 1000) return 30;
        return 40; // 1000+ albums
    }

    /**
     * Calculate max albums per crate based on library size
     * Larger libraries allow bigger crates
     */
    private int calculateMaxAlbumsPerCrate(int librarySize) {
        if (librarySize < 200) return 12;
        if (librarySize < 500) return 15;
        if (librarySize < 1000) return 18;
        return 20; // 1000+ albums
    }

    /**
     * Calculate max overlap ratio based on library size
     * Larger libraries need more overlap to ensure good coverage
     */
    private double calculateMaxOverlapRatio(int librarySize) {
        if (librarySize < 200) return 0.3;  // 30% overlap for small libraries
        if (librarySize < 500) return 0.4;  // 40% overlap for medium libraries
        if (librarySize < 1000) return 0.5; // 50% overlap for large libraries
        return 0.6; // 60% overlap for huge libraries (1000+)
    }
}
