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
import page.crates.entity.SpotifyUser;
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
        
        return apiEvent;
    }

    // DTO class
    public record HasNewEventsResponse(boolean hasNewEvents) {}
}