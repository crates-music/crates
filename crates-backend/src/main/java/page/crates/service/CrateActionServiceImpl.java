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
    public List<SimpleLibraryAlbum> getUserLibrary(String userId, int limit) {
        log.info("Getting library for user {} (limit: {})", userId, limit);
        
        // Use the existing method we created
        return libraryService.getRecentLibraryAlbumsForAI(userId, limit);
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
                    .handle(generateCrateHandle(name))
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
    
    @Override
    public ShareResult getPublicCrateLink(String crateId) {
        log.info("Generating public link for crate: {}", crateId);
        
        try {
            SpotifyUser currentUser = currentUserService.getCurrentUser();
            Crate crate = crateService.findById(Long.valueOf(crateId));
            
            // Ensure user has a handle for public sharing
            if (currentUser.getHandle() == null || currentUser.getHandle().isEmpty()) {
                // Auto-generate handle if needed
                String generatedHandle = handleService.handelize(currentUser.getSpotifyId());
                currentUser.setHandle(generatedHandle);
                // Save updated user
            }
            
            // Generate public URL
            String publicUrl = String.format("https://crates.page/%s/%s", 
                    currentUser.getHandle(), crate.getHandle());
                    
            // Count albums in crate
            Page<CrateAlbum> crateAlbums = crateService.getAlbums(crate.getId(), PageRequest.of(0, 1));
            int albumCount = (int) crateAlbums.getTotalElements();
            
            String userMessage = String.format("Created '%s' with %d albums! Share: %s", 
                    crate.getName(), albumCount, publicUrl);
            
            return ShareResult.builder()
                    .publicUrl(publicUrl)
                    .crateName(crate.getName())
                    .albumCount(albumCount)
                    .userMessage(userMessage)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error generating public link for crate: {}", crateId, e);
            throw new RuntimeException("Failed to generate public link: " + e.getMessage());
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
    
    private String generateCrateHandle(String crateName) {
        // Convert to URL-friendly handle
        return crateName.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "") // Remove special chars
                .replaceAll("\\s+", "-") // Replace spaces with hyphens
                .replaceAll("-+", "-") // Remove multiple hyphens
                .replaceAll("^-|-$", ""); // Remove leading/trailing hyphens
    }
}