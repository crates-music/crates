package page.crates.service.mapper;

import org.springframework.stereotype.Component;
import page.crates.entity.Artist;

import jakarta.annotation.Resource;

@Component
public class SpotifyArtistMapper {
    @Resource
    private ImageSetMapper imageSetMapper;

    public Artist map(page.crates.spotify.client.api.Artist artist) {
        return null == artist ? null : Artist.builder()
                .spotifyId(artist.getId())
                .name(artist.getName())
                .popularity(artist.getPopularity())
                .spotifyUri(artist.getUri())
                .images(imageSetMapper.map(artist.getImages()))
                .build();
    }
}
