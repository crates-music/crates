package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.ai.AlbumMatchResult;
import page.crates.ai.CrateSummary;
import page.crates.ai.CreateCrateWithAlbumsRequest;
import page.crates.ai.SimpleAlbumReference;
import page.crates.repository.CrateAlbumRepository;
import page.crates.repository.CrateRepository;
import page.crates.categorization.CrateProposal;
import page.crates.categorization.LibraryAnalyzer;
import page.crates.controller.api.autocategorize.AutoCategorizeExecuteRequest;
import page.crates.controller.api.autocategorize.AutoCategorizePreview;
import page.crates.controller.api.autocategorize.AutoCategorizeResult;
import page.crates.controller.api.autocategorize.CrateProposalDTO;
import page.crates.entity.Album;
import page.crates.entity.Artist;
import page.crates.entity.Image;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AutoCategorizeServiceImpl implements AutoCategorizeService {

    @Resource
    private LibraryAlbumService libraryAlbumService;

    @Resource
    private GenreEnrichmentService genreEnrichmentService;

    @Resource
    private LibraryAnalyzer libraryAnalyzer;

    @Resource
    private CrateActionService crateActionService;

    @Resource
    private CurrentUserService currentUserService;

    @Resource
    private CrateRepository crateRepository;

    @Resource
    private CrateAlbumRepository crateAlbumRepository;

    @Override
    public AutoCategorizePreview previewCategorization() {
        log.info("Previewing auto-categorization for current user");
        long startTime = System.currentTimeMillis();

        SpotifyUser user = currentUserService.getCurrentUser();

        // Fetch all library albums
        List<Album> libraryAlbums = fetchAllLibraryAlbums(user);

        // Filter to only uncategorized albums
        List<Album> uncategorizedAlbums = filterUncategorizedAlbums(user, libraryAlbums);

        log.info("Found {} uncategorized albums out of {} total library albums",
                uncategorizedAlbums.size(), libraryAlbums.size());

        // Enrich genres (best effort)
        boolean genreEnrichmentSuccessful = enrichGenres(uncategorizedAlbums);

        // Analyze and generate proposals
        List<CrateProposal> proposals = libraryAnalyzer.analyze(uncategorizedAlbums);

        // Calculate coverage
        long uniqueAlbumsCategorized = proposals.stream()
                .flatMap(p -> p.getAlbums().stream())
                .distinct()
                .count();

        double coveragePercent = libraryAlbums.size() > 0
                ? (double) uniqueAlbumsCategorized / libraryAlbums.size() * 100
                : 0.0;

        // Convert to DTOs
        List<CrateProposalDTO> proposalDTOs = proposals.stream()
                .map(this::toProposalDTO)
                .collect(Collectors.toList());

        long duration = System.currentTimeMillis() - startTime;

        log.info("Preview completed in {}ms: {} crates proposed, {}/{} albums ({:.1f}% coverage)",
                duration, proposals.size(), uniqueAlbumsCategorized, libraryAlbums.size(), coveragePercent);

        return AutoCategorizePreview.builder()
                .proposedCrates(proposals.size())
                .albumsWillBeCategorized((int) uniqueAlbumsCategorized)
                .totalLibraryAlbums(libraryAlbums.size())
                .coveragePercent(coveragePercent)
                .proposals(proposalDTOs)
                .recommendation(generateRecommendation(proposals, genreEnrichmentSuccessful))
                .build();
    }

    @Override
    @Transactional
    public AutoCategorizeResult autoCategorize(AutoCategorizeExecuteRequest request) {
        log.info("Starting auto-categorization for current user");
        long startTime = System.currentTimeMillis();

        SpotifyUser user = currentUserService.getCurrentUser();

        // Fetch all library albums
        List<Album> libraryAlbums = fetchAllLibraryAlbums(user);

        // Filter to only uncategorized albums
        List<Album> uncategorizedAlbums = filterUncategorizedAlbums(user, libraryAlbums);

        log.info("Found {} uncategorized albums out of {} total library albums",
                uncategorizedAlbums.size(), libraryAlbums.size());

        // Enrich genres (best effort)
        boolean genreEnrichmentSuccessful = enrichGenres(uncategorizedAlbums);

        // Use provided proposals if available, otherwise analyze
        List<CrateProposal> proposals;
        if (request != null && request.getProposals() != null && !request.getProposals().isEmpty()) {
            log.info("Using {} pre-computed proposals from preview", request.getProposals().size());
            proposals = convertDTOsToProposals(request.getProposals(), uncategorizedAlbums);
        } else {
            log.info("No proposals provided, analyzing library");
            proposals = libraryAnalyzer.analyze(uncategorizedAlbums);
        }

        // Filter out proposals for crates that already exist
        List<CrateProposal> newProposals = new ArrayList<>();
        int skippedCount = 0;

        for (CrateProposal proposal : proposals) {
            String handle = proposal.getName().toLowerCase().replace(" ", "-");
            if (crateRepository.findByUserAndHandle(user, handle).isPresent()) {
                log.info("Skipping existing crate: {}", proposal.getName());
                skippedCount++;
            } else {
                newProposals.add(proposal);
            }
        }

        log.info("Filtered {} proposals: {} new, {} already exist",
                proposals.size(), newProposals.size(), skippedCount);

        // Create crates from proposals
        List<CrateSummary> createdCrates = new ArrayList<>();

        for (CrateProposal proposal : newProposals) {
            try {
                CreateCrateWithAlbumsRequest crateRequest = buildCrateRequest(proposal);
                CrateSummary crateSummary = crateActionService.createCrateWithAlbums(crateRequest);
                createdCrates.add(crateSummary);

                log.info("Created crate: {} with {} albums",
                        proposal.getName(), proposal.getAlbums().size());

            } catch (Exception e) {
                log.error("Failed to create crate: " + proposal.getName(), e);
                // Continue with next crate instead of failing everything
            }
        }

        // Calculate final stats
        long uniqueAlbumsCategorized = createdCrates.stream()
                .flatMap(c -> c.getMatchResults().stream())
                .filter(AlbumMatchResult::isMatched)
                .distinct()
                .count();

        double coveragePercent = (double) uniqueAlbumsCategorized / libraryAlbums.size() * 100;

        long duration = System.currentTimeMillis() - startTime;

        log.info("Auto-categorization completed in {}ms: {} crates created, {} albums categorized ({:.1f}% coverage)",
                duration, createdCrates.size(), uniqueAlbumsCategorized, coveragePercent);

        return AutoCategorizeResult.builder()
                .cratesCreated(createdCrates.size())
                .albumsCategorized((int) uniqueAlbumsCategorized)
                .coveragePercent(coveragePercent)
                .crates(createdCrates)
                .processingTimeMs(duration)
                .message(generateSuccessMessage(createdCrates.size(), (int) uniqueAlbumsCategorized))
                .genreEnrichmentSuccessful(genreEnrichmentSuccessful)
                .build();
    }

    /**
     * Fetch all library albums for user (handles pagination)
     */
    private List<Album> fetchAllLibraryAlbums(SpotifyUser user) {
        List<Album> allAlbums = new ArrayList<>();
        int pageSize = 100;
        int page = 0;
        boolean hasMore = true;

        while (hasMore) {
            Pageable pageable = PageRequest.of(page, pageSize);
            Page<LibraryAlbum> libraryPage = libraryAlbumService.findByUser(user, pageable);

            List<Album> pageAlbums = libraryPage.getContent().stream()
                    .map(LibraryAlbum::getAlbum)
                    .collect(Collectors.toList());

            allAlbums.addAll(pageAlbums);

            hasMore = libraryPage.hasNext();
            page++;
        }

        log.info("Fetched {} library albums for user {}", allAlbums.size(), user.getSpotifyId());
        return allAlbums;
    }

    /**
     * Genre enrichment no-op (genres come from Spotify now)
     * Kept for compatibility with existing flow
     */
    private boolean enrichGenres(List<Album> albums) {
        log.info("Using genre data from Spotify for {} albums", albums.size());
        genreEnrichmentService.bulkEnrichAlbums(albums);
        return true;
    }

    /**
     * Build CreateCrateWithAlbumsRequest from CrateProposal
     */
    private CreateCrateWithAlbumsRequest buildCrateRequest(CrateProposal proposal) {
        // Convert albums to SimpleAlbumReference with IDs and artwork (we already have them from library!)
        List<SimpleAlbumReference> albumRefs = proposal.getAlbums().stream()
                .map(album -> {
                    String artistName = album.getArtists().stream()
                            .findFirst()
                            .map(Artist::getName)
                            .orElse("Unknown Artist");

                    return SimpleAlbumReference.builder()
                            .title(album.getName())
                            .artist(artistName)
                            .albumId(album.getId()) // Include ID to skip search
                            .artworkUrl(getSmallestImageUrl(album)) // Include artwork for display
                            .build();
                })
                .collect(Collectors.toList());

        return CreateCrateWithAlbumsRequest.builder()
                .name(proposal.getName())
                .isPublic(proposal.isPublicCrate())
                .albums(albumRefs)
                .build();
    }

    /**
     * Convert CrateProposal to DTO
     */
    private CrateProposalDTO toProposalDTO(CrateProposal proposal) {
        // Convert albums to SimpleAlbumReference with IDs and artwork
        List<SimpleAlbumReference> albumRefs = proposal.getAlbums().stream()
                .map(album -> {
                    String artistName = album.getArtists().stream()
                            .findFirst()
                            .map(Artist::getName)
                            .orElse("Unknown Artist");

                    return SimpleAlbumReference.builder()
                            .title(album.getName())
                            .artist(artistName)
                            .albumId(album.getId())
                            .artworkUrl(getSmallestImageUrl(album))
                            .build();
                })
                .collect(Collectors.toList());

        return CrateProposalDTO.builder()
                .name(proposal.getName())
                .albumCount(proposal.getAlbums().size())
                .description(proposal.getDescription())
                .strategy(proposal.getStrategy().name())
                .albums(albumRefs)
                .build();
    }

    /**
     * Convert DTOs back to CrateProposals using album IDs
     */
    private List<CrateProposal> convertDTOsToProposals(List<CrateProposalDTO> dtos, List<Album> libraryAlbums) {
        // Build map of id -> Album for quick lookup
        Map<Long, Album> albumsById = libraryAlbums.stream()
                .collect(Collectors.toMap(Album::getId, album -> album));

        return dtos.stream()
                .map(dto -> {
                    // Lookup albums by ID, deduplicate using LinkedHashSet
                    Set<Album> albumSet = dto.getAlbums().stream()
                            .filter(ref -> ref.getAlbumId() != null)
                            .map(ref -> albumsById.get(ref.getAlbumId()))
                            .filter(album -> album != null) // Filter out albums not found
                            .collect(Collectors.toCollection(LinkedHashSet::new));

                    List<Album> albums = new ArrayList<>(albumSet);

                    // Parse strategy enum
                    CrateProposal.CategorizationStrategy strategy;
                    try {
                        strategy = CrateProposal.CategorizationStrategy.valueOf(dto.getStrategy());
                    } catch (Exception e) {
                        strategy = CrateProposal.CategorizationStrategy.SMART_MIX; // Default
                    }

                    return CrateProposal.builder()
                            .name(dto.getName())
                            .albums(albums)
                            .description(dto.getDescription())
                            .strategy(strategy)
                            .publicCrate(true)
                            .priority(1.0) // Default priority
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Get the smallest image URL from an album (for faster loading)
     */
    private String getSmallestImageUrl(Album album) {
        if (album.getImages() == null || album.getImages().isEmpty()) {
            return null;
        }

        return album.getImages().stream()
                .min((img1, img2) -> {
                    int size1 = (img1.getWidth() != null ? img1.getWidth() : Integer.MAX_VALUE);
                    int size2 = (img2.getWidth() != null ? img2.getWidth() : Integer.MAX_VALUE);
                    return Integer.compare(size1, size2);
                })
                .map(Image::getUrl)
                .orElse(null);
    }

    /**
     * Generate recommendation message
     */
    private String generateRecommendation(List<CrateProposal> proposals, boolean genreEnrichmentSuccessful) {
        return String.format("Ready to create %d curated crates from your library! " +
                "We've analyzed your music taste across decades, genres, and artists to create the perfect organization.",
                proposals.size());
    }

    /**
     * Generate success message
     */
    private String generateSuccessMessage(int cratesCreated, int albumsCategorized) {
        return String.format("Successfully created %d crates with %d albums! " +
                "Your library is now beautifully organized and ready to explore.",
                cratesCreated, albumsCategorized);
    }

    /**
     * Filter albums to only those not in any crate
     */
    private List<Album> filterUncategorizedAlbums(SpotifyUser user, List<Album> albums) {
        if (albums.isEmpty()) {
            return albums;
        }

        // Get all album IDs
        List<Long> albumIds = albums.stream()
                .map(Album::getId)
                .collect(Collectors.toList());

        // Find which albums are already in crates
        List<Long> categorizedAlbumIds = crateAlbumRepository.findAlbumIdsInAnyCrate(user, albumIds);
        Set<Long> categorizedSet = new HashSet<>(categorizedAlbumIds);

        // Filter to only uncategorized albums
        return albums.stream()
                .filter(album -> !categorizedSet.contains(album.getId()))
                .collect(Collectors.toList());
    }
}
