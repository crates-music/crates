package page.crates.service;

import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.entity.Artist;
import page.crates.exception.SpotifyArtistNotFoundException;
import page.crates.repository.ArtistRepository;
import page.crates.service.mapper.SpotifyArtistMapper;

import jakarta.annotation.Resource;
import page.crates.spotify.client.SpotifyAuth;

import java.util.stream.Collectors;

@Service
public class ArtistServiceImpl implements ArtistService {
    @Resource
    private Spotify spotify;
    @Resource
    private SpotifyAuth spotifyAuth;
    @Resource
    private ArtistRepository artistRepository;
    @Resource
    private SpotifyArtistMapper spotifyArtistMapper;
    @Resource
    private GenreService genreService;
    @Resource
    private ImageService imageService;

    @Override
    public Artist findOrCreate(Artist artist) {
        final Artist existing = artistRepository.findOneBySpotifyId(artist.getSpotifyId());
        if (null != existing) {
            return existing;
        }
        final String token = spotifyAuth.getServiceToken().getAccessToken();
        final Context context = Context.forToken(token);
        final page.crates.spotify.client.api.Artist spotifyArtist = spotify.getArtist(context, artist.getSpotifyId());
        if (null == spotifyArtist) {
            throw new SpotifyArtistNotFoundException(artist.getSpotifyId());
        }
        final Artist mapped = spotifyArtistMapper.map(spotifyArtist);
        if (CollectionUtils.isNotEmpty(mapped.getGenres())) {
            mapped.setGenres(
                    mapped.getGenres().stream()
                          .map(genreService::findOrCreate)
                          .collect(Collectors.toSet()));
        }
        if (CollectionUtils.isNotEmpty(mapped.getImages())) {
            mapped.setImages(
                    mapped.getImages().stream()
                          .map(imageService::save)
                          .collect(Collectors.toSet()));
        }
        return artistRepository.save(artist);
    }
}
