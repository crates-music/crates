package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.PublicUser;
import page.crates.entity.SpotifyUser;

import java.util.List;

@Mapper(componentModel = MapperComponentModels.SPRING)
public interface PublicUserMapper {
    PublicUser map(SpotifyUser user);
    List<PublicUser> toPublicUsers(List<SpotifyUser> users);
}