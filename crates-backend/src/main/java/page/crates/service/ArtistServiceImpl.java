package page.crates.service;

import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.entity.Artist;
import page.crates.entity.Genre;
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
        // Check if artist already has been fetched from Spotify
        Boolean genresFetched = artistRepository.hasGenresFetched(artist.getSpotifyId());

        if (Boolean.TRUE.equals(genresFetched)) {
            // Artist genres already fetched, just load and return
            return artistRepository.findOneBySpotifyId(artist.getSpotifyId());
        }

        // Check if artist exists
        final Artist existing = artistRepository.findOneBySpotifyId(artist.getSpotifyId());

        if (existing != null) {
            // Artist exists but genres not fetched, refresh from Spotify to backfill
            return refreshArtistFromSpotify(existing);
        }

        // Create new artist from Spotify
        return createArtistFromSpotify(artist.getSpotifyId());
    }

    private Artist createArtistFromSpotify(String spotifyId) {
        final String token = spotifyAuth.getServiceToken().getAccessToken();
        final Context context = Context.forToken(token);
        final page.crates.spotify.client.api.Artist spotifyArtist = spotify.getArtist(context, spotifyId);
        if (null == spotifyArtist) {
            throw new SpotifyArtistNotFoundException(spotifyId);
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
        // Mark as fetched since we just got data from Spotify
        mapped.setGenresFetched(true);
        return artistRepository.save(mapped);
    }

    private Artist refreshArtistFromSpotify(Artist existing) {
        final String token = spotifyAuth.getServiceToken().getAccessToken();
        final Context context = Context.forToken(token);
        final page.crates.spotify.client.api.Artist spotifyArtist = spotify.getArtist(context, existing.getSpotifyId());
        if (null == spotifyArtist) {
            // If Spotify fetch fails, return existing artist as-is
            return existing;
        }

        // Update genres from Spotify
        if (CollectionUtils.isNotEmpty(spotifyArtist.getGenres())) {
            existing.setGenres(
                    spotifyArtist.getGenres().stream()
                          .map(genreName -> Genre.builder().name(genreName).build())
                          .map(genreService::findOrCreate)
                          .collect(Collectors.toSet()));
        }

        // Mark as fetched regardless of whether Spotify had genres
        existing.setGenresFetched(true);

        return artistRepository.save(existing);
    }
}
