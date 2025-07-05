package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import page.crates.entity.Crate;
import page.crates.entity.CrateView;
import page.crates.entity.SpotifyUser;

import java.time.Instant;
import java.util.List;

@Repository
public interface CrateViewRepository extends JpaRepository<CrateView, Long> {
    
    /**
     * Count views for a crate after a specific time
     */
    long countByCrateAndViewedAtAfter(Crate crate, Instant after);
    
    /**
     * Get all views for a crate after a specific time
     */
    List<CrateView> findByCrateAndViewedAtAfter(Crate crate, Instant after);
    
    /**
     * Get all views by a specific user
     */
    List<CrateView> findByViewerOrderByViewedAtDesc(SpotifyUser viewer);
    
    /**
     * Get recent views for a crate
     */
    List<CrateView> findByCrateOrderByViewedAtDesc(Crate crate);
    
    /**
     * Check if a user has viewed a crate recently (within last hour)
     */
    @Query("SELECT COUNT(cv) > 0 FROM CrateView cv WHERE cv.crate = :crate AND cv.viewer = :viewer AND cv.viewedAt > :after")
    boolean hasUserViewedRecently(@Param("crate") Crate crate, @Param("viewer") SpotifyUser viewer, @Param("after") Instant after);
    
    /**
     * Check if an IP has viewed a crate recently (within last hour) for anonymous users
     */
    @Query("SELECT COUNT(cv) > 0 FROM CrateView cv WHERE cv.crate = :crate AND cv.ipAddress = :ipAddress AND cv.viewer IS NULL AND cv.viewedAt > :after")
    boolean hasIPViewedRecently(@Param("crate") Crate crate, @Param("ipAddress") String ipAddress, @Param("after") Instant after);
    
    /**
     * Get the latest view time for a crate
     */
    @Query("SELECT MAX(cv.viewedAt) FROM CrateView cv WHERE cv.crate = :crate")
    Instant findLatestViewTime(@Param("crate") Crate crate);
    
    /**
     * Get view count for a crate
     */
    long countByCrate(Crate crate);
    
    /**
     * Delete old views (older than 90 days) for performance
     */
    void deleteByCrateAndViewedAtBefore(Crate crate, Instant before);
}