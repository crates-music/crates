package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Crate;
import page.crates.entity.SpotifyUser;
import page.crates.entity.UserCrateCollection;
import page.crates.repository.CrateRepository;
import page.crates.repository.UserCrateCollectionRepository;

import java.time.Instant;
import java.util.Optional;

@Service
@Slf4j
@Transactional
public class CrateCollectionServiceImpl implements CrateCollectionService {

    @Resource
    private UserCrateCollectionRepository userCrateCollectionRepository;
    
    @Resource
    private CrateRepository crateRepository;
    
    @Resource
    private CrateEventService crateEventService;

    @Override
    public UserCrateCollection addCrateToCollection(SpotifyUser user, Crate crate) {
        log.info("User {} attempting to add crate {} to collection", user.getId(), crate.getId());
        
        // Check if user owns the crate
        if (crate.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Users cannot add their own crates to their collection");
        }
        
        // Check if crate is public
        if (!crate.isPublicCrate()) {
            throw new IllegalArgumentException("Only public crates can be added to collections");
        }
        
        // Check if already in collection
        Optional<UserCrateCollection> existing = userCrateCollectionRepository.findByUserAndCrate(user, crate);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Crate is already in user's collection");
        }
        
        UserCrateCollection collection = UserCrateCollection.builder()
                .user(user)
                .crate(crate)
                .createdAt(Instant.now())
                .build();
        
        UserCrateCollection saved = userCrateCollectionRepository.save(collection);
        
        // Update crate follower count
        updateCrateFollowerCount(crate);
        
        // Fire event for feed
        crateEventService.recordCrateAddedToCollection(user, crate);
        
        log.info("User {} successfully added crate {} to collection", user.getId(), crate.getId());
        return saved;
    }

    @Override
    public void removeCrateFromCollection(SpotifyUser user, Crate crate) {
        log.info("User {} attempting to remove crate {} from collection", user.getId(), crate.getId());
        
        Optional<UserCrateCollection> existing = userCrateCollectionRepository.findByUserAndCrate(user, crate);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Crate is not in user's collection");
        }
        
        userCrateCollectionRepository.delete(existing.get());
        
        // Update crate follower count
        updateCrateFollowerCount(crate);
        
        log.info("User {} successfully removed crate {} from collection", user.getId(), crate.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInCollection(SpotifyUser user, Crate crate) {
        return userCrateCollectionRepository.findByUserAndCrate(user, crate).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserCrateCollection> getUserCollection(SpotifyUser user, Pageable pageable) {
        return userCrateCollectionRepository.findByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserCrateCollection> searchUserCollection(SpotifyUser user, String search, Pageable pageable) {
        return userCrateCollectionRepository.findByUserAndCrateNameLike(user, search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCollectionCount(SpotifyUser user) {
        return userCrateCollectionRepository.countByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCrateFollowerCount(Crate crate) {
        return userCrateCollectionRepository.countByCrate(crate);
    }

    @Override
    public void updateCrateFollowerCount(Crate crate) {
        Long followerCount = getCrateFollowerCount(crate);
        crate.setFollowerCount(followerCount);
        crateRepository.save(crate);
        log.debug("Updated follower count for crate {} to {}", crate.getId(), followerCount);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserCrateCollection> getPublicUserCollection(SpotifyUser user, Pageable pageable) {
        return userCrateCollectionRepository.findPublicByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserCrateCollection> searchPublicUserCollection(SpotifyUser user, String search, Pageable pageable) {
        return userCrateCollectionRepository.findPublicByUserAndCrateNameLike(user, search, pageable);
    }
}