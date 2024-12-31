package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.Album;

@Mapper(componentModel = MapperComponentModels.SPRING)
public interface AlbumMapper {
    Album map(page.crates.entity.Album album);

    page.crates.entity.Album map(Album album);
}
