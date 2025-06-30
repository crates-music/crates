package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Crate;
import page.crates.entity.CrateEvent;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.CrateEventType;
import page.crates.repository.CrateEventRepository;
import page.crates.security.StructuredLogEntry;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@Transactional
public class CrateEventServiceImpl implements CrateEventService {

    @Resource
    private CrateEventRepository crateEventRepository;

    @Override
    public CrateEvent recordCrateReleased(SpotifyUser user, Crate crate) {
        log.info("Recording crate released event for user {} and crate {}", user.getId(), crate.getId());
        
        CrateEvent event = CrateEvent.builder()
                .user(user)
                .crate(crate)
                .eventType(CrateEventType.CRATE_RELEASED)
                .createdAt(Instant.now())
                .build();
        
        CrateEvent saved = crateEventRepository.save(event);
        log.debug("Recorded crate released event with ID {}", saved.getId());
        return saved;
    }

    @Override
    public CrateEvent recordAlbumsAdded(SpotifyUser user, Crate crate, List<Long> albumIds) {
        log.info("Recording albums added event for user {} and crate {} with {} albums", 
                user.getId(), crate.getId(), albumIds.size());
        
        CrateEvent event = CrateEvent.builder()
                .user(user)
                .crate(crate)
                .eventType(CrateEventType.ALBUM_ADDED)
                .createdAt(Instant.now())
                .build();
        
        // Set album IDs using helper method
        event.setAlbumIdsList(albumIds);
        
        CrateEvent saved = crateEventRepository.save(event);
        log.debug("Recorded albums added event with ID {}", saved.getId());
        return saved;
    }

    @Override
    public CrateEvent recordCrateAddedToCollection(SpotifyUser user, Crate crate) {
        log.info("Recording crate added to collection event", 
            new StructuredLogEntry()
                .withUserId(user.getId())
                .withCrateId(crate.getId())
                .withAction("record_crate_event")
                .with("eventType", "CRATE_ADDED_TO_COLLECTION")
        );
        
        CrateEvent event = CrateEvent.builder()
                .user(user)
                .crate(crate)
                .eventType(CrateEventType.CRATE_ADDED_TO_COLLECTION)
                .createdAt(Instant.now())
                .build();
        
        CrateEvent saved = crateEventRepository.save(event);
        log.debug("Recorded crate event successfully", 
            new StructuredLogEntry()
                .withUserId(user.getId())
                .withCrateId(crate.getId())
                .withAction("record_crate_event")
                .with("eventType", "CRATE_ADDED_TO_COLLECTION")
                .with("eventId", saved.getId())
        );
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateEvent> getUserEvents(SpotifyUser user, Pageable pageable) {
        return crateEventRepository.findByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateEvent> getEventsByType(CrateEventType eventType, Pageable pageable) {
        return crateEventRepository.findByEventType(eventType, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateEvent> getCrateEvents(Long crateId, Pageable pageable) {
        return crateEventRepository.findByCrateId(crateId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateEvent> getFeedEvents(List<Long> followingUserIds, Pageable pageable) {
        if (followingUserIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return crateEventRepository.findFeedEventsForFollowingUsers(followingUserIds, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateEvent> getFeedEventsAfter(List<Long> followingUserIds, Instant after, Pageable pageable) {
        if (followingUserIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return crateEventRepository.findFeedEventsAfter(followingUserIds, after, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateEvent> getFeedEventsBefore(List<Long> followingUserIds, Instant before, Pageable pageable) {
        if (followingUserIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return crateEventRepository.findFeedEventsBefore(followingUserIds, before, pageable);
    }

    @Override
    public void cleanupOldEvents(Instant before) {
        log.info("Cleaning up events older than {}", before);
        crateEventRepository.deleteEventsOlderThan(before);
        log.info("Completed cleanup of old events");
    }
}