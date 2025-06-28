package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.UserFollow;
import page.crates.controller.api.mapper.UserFollowMapper;
import page.crates.entity.SpotifyUser;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.CurrentUserService;
import page.crates.service.FollowService;
import page.crates.service.UserService;

@RestController
@RequestMapping("/v1/social")
@Slf4j
public class SocialController {

    @Resource
    private FollowService followService;
    
    @Resource
    private CurrentUserService currentUserService;
    
    @Resource
    private UserService userService;
    
    @Resource
    private UserFollowMapper userFollowMapper;

    @PostMapping("/follow/{userId}")
    @SpotifyAuthorization
    @ResponseStatus(HttpStatus.CREATED)
    public UserFollow followUser(@PathVariable Long userId) {
        log.info("Request to follow user {}", userId);
        
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        SpotifyUser userToFollow = userService.getUser(userId);
        
        page.crates.entity.UserFollow follow = followService.followUser(currentUser, userToFollow);
        return userFollowMapper.map(follow);
    }

    @DeleteMapping("/follow/{userId}")
    @SpotifyAuthorization
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollowUser(@PathVariable Long userId) {
        log.info("Request to unfollow user {}", userId);
        
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        SpotifyUser userToUnfollow = userService.getUser(userId);
        
        followService.unfollowUser(currentUser, userToUnfollow);
    }

    @GetMapping("/follow/{userId}/status")
    @SpotifyAuthorization
    public FollowStatus getFollowStatus(@PathVariable Long userId) {
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        SpotifyUser targetUser = userService.getUser(userId);
        
        boolean isFollowing = followService.isFollowing(currentUser, targetUser);
        return new FollowStatus(isFollowing);
    }

    @GetMapping("/following")
    @SpotifyAuthorization
    public Page<UserFollow> getFollowing(Pageable pageable) {
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        return followService.getFollowing(currentUser, pageable)
                .map(userFollowMapper::map);
    }

    @GetMapping("/followers")
    @SpotifyAuthorization
    public Page<UserFollow> getFollowers(Pageable pageable) {
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        return followService.getFollowers(currentUser, pageable)
                .map(userFollowMapper::map);
    }

    @GetMapping("/stats")
    @SpotifyAuthorization
    public SocialStats getSocialStats() {
        SpotifyUser currentUser = currentUserService.getCurrentUser();
        
        Long followingCount = followService.getFollowingCount(currentUser);
        Long followerCount = followService.getFollowerCount(currentUser);
        
        return new SocialStats(followingCount, followerCount);
    }

    @GetMapping("/user/{userId}/stats")
    @SpotifyAuthorization
    public SocialStats getUserSocialStats(@PathVariable Long userId) {
        SpotifyUser user = userService.getUser(userId);
        
        Long followingCount = followService.getFollowingCount(user);
        Long followerCount = followService.getFollowerCount(user);
        
        return new SocialStats(followingCount, followerCount);
    }

    // DTO classes
    public record FollowStatus(boolean isFollowing) {}
    public record SocialStats(Long followingCount, Long followerCount) {}
}