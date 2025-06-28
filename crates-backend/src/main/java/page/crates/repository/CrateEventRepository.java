package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.CrateEvent;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.CrateEventType;

import java.time.Instant;
import java.util.List;

@Repository
public interface CrateEventRepository extends JpaRepository<CrateEvent, Long> {
    
    // Get feed events for users that the given user is following
    @Query("SELECT ce FROM CrateEvent ce " +
           "WHERE ce.user.id IN :followingUserIds " +
           "ORDER BY ce.createdAt DESC")
    Page<CrateEvent> findFeedEventsForFollowingUsers(List<Long> followingUserIds, Pageable pageable);
    
    // Get recent events for a specific user
    @Query("SELECT ce FROM CrateEvent ce " +
           "WHERE ce.user = :user " +
           "ORDER BY ce.createdAt DESC")
    Page<CrateEvent> findByUser(SpotifyUser user, Pageable pageable);
    
    // Get events by type
    @Query("SELECT ce FROM CrateEvent ce " +
           "WHERE ce.eventType = :eventType " +
           "ORDER BY ce.createdAt DESC")
    Page<CrateEvent> findByEventType(CrateEventType eventType, Pageable pageable);
    
    // Get events for a specific crate
    @Query("SELECT ce FROM CrateEvent ce " +
           "WHERE ce.crate.id = :crateId " +
           "ORDER BY ce.createdAt DESC")
    Page<CrateEvent> findByCrateId(Long crateId, Pageable pageable);
    
    // Get events after a specific time (for incremental loading)
    @Query("SELECT ce FROM CrateEvent ce " +
           "WHERE ce.user.id IN :followingUserIds " +
           "AND ce.createdAt > :after " +
           "ORDER BY ce.createdAt DESC")
    Page<CrateEvent> findFeedEventsAfter(List<Long> followingUserIds, Instant after, Pageable pageable);
    
    // Get events before a specific time (for pagination)
    @Query("SELECT ce FROM CrateEvent ce " +
           "WHERE ce.user.id IN :followingUserIds " +
           "AND ce.createdAt < :before " +
           "ORDER BY ce.createdAt DESC")
    Page<CrateEvent> findFeedEventsBefore(List<Long> followingUserIds, Instant before, Pageable pageable);
    
    // Count events for a user
    @Query("SELECT COUNT(ce) FROM CrateEvent ce WHERE ce.user = :user")
    Long countByUser(SpotifyUser user);
    
    // Delete old events (for cleanup)
    @Query("DELETE FROM CrateEvent ce WHERE ce.createdAt < :before")
    void deleteEventsOlderThan(Instant before);
}