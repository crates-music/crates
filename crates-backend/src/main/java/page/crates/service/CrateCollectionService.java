package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.entity.Crate;
import page.crates.entity.SpotifyUser;
import page.crates.entity.UserCrateCollection;

public interface CrateCollectionService {
    
    /**
     * Add a crate to user's collection
     * @param user The user adding the crate
     * @param crate The crate to add
     * @return The created UserCrateCollection relationship
     * @throws IllegalArgumentException if user owns the crate or already has it in collection
     */
    UserCrateCollection addCrateToCollection(SpotifyUser user, Crate crate);
    
    /**
     * Remove a crate from user's collection
     * @param user The user removing the crate
     * @param crate The crate to remove
     * @throws IllegalArgumentException if crate is not in collection
     */
    void removeCrateFromCollection(SpotifyUser user, Crate crate);
    
    /**
     * Check if user has a crate in their collection
     * @param user The user
     * @param crate The crate
     * @return true if crate is in user's collection
     */
    boolean isInCollection(SpotifyUser user, Crate crate);
    
    /**
     * Get all crates in user's collection
     * @param user The user
     * @param pageable Pagination parameters
     * @return Page of UserCrateCollection relationships
     */
    Page<UserCrateCollection> getUserCollection(SpotifyUser user, Pageable pageable);
    
    /**
     * Search crates in user's collection by name
     * @param user The user
     * @param search The search term
     * @param pageable Pagination parameters
     * @return Page of UserCrateCollection relationships
     */
    Page<UserCrateCollection> searchUserCollection(SpotifyUser user, String search, Pageable pageable);
    
    /**
     * Get count of crates in user's collection
     * @param user The user
     * @return Count of crates in collection
     */
    Long getCollectionCount(SpotifyUser user);
    
    /**
     * Get follower count for a crate (number of users who have it in their collection)
     * @param crate The crate
     * @return Count of users who have this crate in their collection
     */
    Long getCrateFollowerCount(Crate crate);
    
    /**
     * Update the follower count field in the crate entity
     * @param crate The crate to update
     */
    void updateCrateFollowerCount(Crate crate);
    
    /**
     * Get all public crates in user's collection (for public API)
     * @param user The user
     * @param pageable Pagination parameters
     * @return Page of UserCrateCollection relationships for public crates only
     */
    Page<UserCrateCollection> getPublicUserCollection(SpotifyUser user, Pageable pageable);
    
    /**
     * Search public crates in user's collection by name (for public API)
     * @param user The user
     * @param search The search term
     * @param pageable Pagination parameters
     * @return Page of UserCrateCollection relationships for public crates only
     */
    Page<UserCrateCollection> searchPublicUserCollection(SpotifyUser user, String search, Pageable pageable);
}