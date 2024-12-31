package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import page.crates.entity.Library;

import java.util.Optional;

@Repository
public interface LibraryRepository extends JpaRepository<Library, Long> {
    Optional<Library> findOneBySpotifyUserId(Long userId);
}
