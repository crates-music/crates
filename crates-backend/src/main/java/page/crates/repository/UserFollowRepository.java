package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.SpotifyUser;
import page.crates.entity.UserFollow;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    
    // Check if user A follows user B
    @Query("SELECT uf FROM UserFollow uf WHERE uf.follower = :follower AND uf.following = :following")
    Optional<UserFollow> findByFollowerAndFollowing(SpotifyUser follower, SpotifyUser following);
    
    // Get all users that this user is following
    @Query("SELECT uf FROM UserFollow uf WHERE uf.follower = :user ORDER BY uf.createdAt DESC")
    Page<UserFollow> findFollowingByUser(SpotifyUser user, Pageable pageable);
    
    // Get all users that follow this user
    @Query("SELECT uf FROM UserFollow uf WHERE uf.following = :user ORDER BY uf.createdAt DESC")
    Page<UserFollow> findFollowersByUser(SpotifyUser user, Pageable pageable);
    
    // Get count of users this user is following
    @Query("SELECT COUNT(uf) FROM UserFollow uf WHERE uf.follower = :user")
    Long countFollowingByUser(SpotifyUser user);
    
    // Get count of users following this user
    @Query("SELECT COUNT(uf) FROM UserFollow uf WHERE uf.following = :user")
    Long countFollowersByUser(SpotifyUser user);
    
    // Get list of user IDs that this user is following (for feed queries)
    @Query("SELECT uf.following.id FROM UserFollow uf WHERE uf.follower = :user")
    List<Long> findFollowingUserIds(SpotifyUser user);
    
    // Check if user follows any of the given users
    @Query("SELECT EXISTS(SELECT 1 FROM UserFollow uf WHERE uf.follower = :follower AND uf.following.id IN :userIds)")
    boolean existsByFollowerAndFollowingIdIn(SpotifyUser follower, List<Long> userIds);
    
    // Get all users that this user is following (filtering out private profiles for non-owners)
    @Query("SELECT uf FROM UserFollow uf WHERE uf.follower = :user AND " +
           "(:includePrivate = true OR uf.following.privateProfile = false) " +
           "ORDER BY uf.createdAt DESC")
    Page<UserFollow> findFollowingByUserFilteringPrivate(SpotifyUser user, boolean includePrivate, Pageable pageable);
    
    // Get all users that follow this user (filtering out private profile followers for non-owners)
    @Query("SELECT uf FROM UserFollow uf WHERE uf.following = :user AND " +
           "(:includePrivate = true OR uf.follower.privateProfile = false) " +
           "ORDER BY uf.createdAt DESC")
    Page<UserFollow> findFollowersByUserFilteringPrivate(SpotifyUser user, boolean includePrivate, Pageable pageable);
    
    // Get count of users this user is following (filtering out private profiles for counts)
    @Query("SELECT COUNT(uf) FROM UserFollow uf WHERE uf.follower = :user AND " +
           "(:includePrivate = true OR uf.following.privateProfile = false)")
    Long countFollowingByUserFilteringPrivate(SpotifyUser user, boolean includePrivate);
    
    // Get count of users following this user (filtering out private profile followers for counts)
    @Query("SELECT COUNT(uf) FROM UserFollow uf WHERE uf.following = :user AND " +
           "(:includePrivate = true OR uf.follower.privateProfile = false)")
    Long countFollowersByUserFilteringPrivate(SpotifyUser user, boolean includePrivate);
}