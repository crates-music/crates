package page.crates.service;

import jakarta.annotation.Resource;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import page.crates.controller.api.SearchType;
import page.crates.entity.Album;
import page.crates.exception.SpotifyAlbumNotFoundException;
import page.crates.repository.AlbumRepository;
import page.crates.service.mapper.SpotifyAlbumMapper;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.spotify.client.SpotifyAuth;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlbumServiceImpl implements AlbumService {
    @Resource
    private Spotify spotify;
    @Resource
    private SpotifyAuth spotifyAuth;
    @Resource
    private SpotifyAlbumMapper spotifyAlbumMapper;
    @Resource
    private AlbumRepository albumRepository;
    @Resource
    private ArtistService artistService;
    @Resource
    private ImageService imageService;
    @Resource
    private GenreService genreService;
    @Resource
    private LibraryService libraryService;

    @Override
    public Album findOrCreate(String spotifyAlbumId) {
        final Album existing = albumRepository.findOneBySpotifyId(spotifyAlbumId);
        if (null != existing) {
            return existing;
        }
        final String token = spotifyAuth.getServiceToken().getAccessToken();
        final page.crates.spotify.client.api.Album spotifyAlbum = spotify.getAlbum(Context.forToken(token), spotifyAlbumId);
        if (null == spotifyAlbum) {
            throw new SpotifyAlbumNotFoundException(spotifyAlbumId);
        }
        final Album album = spotifyAlbumMapper.map(spotifyAlbum);
        saveSubEntities(album);
        return albumRepository.save(album);
    }

    @Override
    public Album findOrCreate(Album album) {
        final Album existing = albumRepository.findOneBySpotifyId(album.getSpotifyId());
        if (null != existing) {
            return existing;
        }
        saveSubEntities(album);
        return albumRepository.save(album);
    }

    private void saveSubEntities(Album album) {
        if (CollectionUtils.isNotEmpty(album.getArtists())) {
            album.setArtists(
                    album.getArtists().stream()
                            .map(artistService::findOrCreate)
                            .collect(Collectors.toSet()));
        }
        if (CollectionUtils.isNotEmpty(album.getImages())) {
            album.setImages(
                    album.getImages().stream()
                            .map(imageService::save)
                            .collect(Collectors.toSet()));
        }
        if (CollectionUtils.isNotEmpty(album.getGenres())) {
            album.setGenres(
                    album.getGenres().stream()
                            .map(genreService::findOrCreate)
                            .collect(Collectors.toSet()));
        }
    }

    @Override
    public Page<Album> search(final String search,
                              final SearchType searchType,
                              final Pageable pageable) {
        if (SearchType.LIBRARY == searchType) {
            return libraryService.searchLibraryAlbums(search, pageable)
                    .map(libraryAlbum -> libraryAlbum.getAlbum());
        }
        final String token = spotifyAuth.getServiceToken().getAccessToken();
        final Context context = Context.forToken(token);
        return spotify.searchAlbums(context, search, pageable)
                .map(spotifyAlbumMapper::map);
    }

    @Override
    public Page<Album> searchHybrid(final String search, final Pageable pageable) {
        // Get library results first
        final Page<Album> libraryResults = search(search, SearchType.LIBRARY, pageable);
        
        // Always fetch global results to ensure good discovery
        // Fetch at least 20 global results, or more if requested page size is larger
        final int globalFetchSize = Math.max(20, pageable.getPageSize());
        final Pageable globalPageable = PageRequest.of(0, globalFetchSize, pageable.getSort());
        final Page<Album> globalResults = search(search, SearchType.GLOBAL, globalPageable);
        
        // Combine results - library first, then global
        final List<Album> combinedContent = new ArrayList<>();
        combinedContent.addAll(libraryResults.getContent());
        
        // Add global results, filtering out any duplicates that might already be in library
        globalResults.getContent().stream()
            .filter(globalAlbum -> libraryResults.getContent().stream()
                .noneMatch(libraryAlbum -> libraryAlbum.getSpotifyId().equals(globalAlbum.getSpotifyId())))
            .forEach(combinedContent::add);
        
        return new PageImpl<>(combinedContent, pageable, combinedContent.size());
    }
}
