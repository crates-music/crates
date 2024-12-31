package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import page.crates.entity.Album;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {
    Album findOneBySpotifyId(String spotifyId);
}
