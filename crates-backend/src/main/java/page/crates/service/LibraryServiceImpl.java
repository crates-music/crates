package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import page.crates.ai.SimpleLibraryAlbum;
import page.crates.controller.api.LibraryAlbumFilter;
import page.crates.entity.Artist;
import page.crates.entity.Library;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.LibraryState;
import page.crates.exception.LibraryNotFoundException;
import page.crates.repository.LibraryAlbumRepository;
import page.crates.repository.LibraryRepository;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.spotify.client.api.Album;
import page.crates.util.SystemTimeFacade;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LibraryServiceImpl implements LibraryService {
    @Resource
    private Spotify spotify;
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private LibraryRepository libraryRepository;
    @Resource
    private LibraryAlbumRepository libraryAlbumRepository;
    @Resource
    private SystemTimeFacade systemTimeFacade;

    @Override
    public Library findOrCreateLibrary(SpotifyUser user) {
        final Instant now = systemTimeFacade.now();
        return libraryRepository.findOneBySpotifyUserId(user.getId())
                .orElseGet(() -> libraryRepository.save(
                        Library.builder()
                                .spotifyUser(user)
                                .state(LibraryState.IMPORTING)
                                .createdAt(now)
                                .updatedAt(now)
                                .build()));
    }

    @Override
    public Page<Album> getAlbums(Pageable pageable) {
        final SpotifyUser user = currentUserService.getCurrentUser();
        final Context context = Context.forToken(user.getToken().getAccessToken());
        return spotify.getSavedAlbums(context, pageable);
    }

    @Override
    public Library getLibrary(SpotifyUser user) {
        return libraryRepository.findOneBySpotifyUserId(user.getId())
                .orElseThrow(() -> new LibraryNotFoundException(user.getId()));
    }

    @Override
    public Page<LibraryAlbum> getLibraryAlbums(Pageable pageable) {
        final SpotifyUser user = currentUserService.getCurrentUser();
        return libraryAlbumRepository.findActiveBySpotifyUser(user, pageable);
    }

    @Override
    public Library save(Library library) {
        return libraryRepository.save(library);
    }

    @Override
    public Page<LibraryAlbum> searchLibraryAlbums(String search, Pageable pageable, LibraryAlbumFilter... filters) {
        final SpotifyUser user = currentUserService.getCurrentUser();
        if (ArrayUtils.isNotEmpty(filters) &&
            Arrays.stream(filters).anyMatch(filter -> LibraryAlbumFilter.EXCLUDE_CRATED == filter)) {
            if (StringUtils.isBlank(search)) {
                return libraryAlbumRepository.findActiveUncratedBySpotifyUser(user.getId(), pageable);
            }
            return libraryAlbumRepository.findActiveUncratedBySpotifyUserAndSearchTerm(
                    user.getId(), search, pageable);
        }
        if (StringUtils.isNotBlank(search)) {
            return libraryAlbumRepository.findActiveBySpotifyUserAndSearchTerm(user.getId(), search, pageable);
        }
        return libraryAlbumRepository.findActiveBySpotifyUser(user, pageable);
    }
    
    @Override
    public List<SimpleLibraryAlbum> getRecentLibraryAlbumsForAI(String userId, int limit) {
        // Get recent albums for the user
        Pageable pageable = PageRequest.of(0, limit);
        Page<LibraryAlbum> recentAlbums = libraryAlbumRepository.findRecentActiveBySpotifyUserId(Long.valueOf(userId), pageable);
        
        // Convert to simplified format for AI
        return recentAlbums.getContent().stream()
                .map(this::convertToSimpleLibraryAlbum)
                .collect(Collectors.toList());
    }
    
    private SimpleLibraryAlbum convertToSimpleLibraryAlbum(LibraryAlbum libraryAlbum) {
        page.crates.entity.Album album = libraryAlbum.getAlbum();
        
        // Get primary artist name
        String artistName = album.getArtists().stream()
                .findFirst()
                .map(Artist::getName)
                .orElse("Unknown Artist");
        
        // Format release year 
        String year = formatReleaseYear(album.getReleaseDate());
        
        return SimpleLibraryAlbum.builder()
                .artist(artistName)
                .album(album.getName())
                .year(year)
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
}
