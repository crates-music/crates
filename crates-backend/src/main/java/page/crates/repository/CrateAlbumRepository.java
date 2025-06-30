package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.Crate;
import page.crates.entity.CrateAlbum;

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
}
