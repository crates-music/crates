package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.Crate;

@Mapper(componentModel = MapperComponentModels.SPRING, uses = {PublicUserMapper.class})
public interface CrateMapper {
    Crate map(page.crates.entity.Crate crate);

    page.crates.entity.Crate map(Crate crate);
}
