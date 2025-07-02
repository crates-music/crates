package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.entity.Crate;
import page.crates.entity.CrateEvent;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.CrateEventType;

import java.time.Instant;
import java.util.List;

public interface CrateEventService {
    
    /**
     * Record a crate being released (made public)
     * @param user The user who released the crate
     * @param crate The crate that was released
     * @return The created event
     */
    CrateEvent recordCrateReleased(SpotifyUser user, Crate crate);
    
    /**
     * Record albums being added to a crate
     * @param user The user who added the albums
     * @param crate The crate that albums were added to
     * @param albumIds List of album IDs that were added
     * @return The created event
     */
    CrateEvent recordAlbumsAdded(SpotifyUser user, Crate crate, List<Long> albumIds);
    
    /**
     * Record a crate being added to a user's collection
     * @param user The user who added the crate to their collection
     * @param crate The crate that was added to collection
     * @return The created event
     */
    CrateEvent recordCrateAddedToCollection(SpotifyUser user, Crate crate);
    
    /**
     * Record a user following another user
     * @param follower The user who followed
     * @param followedUser The user who was followed
     * @return The created event
     */
    CrateEvent recordUserFollowed(SpotifyUser follower, SpotifyUser followedUser);
    
    /**
     * Get events for a specific user
     * @param user The user
     * @param pageable Pagination parameters
     * @return Page of events for the user
     */
    Page<CrateEvent> getUserEvents(SpotifyUser user, Pageable pageable);
    
    /**
     * Get events by type
     * @param eventType The event type to filter by
     * @param pageable Pagination parameters
     * @return Page of events of the specified type
     */
    Page<CrateEvent> getEventsByType(CrateEventType eventType, Pageable pageable);
    
    /**
     * Get events for a specific crate
     * @param crateId The crate ID
     * @param pageable Pagination parameters
     * @return Page of events for the crate
     */
    Page<CrateEvent> getCrateEvents(Long crateId, Pageable pageable);
    
    /**
     * Get feed events for users being followed
     * @param followingUserIds List of user IDs being followed
     * @param pageable Pagination parameters
     * @return Page of feed events
     */
    Page<CrateEvent> getFeedEvents(List<Long> followingUserIds, Pageable pageable);
    
    /**
     * Get feed events after a specific time (for incremental loading)
     * @param followingUserIds List of user IDs being followed
     * @param after Only return events after this time
     * @param pageable Pagination parameters
     * @return Page of feed events
     */
    Page<CrateEvent> getFeedEventsAfter(List<Long> followingUserIds, Instant after, Pageable pageable);
    
    /**
     * Get feed events before a specific time (for pagination)
     * @param followingUserIds List of user IDs being followed
     * @param before Only return events before this time
     * @param pageable Pagination parameters
     * @return Page of feed events
     */
    Page<CrateEvent> getFeedEventsBefore(List<Long> followingUserIds, Instant before, Pageable pageable);
    
    /**
     * Clean up old events (for maintenance)
     * @param before Delete events older than this time
     */
    void cleanupOldEvents(Instant before);
}