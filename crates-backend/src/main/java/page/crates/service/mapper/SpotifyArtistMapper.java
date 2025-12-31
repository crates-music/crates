package page.crates.service.mapper;

import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Component;
import page.crates.entity.Artist;
import page.crates.entity.Genre;
import page.crates.service.GenreService;

import jakarta.annotation.Resource;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SpotifyArtistMapper {
    @Resource
    private ImageSetMapper imageSetMapper;

    @Resource
    private GenreService genreService;

    public Artist map(page.crates.spotify.client.api.Artist artist) {
        if (artist == null) {
            return null;
        }

        // Map genres from Spotify
        Set<Genre> genres = null;
        if (CollectionUtils.isNotEmpty(artist.getGenres())) {
            genres = artist.getGenres().stream()
                    .map(genreName -> Genre.builder().name(genreName).build())
                    .map(genreService::findOrCreate)
                    .collect(Collectors.toSet());
        }

        return Artist.builder()
                .spotifyId(artist.getId())
                .name(artist.getName())
                .popularity(artist.getPopularity())
                .spotifyUri(artist.getUri())
                .images(imageSetMapper.map(artist.getImages()))
                .genres(genres)
                .build();
    }
}
