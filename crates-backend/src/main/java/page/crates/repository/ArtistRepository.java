package page.crates.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import page.crates.entity.Artist;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    @EntityGraph(attributePaths = {"genres"})
    Artist findOneBySpotifyId(String spotifyId);

    @Query("SELECT CASE WHEN (a.genresFetched = true OR SIZE(a.genres) > 0) THEN true ELSE false END " +
           "FROM Artist a WHERE a.spotifyId = :spotifyId")
    Boolean hasGenresFetched(@Param("spotifyId") String spotifyId);
}
