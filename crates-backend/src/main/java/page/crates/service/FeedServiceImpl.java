package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.CrateEvent;
import page.crates.entity.SpotifyUser;
import page.crates.security.StructuredLogEntry;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@Transactional(readOnly = true)
public class FeedServiceImpl implements FeedService {

    @Resource
    private FollowService followService;
    
    @Resource
    private CrateEventService crateEventService;

    @Override
    public Page<CrateEvent> getUserFeed(SpotifyUser user, Pageable pageable) {
        log.debug("Getting user feed", 
            new StructuredLogEntry()
                .withUserId(user.getId())
                .withAction("get_user_feed")
                .with("pageSize", pageable.getPageSize())
                .with("pageNumber", pageable.getPageNumber())
        );
        
        // Get list of users this user is following
        List<Long> followingUserIds = followService.getFollowingUserIds(user);
        
        if (followingUserIds.isEmpty()) {
            log.debug("User not following anyone, returning empty feed", 
                new StructuredLogEntry()
                    .withUserId(user.getId())
                    .withAction("get_user_feed")
                    .with("result", "empty_feed")
                    .with("followingCount", 0)
            );
            return Page.empty(pageable);
        }
        
        log.debug("Fetching feed events for user", 
            new StructuredLogEntry()
                .withUserId(user.getId())
                .withAction("get_user_feed")
                .with("followingCount", followingUserIds.size())
        );
        return crateEventService.getFeedEvents(followingUserIds, pageable);
    }

    @Override
    public Page<CrateEvent> getUserFeedAfter(SpotifyUser user, Instant after, Pageable pageable) {
        log.debug("Getting feed for user {} after {}", user.getId(), after);
        
        List<Long> followingUserIds = followService.getFollowingUserIds(user);
        
        if (followingUserIds.isEmpty()) {
            return Page.empty(pageable);
        }
        
        return crateEventService.getFeedEventsAfter(followingUserIds, after, pageable);
    }

    @Override
    public Page<CrateEvent> getUserFeedBefore(SpotifyUser user, Instant before, Pageable pageable) {
        log.debug("Getting feed for user {} before {}", user.getId(), before);
        
        List<Long> followingUserIds = followService.getFollowingUserIds(user);
        
        if (followingUserIds.isEmpty()) {
            return Page.empty(pageable);
        }
        
        return crateEventService.getFeedEventsBefore(followingUserIds, before, pageable);
    }

    @Override
    public boolean hasNewFeedEvents(SpotifyUser user, Instant since) {
        log.debug("Checking for new feed events for user {} since {}", user.getId(), since);
        
        List<Long> followingUserIds = followService.getFollowingUserIds(user);
        
        if (followingUserIds.isEmpty()) {
            return false;
        }
        
        // Check if there are any events after the given time (limit to 1 for efficiency)
        Page<CrateEvent> events = crateEventService.getFeedEventsAfter(
                followingUserIds, 
                since, 
                PageRequest.of(0, 1)
        );
        
        boolean hasNewEvents = events.hasContent();
        log.debug("User {} has new events: {}", user.getId(), hasNewEvents);
        return hasNewEvents;
    }
}