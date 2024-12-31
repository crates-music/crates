package page.crates.service.mapper;

import jakarta.annotation.Resource;
import org.springframework.stereotype.Component;
import page.crates.spotify.client.api.User;
import page.crates.entity.SpotifyUser;


@Component
public class SpotifyUserMapper {
    @Resource
    private ImageSetMapper imageSetMapper;

    public SpotifyUser map(User api) {
        if (null == api) {
            return null;
        }
        final SpotifyUser user = new SpotifyUser();
        user.setEmail(api.getEmail());
        user.setHref(api.getHref());
        user.setDisplayName(api.getDisplayName());
        user.setCountry(api.getCountry());
        user.setSpotifyId(api.getId());
        user.setSpotifyUri(api.getUri());
        user.setImages(imageSetMapper.map(api.getImages()));
        return user;
    }
}
