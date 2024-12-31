package page.crates.service.mapper;

import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Component;
import page.crates.entity.Artist;

import jakarta.annotation.Resource;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SpotifyArtistSetMapper {
    @Resource
    private SpotifyArtistMapper spotifyArtistMapper;

    public Set<Artist> map(List<page.crates.spotify.client.api.Artist> artists) {
        if (CollectionUtils.isEmpty(artists)) {
            return Set.of();
        }
        return artists.stream()
                .map(spotifyArtistMapper::map)
                .collect(Collectors.toSet());
    }
}
