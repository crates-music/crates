package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.CrateEvent;
import page.crates.controller.api.mapper.CrateEventMapper;
import page.crates.controller.api.mapper.AlbumMapper;
import page.crates.entity.SpotifyUser;
import page.crates.repository.AlbumRepository;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.CurrentUserService;
import page.crates.service.CrateDecorator;
import page.crates.service.FeedService;

import java.time.Instant;

@RestController
@RequestMapping("/v1/feed")
@Slf4j
public class FeedController {

    @Resource
    private FeedService feedService;
    
    @Resource
    private CurrentUserService currentUserService;
    
    @Resource
    private CrateEventMapper crateEventMapper;
    
    @Resource
    private CrateDecorator crateDecorator;
    
    @Resource
    private AlbumRepository albumRepository;
    
    @Resource
    private AlbumMapper albumMapper;

    @GetMapping
    @SpotifyAuthorization
    public Page<CrateEvent> getFeed(Pageable pageable) {
        log.info("Getting feed for current user");
        
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        return feedService.getUserFeed(currentUser, pageable)
                .map(this::mapAndDecorateCrateEvent);
    }

    @GetMapping("/since")
    @SpotifyAuthorization
    public Page<CrateEvent> getFeedSince(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since,
            Pageable pageable) {
        log.info("Getting feed for current user since {}", since);
        
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        return feedService.getUserFeedAfter(currentUser, since, pageable)
                .map(this::mapAndDecorateCrateEvent);
    }

    @GetMapping("/before")
    @SpotifyAuthorization
    public Page<CrateEvent> getFeedBefore(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
            Pageable pageable) {
        log.info("Getting feed for current user before {}", before);
        
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        return feedService.getUserFeedBefore(currentUser, before, pageable)
                .map(this::mapAndDecorateCrateEvent);
    }

    @GetMapping("/has-new")
    @SpotifyAuthorization
    public HasNewEventsResponse hasNewEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
        log.info("Checking for new feed events since {}", since);
        
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        boolean hasNew = feedService.hasNewFeedEvents(currentUser, since);
        
        return new HasNewEventsResponse(hasNew);
    }

    // Helper method to map and decorate CrateEvent
    private CrateEvent mapAndDecorateCrateEvent(page.crates.entity.CrateEvent entityEvent) {
        CrateEvent apiEvent = crateEventMapper.map(entityEvent);
        
        // Decorate the crate if present
        if (apiEvent.getCrate() != null) {
            apiEvent.setCrate(crateDecorator.decorate(apiEvent.getCrate()));
        }
        
        // Filter sensitive information from followedUser
        if (apiEvent.getFollowedUser() != null) {
            apiEvent.setFollowedUser(sanitizePublicUser(apiEvent.getFollowedUser()));
        }
        
        // Populate album details for ALBUM_ADDED events
        if (entityEvent.getEventType() == page.crates.entity.enums.CrateEventType.ALBUM_ADDED && 
            entityEvent.getAlbumIdsList() != null && !entityEvent.getAlbumIdsList().isEmpty()) {
            apiEvent.setAlbums(getAlbumDetails(entityEvent.getAlbumIdsList()));
        }
        
        return apiEvent;
    }

    // Helper method to sanitize user info for public consumption
    private page.crates.controller.api.SpotifyUser sanitizePublicUser(page.crates.controller.api.SpotifyUser user) {
        return page.crates.controller.api.SpotifyUser.builder()
                .id(user.getId())
                .spotifyId(user.getSpotifyId())
                .displayName(user.getDisplayName())
                .handle(user.getHandle())
                .bio(user.getBio())
                .images(user.getImages())
                // Explicitly exclude sensitive fields: email, emailOptIn, privateProfile, etc.
                .build();
    }

    // Helper method to get album details
    private java.util.List<page.crates.controller.api.Album> getAlbumDetails(java.util.List<Long> albumIds) {
        try {
            return albumRepository.findAllById(albumIds).stream()
                    .map(albumMapper::map)
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to fetch album details for IDs: {}, error: {}", albumIds, e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    // DTO class
    public record HasNewEventsResponse(boolean hasNewEvents) {}
}