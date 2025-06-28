package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.SpotifyUser;

import java.util.Optional;

@Repository
public interface SpotifyUserRepository extends JpaRepository<SpotifyUser, Long> {
    Optional<SpotifyUser> findOneBySpotifyId(String spotifyId);

    Optional<SpotifyUser> findOneByTokenAuthToken(String authToken);
    
    Optional<SpotifyUser> findByHandle(String handle);
    
    @Query(value = "SELECT DISTINCT u FROM SpotifyUser u LEFT JOIN FETCH u.images WHERE " +
           "(LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.handle) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.spotifyId) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.updatedAt DESC",
           countQuery = "SELECT COUNT(DISTINCT u) FROM SpotifyUser u WHERE " +
           "(LOWER(u.displayName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.handle) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.spotifyId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<SpotifyUser> searchUsers(String search, Pageable pageable);
}
