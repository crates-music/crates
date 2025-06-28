package page.crates.controller.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import page.crates.controller.api.UserFollow;

@Mapper(componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {UserMapper.class})
public interface UserFollowMapper {
    UserFollow map(page.crates.entity.UserFollow userFollow);
    page.crates.entity.UserFollow map(UserFollow userFollow);
}