package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.CrateAlbum;

@Mapper(componentModel = MapperComponentModels.SPRING)
public interface CrateAlbumMapper {
    CrateAlbum map(page.crates.entity.CrateAlbum crateAlbum);
}
