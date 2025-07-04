package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.Crate;
import page.crates.entity.SpotifyUser;

import java.util.Optional;

@Repository
public interface CrateRepository extends JpaRepository<Crate, Long> {
    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.user = :user")
    Page<Crate> findActiveByUser(SpotifyUser user, Pageable pageable);

    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.user = :user " +
           "  AND c.name ILIKE CONCAT('%', :search, '%')")
    Page<Crate> findActiveByUserAndNameLike(SpotifyUser user, String search, Pageable pageable);

    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.user = :user " +
           "  AND c.publicCrate = true")
    Page<Crate> findPublicByUser(SpotifyUser user, Pageable pageable);

    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.user = :user " +
           "  AND c.publicCrate = true " +
           "  AND c.name ILIKE CONCAT('%', :search, '%')")
    Page<Crate> findPublicByUserAndNameLike(SpotifyUser user, String search, Pageable pageable);

    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.user = :user " +
           "  AND c.handle = :handle")
    Optional<Crate> findByUserAndHandle(SpotifyUser user, String handle);

    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.handle = :handle")
    Optional<Crate> findByHandle(String handle);

    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.publicCrate = true " +
           "ORDER BY c.updatedAt DESC")
    Page<Crate> findAllPublicCrates(Pageable pageable);
    
    @Query("SELECT c FROM Crate c " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.publicCrate = true " +
           "  AND c.name ILIKE CONCAT('%', :search, '%') " +
           "ORDER BY c.updatedAt DESC")
    Page<Crate> findAllPublicCratesWithSearch(String search, Pageable pageable);
    
    @Query("SELECT DISTINCT c FROM Crate c " +
           "LEFT JOIN CrateAlbum ca ON ca.crate = c " +
           "LEFT JOIN ca.album a " +
           "LEFT JOIN a.artists ar " +
           "WHERE c.state = page.crates.entity.enums.CrateState.ACTIVE " +
           "  AND c.publicCrate = true " +
           "  AND (" +
           "    c.name ILIKE CONCAT('%', :search, '%') OR " +
           "    c.description ILIKE CONCAT('%', :search, '%') OR " +
           "    a.name ILIKE CONCAT('%', :search, '%') OR " +
           "    ar.name ILIKE CONCAT('%', :search, '%')" +
           "  ) " +
           "ORDER BY c.updatedAt DESC")
    Page<Crate> findAllPublicCratesWithUnifiedSearch(String search, Pageable pageable);
}
