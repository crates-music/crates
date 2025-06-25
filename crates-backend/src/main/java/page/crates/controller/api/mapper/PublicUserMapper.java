package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.PublicUser;
import page.crates.entity.SpotifyUser;

@Mapper(componentModel = MapperComponentModels.SPRING)
public interface PublicUserMapper {
    PublicUser map(SpotifyUser user);
}