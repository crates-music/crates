package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.entity.SpotifyUser;
import page.crates.entity.UserFollow;

import java.util.List;

public interface FollowService {
    
    /**
     * Follow a user
     * @param follower The user who wants to follow
     * @param userToFollow The user to be followed
     * @return The created UserFollow relationship
     * @throws IllegalArgumentException if trying to follow self or already following
     */
    UserFollow followUser(SpotifyUser follower, SpotifyUser userToFollow);
    
    /**
     * Unfollow a user
     * @param follower The user who wants to unfollow
     * @param userToUnfollow The user to be unfollowed
     * @throws IllegalArgumentException if not currently following
     */
    void unfollowUser(SpotifyUser follower, SpotifyUser userToUnfollow);
    
    /**
     * Check if one user follows another
     * @param follower The potential follower
     * @param following The potential followed user
     * @return true if follower follows following
     */
    boolean isFollowing(SpotifyUser follower, SpotifyUser following);
    
    /**
     * Get users that this user is following
     * @param user The user whose following list to retrieve
     * @param pageable Pagination parameters
     * @return Page of UserFollow relationships
     */
    Page<UserFollow> getFollowing(SpotifyUser user, Pageable pageable);
    
    /**
     * Get users that follow this user
     * @param user The user whose followers to retrieve
     * @param pageable Pagination parameters
     * @return Page of UserFollow relationships
     */
    Page<UserFollow> getFollowers(SpotifyUser user, Pageable pageable);
    
    /**
     * Get count of users this user is following
     * @param user The user
     * @return Count of users being followed
     */
    Long getFollowingCount(SpotifyUser user);
    
    /**
     * Get count of users following this user
     * @param user The user
     * @return Count of followers
     */
    Long getFollowerCount(SpotifyUser user);
    
    /**
     * Get list of user IDs that this user is following (for feed queries)
     * @param user The user
     * @return List of user IDs being followed
     */
    List<Long> getFollowingUserIds(SpotifyUser user);
}