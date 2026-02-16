package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.Crate;
import page.crates.entity.CrateAlbum;
import page.crates.entity.SpotifyUser;

import java.util.List;

@Repository
public interface CrateAlbumRepository extends JpaRepository<CrateAlbum, Long> {
    @Modifying
    void deleteByCrateIdAndAlbumId(Long crateId, Long albumId);

    @Query("SELECT a " +
           "FROM CrateAlbum a " +
           "WHERE a.crate = :crate")
    Page<CrateAlbum> findActiveByCrate(Crate crate, Pageable pageable);

    @Query("SELECT ca " +
           "FROM CrateAlbum ca " +
           "JOIN ca.album a " +
           "JOIN a.artists ar " +
           "WHERE ca.crate = :crate " +
           "  AND (ca.album.name ILIKE CONCAT('%', :search, '%') " +
           "   OR ar.name ILIKE CONCAT('%', :search, '%'))")
    Page<CrateAlbum> findActiveByCrateAndSearch(Crate crate, String search, Pageable pageable);

    @Query("SELECT a " +
           "FROM CrateAlbum a " +
           "WHERE a.crate.id = :crateId")
    Page<CrateAlbum> findActiveByCrateId(Long crateId, Pageable pageable);

    @Query("SELECT COUNT(a) " +
           "FROM CrateAlbum a " +
           "WHERE a.crate.id = :crateId")
    long countActiveByCrateId(Long crateId);

    @Query("SELECT CASE WHEN COUNT(ca) > 0 THEN true ELSE false END " +
           "FROM CrateAlbum ca " +
           "WHERE ca.crate.id = :crateId AND ca.album.id = :albumId")
    boolean existsByCrateIdAndAlbumId(Long crateId, Long albumId);

    @Query("SELECT ca.album.id " +
           "FROM CrateAlbum ca " +
           "WHERE ca.crate.id = :crateId AND ca.album.id IN :albumIds")
    List<Long> findExistingAlbumIds(Long crateId, List<Long> albumIds);

    @Query("SELECT DISTINCT ca.album.id " +
           "FROM CrateAlbum ca " +
           "JOIN ca.crate c " +
           "WHERE c.user = :user AND ca.album.id IN :albumIds")
    List<Long> findAlbumIdsInAnyCrate(SpotifyUser user, List<Long> albumIds);

    @Query(value = "SELECT ca.* FROM crate_album ca " +
           "JOIN album a ON ca.album_id = a.id " +
           "LEFT JOIN album_to_artist ata ON a.id = ata.album_id " +
           "LEFT JOIN artist ar ON ata.artist_id = ar.id " +
           "WHERE ca.crate_id = :crateId " +
           "GROUP BY ca.id " +
           "ORDER BY MIN(ar.name) ASC",
           countQuery = "SELECT COUNT(*) FROM crate_album ca WHERE ca.crate_id = :crateId",
           nativeQuery = true)
    Page<CrateAlbum> findByCrateIdOrderByArtistNameAsc(Long crateId, Pageable pageable);

    @Query(value = "SELECT ca.* FROM crate_album ca " +
           "JOIN album a ON ca.album_id = a.id " +
           "LEFT JOIN album_to_artist ata ON a.id = ata.album_id " +
           "LEFT JOIN artist ar ON ata.artist_id = ar.id " +
           "WHERE ca.crate_id = :crateId " +
           "GROUP BY ca.id " +
           "ORDER BY MIN(ar.name) DESC",
           countQuery = "SELECT COUNT(*) FROM crate_album ca WHERE ca.crate_id = :crateId",
           nativeQuery = true)
    Page<CrateAlbum> findByCrateIdOrderByArtistNameDesc(Long crateId, Pageable pageable);

    @Query(value = "SELECT DISTINCT ca.* FROM crate_album ca " +
           "JOIN album a ON ca.album_id = a.id " +
           "LEFT JOIN album_to_artist ata ON a.id = ata.album_id " +
           "LEFT JOIN artist ar ON ata.artist_id = ar.id " +
           "WHERE ca.crate_id = :crateId " +
           "  AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(ar.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "GROUP BY ca.id " +
           "ORDER BY MIN(ar.name) ASC",
           countQuery = "SELECT COUNT(DISTINCT ca.id) FROM crate_album ca " +
           "JOIN album a ON ca.album_id = a.id " +
           "LEFT JOIN album_to_artist ata ON a.id = ata.album_id " +
           "LEFT JOIN artist ar ON ata.artist_id = ar.id " +
           "WHERE ca.crate_id = :crateId " +
           "  AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(ar.name) LIKE LOWER(CONCAT('%', :search, '%')))",
           nativeQuery = true)
    Page<CrateAlbum> findByCrateIdAndSearchOrderByArtistNameAsc(Long crateId, String search, Pageable pageable);

    @Query(value = "SELECT DISTINCT ca.* FROM crate_album ca " +
           "JOIN album a ON ca.album_id = a.id " +
           "LEFT JOIN album_to_artist ata ON a.id = ata.album_id " +
           "LEFT JOIN artist ar ON ata.artist_id = ar.id " +
           "WHERE ca.crate_id = :crateId " +
           "  AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(ar.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "GROUP BY ca.id " +
           "ORDER BY MIN(ar.name) DESC",
           countQuery = "SELECT COUNT(DISTINCT ca.id) FROM crate_album ca " +
           "JOIN album a ON ca.album_id = a.id " +
           "LEFT JOIN album_to_artist ata ON a.id = ata.album_id " +
           "LEFT JOIN artist ar ON ata.artist_id = ar.id " +
           "WHERE ca.crate_id = :crateId " +
           "  AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(ar.name) LIKE LOWER(CONCAT('%', :search, '%')))",
           nativeQuery = true)
    Page<CrateAlbum> findByCrateIdAndSearchOrderByArtistNameDesc(Long crateId, String search, Pageable pageable);
}
