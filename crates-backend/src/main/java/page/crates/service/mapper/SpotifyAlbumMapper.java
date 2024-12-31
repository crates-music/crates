package page.crates.service.mapper;


import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.springframework.stereotype.Component;
import page.crates.spotify.client.api.Album;
import page.crates.entity.Genre;

import jakarta.annotation.Resource;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SpotifyAlbumMapper {
    @Resource
    private ImageSetMapper imageSetMapper;
    @Resource
    private SpotifyArtistSetMapper spotifyArtistSetMapper;

    public page.crates.entity.Album map(Album album) {
        if (null == album) {
            return null;
        }
        return page.crates.entity.Album.builder()
                .spotifyId(album.getId())
                .name(album.getName())
                .href(album.getHref())
                .images(imageSetMapper.map(album.getImages()))
                .artists(spotifyArtistSetMapper.map(album.getArtists()))
                .upc(mapUpc(album))
                .genres(mapGenres(album.getGenres()))
                .releaseDate(mapReleaseDate(album.getReleaseDate(), album.getReleaseDatePrecision()))
                .build();
    }

    private Set<Genre> mapGenres(List<String> genres) {
        if (CollectionUtils.isEmpty(genres)) {
            return Set.of();
        }
        return genres.stream()
                .map(genre -> Genre.builder()
                        .name(genre)
                        .build())
                .collect(Collectors.toSet());
    }

    private Instant mapReleaseDate(String releaseDate, String precision) {
        if ("year".equalsIgnoreCase(precision)) {
            return LocalDate.ofYearDay(Integer.parseInt(releaseDate), 1)
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant();
        }
        return LocalDate.parse(releaseDate)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();
    }

    private String mapUpc(Album album) {
        if (MapUtils.isEmpty(album.getExternalIds())) {
            return null;
        }
        return album.getExternalIds().get("upc");
    }
}

