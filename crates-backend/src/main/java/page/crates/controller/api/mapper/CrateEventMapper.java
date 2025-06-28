package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import page.crates.controller.api.CrateEvent;

@Mapper(componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {UserMapper.class, CrateMapper.class})
public interface CrateEventMapper {
    
    @Mapping(target = "albumIds", source = "albumIdsList")
    @Mapping(target = "user", source = "user")
    @Mapping(target = "crate", source = "crate")
    CrateEvent map(page.crates.entity.CrateEvent crateEvent);
}