package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import page.crates.entity.SpotifyUser;

import java.util.Optional;

@Repository
public interface SpotifyUserRepository extends JpaRepository<SpotifyUser, Long> {
    Optional<SpotifyUser> findOneBySpotifyId(String spotifyId);

    Optional<SpotifyUser> findOneByTokenAuthToken(String authToken);
    
    Optional<SpotifyUser> findByHandle(String handle);
}
