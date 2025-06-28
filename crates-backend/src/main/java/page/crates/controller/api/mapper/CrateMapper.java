package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.Crate;

import java.util.List;

@Mapper(componentModel = MapperComponentModels.SPRING, uses = {PublicUserMapper.class})
public interface CrateMapper {
    Crate map(page.crates.entity.Crate crate);

    page.crates.entity.Crate map(Crate crate);
    
    List<Crate> toCrates(List<page.crates.entity.Crate> crates);
}
