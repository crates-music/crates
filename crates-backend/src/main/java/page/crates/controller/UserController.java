package page.crates.controller;

import feign.FeignException;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.ProfileUpdateRequest;
import page.crates.controller.api.SpotifyUser;
import page.crates.controller.api.mapper.UserMapper;
import page.crates.controller.api.mapper.PublicUserMapper;
import page.crates.controller.api.PublicUser;
import page.crates.exception.UnauthorizedAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.exception.ExpiredTokenException;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.CurrentUserService;
import page.crates.service.UserService;
import page.crates.service.CrateService;
import page.crates.service.CrateDecorator;
import page.crates.service.CrateCollectionService;
import page.crates.controller.api.mapper.CrateMapper;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/v1/user")
@Slf4j
public class UserController {
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private UserMapper userMapper;
    @Resource
    private PublicUserMapper publicUserMapper;
    @Resource
    private UserService userService;
    @Resource
    private CrateService crateService;
    @Resource
    private CrateMapper crateMapper;
    @Resource
    private CrateDecorator crateDecorator;
    @Resource
    private CrateCollectionService crateCollectionService;
    @Resource
    private Spotify spotify;

    @GetMapping(value = "/current")
    @SpotifyAuthorization
    public SpotifyUser getCurrentUser() {
        page.crates.entity.SpotifyUser user = currentUserService.getCurrentUser();
        try {
            spotify.getCurrentUser(Context.forToken(user.getToken().getAccessToken()));
        } catch (FeignException e) {
            if (e.status() == HttpStatus.UNAUTHORIZED.value()) {
                throw new ExpiredTokenException();
            }
        }
        return userMapper.map(user);
    }

    @PutMapping(value = "/profile")
    @SpotifyAuthorization
    public SpotifyUser updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        page.crates.entity.SpotifyUser updatedUser = userService.updateProfile(
                currentUser.getId(), 
                request.getHandle(), 
                request.getBio(),
                request.getPrivateProfile()
        );
        return userMapper.map(updatedUser);
    }

    @GetMapping(value = "/search")
    @SpotifyAuthorization
    public Page<SpotifyUser> searchUsers(@RequestParam String search, Pageable pageable) {
        log.info("Searching users with term: {}", search);
        return userService.searchUsers(search, pageable)
                .map(userMapper::map);
    }

    @GetMapping(value = "/profile/{identifier}")
    @SpotifyAuthorization  
    public SpotifyUser getUserProfile(@PathVariable String identifier) {
        log.info("Getting user profile for identifier: {}", identifier);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(identifier);
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        
        // Allow access to private profiles only for the profile owner
        if (user.isPrivateProfile() && !user.getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException();
        }
        
        return userMapper.map(user);
    }

    @GetMapping(value = "/handle/{handle}")
    @SpotifyAuthorization  
    public SpotifyUser getUserByHandle(@PathVariable String handle) {
        log.info("Getting user by handle: {}", handle);
        page.crates.entity.SpotifyUser user = userService.findByHandleOrSpotifyId(handle);
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        
        // Allow access to private profiles only for the profile owner
        if (user.isPrivateProfile() && !user.getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException();
        }
        
        return userMapper.map(user);
    }

    @GetMapping(value = "/{userId}")
    @SpotifyAuthorization
    public PublicUser getUserById(@PathVariable Long userId) {
        log.info("Getting user by ID: {}", userId);
        page.crates.entity.SpotifyUser user = userService.getUser(userId);
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        
        // Allow access to private profiles only for the profile owner
        if (user.isPrivateProfile() && !user.getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException();
        }
        
        return publicUserMapper.map(user);
    }

    @GetMapping(value = "/{userId}/crates")
    @SpotifyAuthorization
    public Page<page.crates.controller.api.Crate> getUserPublicCrates(
            @PathVariable Long userId, 
            @RequestParam(value = "search", required = false) String search,
            Pageable pageable) {
        log.info("Getting public crates for user: {}", userId);
        page.crates.entity.SpotifyUser user = userService.getUser(userId);
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        
        // Allow access to private profiles only for the profile owner
        if (user.isPrivateProfile() && !user.getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException();
        }
        
        return crateService.getUserPublicCrates(user, search, pageable)
                .map(crateMapper::map)
                .map(crateDecorator::decorate);
    }

    @GetMapping(value = "/{userId}/collection")
    @SpotifyAuthorization
    public Page<page.crates.controller.api.Crate> getUserPublicCollection(
            @PathVariable Long userId, 
            @RequestParam(value = "search", required = false) String search,
            Pageable pageable) {
        log.info("Getting public collection for user: {}", userId);
        page.crates.entity.SpotifyUser user = userService.getUser(userId);
        page.crates.entity.SpotifyUser currentUser = currentUserService.getCurrentUser();
        
        // Allow access to private profiles only for the profile owner
        if (user.isPrivateProfile() && !user.getId().equals(currentUser.getId())) {
            throw new UnauthorizedAccessException();
        }
        
        if (StringUtils.isNotBlank(search)) {
            return crateCollectionService.searchPublicUserCollection(user, search, pageable)
                    .map(collection -> crateDecorator.decorate(crateMapper.map(collection.getCrate())));
        }
        
        return crateCollectionService.getPublicUserCollection(user, pageable)
                .map(collection -> crateDecorator.decorate(crateMapper.map(collection.getCrate())));
    }
}
