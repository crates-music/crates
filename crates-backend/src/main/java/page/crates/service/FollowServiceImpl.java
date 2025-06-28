package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.SpotifyUser;
import page.crates.entity.UserFollow;
import page.crates.repository.UserFollowRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Transactional
public class FollowServiceImpl implements FollowService {

    @Resource
    private UserFollowRepository userFollowRepository;

    @Override
    public UserFollow followUser(SpotifyUser follower, SpotifyUser userToFollow) {
        log.info("User {} attempting to follow user {}", follower.getId(), userToFollow.getId());
        
        if (follower.getId().equals(userToFollow.getId())) {
            throw new IllegalArgumentException("Users cannot follow themselves");
        }
        
        Optional<UserFollow> existingFollow = userFollowRepository.findByFollowerAndFollowing(follower, userToFollow);
        if (existingFollow.isPresent()) {
            throw new IllegalArgumentException("User is already following this user");
        }
        
        UserFollow userFollow = UserFollow.builder()
                .follower(follower)
                .following(userToFollow)
                .createdAt(Instant.now())
                .build();
        
        UserFollow saved = userFollowRepository.save(userFollow);
        log.info("User {} successfully followed user {}", follower.getId(), userToFollow.getId());
        
        return saved;
    }

    @Override
    public void unfollowUser(SpotifyUser follower, SpotifyUser userToUnfollow) {
        log.info("User {} attempting to unfollow user {}", follower.getId(), userToUnfollow.getId());
        
        Optional<UserFollow> existingFollow = userFollowRepository.findByFollowerAndFollowing(follower, userToUnfollow);
        if (existingFollow.isEmpty()) {
            throw new IllegalArgumentException("User is not currently following this user");
        }
        
        userFollowRepository.delete(existingFollow.get());
        log.info("User {} successfully unfollowed user {}", follower.getId(), userToUnfollow.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFollowing(SpotifyUser follower, SpotifyUser following) {
        return userFollowRepository.findByFollowerAndFollowing(follower, following).isPresent();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserFollow> getFollowing(SpotifyUser user, Pageable pageable) {
        return userFollowRepository.findFollowingByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserFollow> getFollowers(SpotifyUser user, Pageable pageable) {
        return userFollowRepository.findFollowersByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getFollowingCount(SpotifyUser user) {
        return userFollowRepository.countFollowingByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getFollowerCount(SpotifyUser user) {
        return userFollowRepository.countFollowersByUser(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> getFollowingUserIds(SpotifyUser user) {
        return userFollowRepository.findFollowingUserIds(user);
    }
}