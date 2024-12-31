package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import page.crates.entity.Artist;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    Artist findOneBySpotifyId(String spotifyId);
}
