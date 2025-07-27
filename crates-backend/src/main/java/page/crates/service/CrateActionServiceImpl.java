package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import page.crates.ai.*;
import page.crates.controller.api.SearchType;
import page.crates.entity.Album;
import page.crates.entity.Artist;
import page.crates.entity.Crate;
import page.crates.entity.CrateAlbum;
import page.crates.entity.Image;
import page.crates.entity.SpotifyUser;
import page.crates.repository.AlbumRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CrateActionServiceImpl implements CrateActionService {
    
    @Resource
    private LibraryService libraryService;
    @Resource
    private AlbumService albumService;
    @Resource
    private CrateService crateService;
    @Resource
    private HandleService handleService;
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private AlbumRepository albumRepository;
    
    @Override
    public List<SimpleLibraryAlbum> getUserLibrary(int limit) {
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        log.info("Getting library for user {} (limit: {})", currentUser.getSpotifyId(), limit);
        
        // Use the existing method with the user's numeric ID
        return libraryService.getRecentLibraryAlbumsForAI(currentUser.getId().toString(), limit);
    }
    
    @Override
    public List<SpotifyAlbumResult> searchSpotifyAlbums(String searchQuery) {
        log.info("Searching Spotify for: '{}'", searchQuery);
        
        try {
            // Use existing album search - try different search types
            Page<Album> searchResults = albumService.search(searchQuery, SearchType.GLOBAL, PageRequest.of(0, 10));
            
            return searchResults.getContent().stream()
                    .map(this::convertToSpotifyAlbumResult)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error searching Spotify albums for query: '{}'", searchQuery, e);
            return List.of(); // Return empty list on error
        }
    }
    
    @Override
    public CrateResult createCrate(String name, String description, boolean isPublic) {
        log.info("Creating crate: '{}' (public: {})", name, isPublic);
        
        try {
            SpotifyUser currentUser = currentUserService.getCurrentUser();
            
            // Create crate entity
            Crate newCrate = Crate.builder()
                    .name(name)
                    .description(description)
                    .publicCrate(isPublic)
                    .user(currentUser)
                    .handle(handleService.handelize(name))
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            // Save using existing service
            Crate savedCrate = crateService.create(newCrate);
            
            return CrateResult.builder()
                    .crateId(savedCrate.getId().toString())
                    .crateName(savedCrate.getName())
                    .description(savedCrate.getDescription())
                    .handle(savedCrate.getHandle())
                    .isPublic(savedCrate.isPublicCrate())
                    .build();
                    
        } catch (Exception e) {
            log.error("Error creating crate: '{}'", name, e);
            throw new RuntimeException("Failed to create crate: " + e.getMessage());
        }
    }
    
    @Override
    public AdditionResult addAlbumToCrate(String crateId, String spotifyAlbumId) {
        log.info("Adding album {} to crate {}", spotifyAlbumId, crateId);
        
        try {
            // Find the album by Spotify ID
            Album album = albumRepository.findOneBySpotifyId(spotifyAlbumId);
            if (album == null) {
                // Try to create/fetch album if not in our database
                album = albumService.findOrCreate(spotifyAlbumId);
                if (album == null) {
                    return AdditionResult.builder()
                            .success(false)
                            .message("Album not found with Spotify ID: " + spotifyAlbumId)
                            .build();
                }
            }
            
            // Add to crate using existing service
            crateService.addAlbum(Long.valueOf(crateId), spotifyAlbumId);
            
            String artistName = album.getArtists().stream()
                    .findFirst()
                    .map(Artist::getName)
                    .orElse("Unknown Artist");
            
            return AdditionResult.builder()
                    .success(true)
                    .albumName(album.getName())
                    .artist(artistName)
                    .message("Successfully added album to crate")
                    .build();
                    
        } catch (Exception e) {
            log.error("Error adding album {} to crate {}", spotifyAlbumId, crateId, e);
            return AdditionResult.builder()
                    .success(false)
                    .message("Error adding album: " + e.getMessage())
                    .build();
        }
    }
    
    
    private SpotifyAlbumResult convertToSpotifyAlbumResult(Album album) {
        String artistName = album.getArtists().stream()
                .findFirst()
                .map(Artist::getName)
                .orElse("Unknown Artist");
                
        String year = formatReleaseYear(album.getReleaseDate());
        
        String imageUrl = album.getImages().stream()
                .findFirst()
                .map(Image::getUrl)
                .orElse("");
        
        return SpotifyAlbumResult.builder()
                .spotifyId(album.getSpotifyId())
                .name(album.getName())
                .artist(artistName)
                .year(year)
                .imageUrl(imageUrl)
                .isInUserLibrary(false) // TODO: check if in user's library
                .build();
    }
    
    private String formatReleaseYear(Instant releaseDate) {
        if (releaseDate == null) {
            return "Unknown";
        }
        
        // Convert Instant to LocalDate and extract year
        LocalDate date = releaseDate.atZone(java.time.ZoneOffset.UTC).toLocalDate();
        int year = date.getYear();
        
        // For older albums, group by decade
        if (year < 1980) {
            return year / 10 * 10 + "s"; // e.g., "1970s"
        }
        
        return String.valueOf(year);
    }
    
    @Override
    public CrateSummary createCrateWithAlbums(CreateCrateWithAlbumsRequest request) {
        log.info("Creating crate '{}' with {} albums", request.getName(), 
                request.getAlbums() != null ? request.getAlbums().size() : 0);
        
        try {
            SpotifyUser currentUser = currentUserService.getCurrentUser();
            
            // Create crate entity
            Crate newCrate = Crate.builder()
                    .name(request.getName())
                    .description(request.getDescription())
                    .publicCrate(request.isPublic())
                    .user(currentUser)
                    .handle(handleService.handelize(request.getName()))
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            // Save crate
            Crate savedCrate = crateService.create(newCrate);
            
            // Add albums if provided
            List<AlbumMatchResult> matchResults = List.of();
            int albumsAdded = 0;
            int albumsFailed = 0;
            
            if (request.getAlbums() != null && !request.getAlbums().isEmpty()) {
                matchResults = addAlbumsToCreatedCrate(savedCrate.getId().toString(), request.getAlbums());
                albumsAdded = (int) matchResults.stream().mapToLong(r -> r.isMatched() ? 1 : 0).sum();
                albumsFailed = matchResults.size() - albumsAdded;
            }
            
            // Generate public URL if crate is public
            String publicUrl = null;
            if (savedCrate.isPublicCrate()) {
                publicUrl = generatePublicUrl(currentUser, savedCrate);
            }
            
            String userMessage = String.format("Created '%s' with %d albums successfully added%s%s", 
                    savedCrate.getName(), albumsAdded, 
                    albumsFailed > 0 ? " (" + albumsFailed + " failed to match)" : "",
                    publicUrl != null ? ". Share: " + publicUrl : "");
            
            return CrateSummary.builder()
                    .crateId(savedCrate.getId().toString())
                    .crateName(savedCrate.getName())
                    .description(savedCrate.getDescription())
                    .handle(savedCrate.getHandle())
                    .isPublic(savedCrate.isPublicCrate())
                    .totalAlbums(albumsAdded)
                    .albumsAdded(albumsAdded)
                    .albumsFailed(albumsFailed)
                    .matchResults(matchResults)
                    .userMessage(userMessage)
                    .publicUrl(publicUrl)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error creating crate with albums: '{}'", request.getName(), e);
            throw new RuntimeException("Failed to create crate with albums: " + e.getMessage());
        }
    }
    
    @Override
    public CrateSummary addAlbumsToCrate(String crateId, AddAlbumsRequest request) {
        log.info("Adding {} albums to crate {}", 
                request.getAlbums() != null ? request.getAlbums().size() : 0, crateId);
        
        try {
            Crate crate = crateService.findById(Long.valueOf(crateId));
            
            // Add albums
            List<AlbumMatchResult> matchResults = List.of();
            int albumsAdded = 0;
            int albumsFailed = 0;
            
            if (request.getAlbums() != null && !request.getAlbums().isEmpty()) {
                matchResults = addAlbumsToCreatedCrate(crateId, request.getAlbums());
                albumsAdded = (int) matchResults.stream().mapToLong(r -> r.isMatched() ? 1 : 0).sum();
                albumsFailed = matchResults.size() - albumsAdded;
            }
            
            // Get updated album count
            Page<CrateAlbum> crateAlbums = crateService.getAlbums(crate.getId(), PageRequest.of(0, 1));
            int totalAlbums = (int) crateAlbums.getTotalElements();
            
            // Generate public URL if crate is public
            SpotifyUser currentUser = currentUserService.getCurrentUser();
            String publicUrl = null;
            if (crate.isPublicCrate()) {
                publicUrl = generatePublicUrl(currentUser, crate);
            }
            
            String userMessage = String.format("Added %d albums to '%s'%s (total: %d albums)%s", 
                    albumsAdded, crate.getName(),
                    albumsFailed > 0 ? " (" + albumsFailed + " failed to match)" : "",
                    totalAlbums,
                    publicUrl != null ? ". Share: " + publicUrl : "");
            
            return CrateSummary.builder()
                    .crateId(crate.getId().toString())
                    .crateName(crate.getName())
                    .description(crate.getDescription())
                    .handle(crate.getHandle())
                    .isPublic(crate.isPublicCrate())
                    .totalAlbums(totalAlbums)
                    .albumsAdded(albumsAdded)
                    .albumsFailed(albumsFailed)
                    .matchResults(matchResults)
                    .userMessage(userMessage)
                    .publicUrl(publicUrl)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error adding albums to crate {}", crateId, e);
            throw new RuntimeException("Failed to add albums to crate: " + e.getMessage());
        }
    }
    
    @Override
    public List<CrateListItem> getUserCrates(String search) {
        try {
            SpotifyUser currentUser = currentUserService.getCurrentUser();
            log.info("Getting crates for user {} (search: '{}')", currentUser.getSpotifyId(), search);
            
            // Get all crates (both public and private) for the user
            Page<Crate> crates = crateService.getUserAllCrates(currentUser, search, PageRequest.of(0, 100));
            
            return crates.getContent().stream()
                    .map(this::convertToCrateListItem)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error getting user crates (search: '{}')", search, e);
            throw new RuntimeException("Failed to get user crates: " + e.getMessage());
        }
    }
    
    private List<AlbumMatchResult> addAlbumsToCreatedCrate(String crateId, List<SimpleAlbumReference> albumRefs) {
        return albumRefs.stream()
                .map(albumRef -> matchAndAddAlbum(crateId, albumRef))
                .collect(Collectors.toList());
    }
    
    private AlbumMatchResult matchAndAddAlbum(String crateId, SimpleAlbumReference albumRef) {
        try {
            // Create search query combining artist and album
            String searchQuery = albumRef.getArtist() + " " + albumRef.getTitle();
            log.debug("Searching for album: '{}'", searchQuery);
            
            // Search for albums
            Page<Album> searchResults = albumService.search(searchQuery, SearchType.GLOBAL, PageRequest.of(0, 5));
            
            if (searchResults.isEmpty()) {
                return AlbumMatchResult.builder()
                        .requestedTitle(albumRef.getTitle())
                        .requestedArtist(albumRef.getArtist())
                        .matched(false)
                        .message("No albums found matching: " + albumRef.getArtist() + " - " + albumRef.getTitle())
                        .build();
            }
            
            // Find best match - prioritize exact matches
            Album bestMatch = findBestAlbumMatch(albumRef, searchResults.getContent());
            
            if (bestMatch == null) {
                return AlbumMatchResult.builder()
                        .requestedTitle(albumRef.getTitle())
                        .requestedArtist(albumRef.getArtist())
                        .matched(false)
                        .message("No good matches found for: " + albumRef.getArtist() + " - " + albumRef.getTitle())
                        .build();
            }
            
            // Add album to crate
            crateService.addAlbum(Long.valueOf(crateId), bestMatch.getSpotifyId());
            
            String actualArtist = bestMatch.getArtists().stream()
                    .findFirst()
                    .map(Artist::getName)
                    .orElse("Unknown Artist");
            
            return AlbumMatchResult.builder()
                    .requestedTitle(albumRef.getTitle())
                    .requestedArtist(albumRef.getArtist())
                    .matched(true)
                    .actualTitle(bestMatch.getName())
                    .actualArtist(actualArtist)
                    .message("Successfully added: " + actualArtist + " - " + bestMatch.getName())
                    .build();
                    
        } catch (Exception e) {
            log.warn("Error matching album: {} - {}", albumRef.getArtist(), albumRef.getTitle(), e);
            return AlbumMatchResult.builder()
                    .requestedTitle(albumRef.getTitle())
                    .requestedArtist(albumRef.getArtist())
                    .matched(false)
                    .message("Error adding album: " + e.getMessage())
                    .build();
        }
    }
    
    private Album findBestAlbumMatch(SimpleAlbumReference albumRef, List<Album> candidates) {
        String requestedTitle = albumRef.getTitle().toLowerCase().trim();
        String requestedArtist = albumRef.getArtist().toLowerCase().trim();
        
        // Look for exact title and artist matches first
        for (Album album : candidates) {
            String albumTitle = album.getName().toLowerCase().trim();
            String albumArtist = album.getArtists().stream()
                    .findFirst()
                    .map(artist -> artist.getName().toLowerCase().trim())
                    .orElse("");
            
            if (albumTitle.equals(requestedTitle) && albumArtist.equals(requestedArtist)) {
                return album; // Perfect match
            }
        }
        
        // Look for partial matches - title contains or artist contains
        for (Album album : candidates) {
            String albumTitle = album.getName().toLowerCase().trim();
            String albumArtist = album.getArtists().stream()
                    .findFirst()
                    .map(artist -> artist.getName().toLowerCase().trim())
                    .orElse("");
            
            if ((albumTitle.contains(requestedTitle) || requestedTitle.contains(albumTitle)) &&
                (albumArtist.contains(requestedArtist) || requestedArtist.contains(albumArtist))) {
                return album; // Good partial match
            }
        }
        
        // Return first candidate if no good matches (let AI decide if it's acceptable)
        return candidates.isEmpty() ? null : candidates.get(0);
    }
    
    private CrateListItem convertToCrateListItem(Crate crate) {
        // Get album count for this crate
        Page<CrateAlbum> albums = crateService.getAlbums(crate.getId(), PageRequest.of(0, 1));
        int albumCount = (int) albums.getTotalElements();
        
        return CrateListItem.builder()
                .crateId(crate.getId().toString())
                .name(crate.getName())
                .description(crate.getDescription())
                .isPublic(crate.isPublicCrate())
                .albumCount(albumCount)
                .build();
    }
    
    private String generatePublicUrl(SpotifyUser user, Crate crate) {
        try {
            // Ensure user has a handle for public sharing
            if (user.getHandle() == null || user.getHandle().isEmpty()) {
                // Auto-generate handle if needed
                String generatedHandle = handleService.handelize(user.getSpotifyId());
                user.setHandle(generatedHandle);
                // Note: In a real implementation, you'd save the user here
            }
            
            // Generate public URL - using crates.music domain
            return String.format("https://crates.music/%s/%s", 
                    user.getHandle(), crate.getHandle());
        } catch (Exception e) {
            log.warn("Error generating public URL for crate {}: {}", crate.getId(), e.getMessage());
            return null;
        }
    }
}