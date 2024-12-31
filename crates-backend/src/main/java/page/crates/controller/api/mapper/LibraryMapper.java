package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import page.crates.controller.api.Library;

@Mapper(componentModel = "spring")
public interface LibraryMapper {
    Library map(page.crates.entity.Library library);
}
