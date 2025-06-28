package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.entity.CrateEvent;
import page.crates.entity.SpotifyUser;

import java.time.Instant;

public interface FeedService {
    
    /**
     * Get the activity feed for a user (events from users they follow)
     * @param user The user requesting their feed
     * @param pageable Pagination parameters
     * @return Page of activity events from followed users
     */
    Page<CrateEvent> getUserFeed(SpotifyUser user, Pageable pageable);
    
    /**
     * Get feed events after a specific time (for real-time updates)
     * @param user The user requesting their feed
     * @param after Only return events after this time
     * @param pageable Pagination parameters
     * @return Page of recent activity events
     */
    Page<CrateEvent> getUserFeedAfter(SpotifyUser user, Instant after, Pageable pageable);
    
    /**
     * Get feed events before a specific time (for loading older content)
     * @param user The user requesting their feed
     * @param before Only return events before this time
     * @param pageable Pagination parameters
     * @return Page of older activity events
     */
    Page<CrateEvent> getUserFeedBefore(SpotifyUser user, Instant before, Pageable pageable);
    
    /**
     * Check if user has any new feed events since a given time
     * @param user The user
     * @param since Check for events after this time
     * @return true if there are new events
     */
    boolean hasNewFeedEvents(SpotifyUser user, Instant since);
}