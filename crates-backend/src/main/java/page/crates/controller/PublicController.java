package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.Crate;
import page.crates.controller.api.CrateAlbum;
import page.crates.controller.api.SpotifyUser;
import page.crates.controller.api.mapper.CrateAlbumMapper;
import page.crates.controller.api.mapper.CrateMapper;
import page.crates.controller.api.mapper.UserMapper;
import page.crates.exception.UnauthorizedAccessException;
import page.crates.service.CrateDecorator;
import page.crates.service.CrateService;
import page.crates.service.UserService;

@RestController
@RequestMapping("/v1/public")
@Slf4j
public class PublicController {
    @Resource
    private UserService userService;
    @Resource
    private UserMapper userMapper;
    @Resource
    private CrateService crateService;
    @Resource
    private CrateMapper crateMapper;
    @Resource
    private CrateAlbumMapper crateAlbumMapper;
    @Resource
    private CrateDecorator crateDecorator;

    @GetMapping("/user/{username}")
    public SpotifyUser getPublicUserProfile(@PathVariable String username) {
        log.info("Request received for public user profile: {}", username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        return userMapper.map(user);
    }

    @GetMapping("/user/{username}/crates")
    public Page<Crate> getPublicUserCrates(@PathVariable String username,
                                          @RequestParam(value = "search", required = false) String search,
                                          final Pageable pageable) {
        log.info("Request received for public crates for user: {}", username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        
        if (StringUtils.isBlank(search)) {
            return crateService.findPublicByUser(user, pageable)
                    .map(crateMapper::map)
                    .map(crateDecorator::decorate);
        }
        return crateService.searchPublicByUser(user, search, pageable)
                .map(crateMapper::map)
                .map(crateDecorator::decorate);
    }

    @GetMapping("/user/{username}/crate/{handle}")
    public Crate getPublicCrate(@PathVariable String username, @PathVariable String handle) {
        log.info("Request received for public crate: {} by user: {}", handle, username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        page.crates.entity.Crate crate = crateService.findByUserAndHandle(user, handle);
        
        if (!Boolean.TRUE.equals(crate.getPublicCrate())) {
            throw new UnauthorizedAccessException();
        }
        
        return crateDecorator.decorate(crateMapper.map(crate));
    }

    @GetMapping("/user/{username}/crate/{handle}/albums")
    public Page<CrateAlbum> getPublicCrateAlbums(@PathVariable String username, 
                                                 @PathVariable String handle,
                                                 @RequestParam(value = "search", required = false) String search,
                                                 final Pageable pageable) {
        log.info("Request received for albums in public crate: {} by user: {}", handle, username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        page.crates.entity.Crate crate = crateService.findByUserAndHandle(user, handle);
        
        if (!Boolean.TRUE.equals(crate.getPublicCrate())) {
            throw new UnauthorizedAccessException();
        }
        
        if (StringUtils.isNotBlank(search)) {
            return crateService.searchPublicAlbums(crate.getId(), search, pageable)
                    .map(crateAlbumMapper::map);
        }
        return crateService.getPublicAlbums(crate.getId(), pageable)
                .map(crateAlbumMapper::map);
    }

    @GetMapping("/crates")
    public Page<Crate> getAllPublicCrates(final Pageable pageable) {
        log.info("Request received for all public crates with pageable: {}", pageable);
        
        // Validate and limit page size to maximum of 10
        Pageable limitedPageable = pageable;
        if (pageable.getPageSize() > 10) {
            limitedPageable = PageRequest.of(pageable.getPageNumber(), 10, pageable.getSort());
        }
        
        return crateService.findAllPublic(limitedPageable)
                .map(crateMapper::map)
                .map(crateDecorator::decorate);
    }
}