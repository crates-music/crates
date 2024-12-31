package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.SpotifyUser;

@Mapper(componentModel = MapperComponentModels.SPRING)
public interface UserMapper {
    SpotifyUser map(page.crates.entity.SpotifyUser user);
}
