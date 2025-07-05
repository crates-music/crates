package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import page.crates.entity.Crate;
import page.crates.entity.SpotifyUser;
import page.crates.entity.UserCrateCollection;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCrateCollectionRepository extends JpaRepository<UserCrateCollection, Long> {
    
    // Check if user has added a specific crate to their collection
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.user = :user AND ucc.crate = :crate")
    Optional<UserCrateCollection> findByUserAndCrate(SpotifyUser user, Crate crate);
    
    // Get all crates in user's collection
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.user = :user ORDER BY ucc.createdAt DESC")
    Page<UserCrateCollection> findByUser(SpotifyUser user, Pageable pageable);
    
    // Search crates in user's collection by name
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.user = :user AND ucc.crate.name ILIKE CONCAT('%', :search, '%') ORDER BY ucc.createdAt DESC")
    Page<UserCrateCollection> findByUserAndCrateNameLike(SpotifyUser user, String search, Pageable pageable);
    
    // Get count of users who have added this crate to their collection (for follower count)
    @Query("SELECT COUNT(ucc) FROM UserCrateCollection ucc WHERE ucc.crate = :crate")
    Long countByCrate(Crate crate);
    
    // Get count of crates in user's collection
    @Query("SELECT COUNT(ucc) FROM UserCrateCollection ucc WHERE ucc.user = :user")
    Long countByUser(SpotifyUser user);
    
    // Check if user has any crates from the given crate owners (for feed queries)
    @Query("SELECT EXISTS(SELECT 1 FROM UserCrateCollection ucc WHERE ucc.user = :user AND ucc.crate.user.id IN :crateOwnerIds)")
    boolean existsByUserAndCrateUserIdIn(SpotifyUser user, List<Long> crateOwnerIds);
    
    // Get crates in user's collection by crate owner
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.user = :user AND ucc.crate.user = :crateOwner ORDER BY ucc.createdAt DESC")
    Page<UserCrateCollection> findByUserAndCrateOwner(SpotifyUser user, SpotifyUser crateOwner, Pageable pageable);
    
    // Get users who have added this crate to their collection
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.crate = :crate ORDER BY ucc.createdAt DESC")
    Page<UserCrateCollection> findByCrate(Crate crate, Pageable pageable);
    
    // Public API methods - only return public crates from collections
    
    // Get all public crates in user's collection (for public API)
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.user = :user AND ucc.crate.publicCrate = true ORDER BY ucc.createdAt DESC")
    Page<UserCrateCollection> findPublicByUser(SpotifyUser user, Pageable pageable);
    
    // Search public crates in user's collection by name (for public API)
    @Query("SELECT ucc FROM UserCrateCollection ucc WHERE ucc.user = :user AND ucc.crate.publicCrate = true AND ucc.crate.name ILIKE CONCAT('%', :search, '%') ORDER BY ucc.createdAt DESC")
    Page<UserCrateCollection> findPublicByUserAndCrateNameLike(SpotifyUser user, String search, Pageable pageable);
    
    // Trending algorithm methods
    
    // Count collections for a crate after a specific time
    @Query("SELECT COUNT(ucc) FROM UserCrateCollection ucc WHERE ucc.crate = :crate AND ucc.createdAt > :after")
    long countByCrateAndCreatedAtAfter(@Param("crate") Crate crate, @Param("after") Instant after);
    
    // Get the latest collection time for a crate
    @Query("SELECT MAX(ucc.createdAt) FROM UserCrateCollection ucc WHERE ucc.crate = :crate")
    Instant findLatestCollectionTime(@Param("crate") Crate crate);
}