package page.crates.controller;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
import page.crates.service.ViewTrackingService;

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
    @Resource
    private ViewTrackingService viewTrackingService;

    @GetMapping("/user/{username}")
    public SpotifyUser getPublicUserProfile(@PathVariable String username) {
        log.info("Request received for public user profile: {}", username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        
        if (user.isPrivateProfile()) {
            throw new UnauthorizedAccessException();
        }
        
        return userMapper.map(user);
    }

    @GetMapping("/user/{username}/crates")
    public Page<Crate> getPublicUserCrates(@PathVariable String username,
                                          @RequestParam(value = "search", required = false) String search,
                                          final Pageable pageable) {
        log.info("Request received for public crates for user: {}", username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        
        if (user.isPrivateProfile()) {
            throw new UnauthorizedAccessException();
        }
        
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
    public Crate isPublicCrate(@PathVariable String username, @PathVariable String handle, HttpServletRequest request) {
        log.info("Request received for public crate: {} by user: {}", handle, username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        page.crates.entity.Crate crate = crateService.findByUserAndHandle(user, handle);
        
        if (user.isPrivateProfile() || !crate.isPublicCrate()) {
            throw new UnauthorizedAccessException();
        }
        
        // Record view (anonymous since this is public endpoint)
        viewTrackingService.recordView(crate, null, request);
        
        return crateDecorator.decorate(crateMapper.map(crate));
    }

    @GetMapping("/user/{username}/crate/{handle}/albums")
    public Page<CrateAlbum> isPublicCrateAlbums(@PathVariable String username, 
                                                 @PathVariable String handle,
                                                 @RequestParam(value = "search", required = false) String search,
                                                 final Pageable pageable) {
        log.info("Request received for albums in public crate: {} by user: {}", handle, username);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(username);
        page.crates.entity.Crate crate = crateService.findByUserAndHandle(user, handle);
        
        if (user.isPrivateProfile() || !crate.isPublicCrate()) {
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
        int pageSize = Math.min(pageable.getPageSize(), 10);
        Pageable limitedPageable = PageRequest.of(pageable.getPageNumber(), pageSize, pageable.getSort());
        
        return crateService.findAllPublic(limitedPageable)
                .map(crateMapper::map)
                .map(crateDecorator::decorate);
    }

    @GetMapping("/crates/trending")
    public Page<Crate> getTrendingCrates(final Pageable pageable) {
        log.info("Request received for trending crates with pageable: {}", pageable);
        
        // Validate and limit page size to maximum of 10
        int pageSize = Math.min(pageable.getPageSize(), 10);
        Pageable trendingPageable = PageRequest.of(pageable.getPageNumber(), pageSize);
        
        return crateService.findAllPublicByTrending(trendingPageable)
                .map(crateMapper::map)
                .map(crateDecorator::decorate);
    }

    @PostMapping("/crate/{crateId}/view")
    public void recordCrateView(@PathVariable Long crateId, @RequestBody(required = false) ViewRequest viewRequest, HttpServletRequest request) {
        log.info("Request received to record view for crate: {}", crateId);
        
        try {
            page.crates.entity.Crate crate = crateService.findById(crateId);
            
            if (!crate.isPublicCrate()) {
                throw new UnauthorizedAccessException();
            }
            
            if (viewRequest != null) {
                // Use provided view data (from Go service)
                viewTrackingService.recordView(crate, null, viewRequest.ipAddress(), viewRequest.userAgent(), viewRequest.referrer());
            } else {
                // Use request data (direct API call)
                viewTrackingService.recordView(crate, null, request);
            }
        } catch (Exception e) {
            log.error("Error recording view for crate {}: {}", crateId, e.getMessage());
            // Don't throw error to client - view tracking is not critical
        }
    }

    // DTO classes
    public record ViewRequest(String ipAddress, String userAgent, String referrer) {}
}