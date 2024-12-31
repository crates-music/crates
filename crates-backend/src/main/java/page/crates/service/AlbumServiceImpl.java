package page.crates.service;

import jakarta.annotation.Resource;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Page;
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
            throw new UnsupportedOperationException("not implemented");
        }
        final String token = spotifyAuth.getServiceToken().getAccessToken();
        final Context context = Context.forToken(token);
        return spotify.searchAlbums(context, search, pageable)
                .map(spotifyAlbumMapper::map);
    }
}
