package page.crates.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import page.crates.entity.Album;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;

import java.util.Optional;

@Repository
public interface LibraryAlbumRepository extends JpaRepository<LibraryAlbum, Long> {
    @Query("SELECT l " +
           "FROM LibraryAlbum l " +
           "WHERE l.state = page.crates.entity.enums.State.ACTIVE " +
           "  AND l.spotifyUser = :spotifyUser " +
           "ORDER BY l.addedAt DESC")
    Page<LibraryAlbum> findActiveBySpotifyUser(SpotifyUser spotifyUser, Pageable pageable);

    @Query(value = "SELECT l.* " +
                   "FROM library_album l " +
                   "JOIN album a on l.album_id = a.id " +
                   "JOIN album_to_artist ata on a.id = ata.album_id " +
                   "JOIN artist a2 on ata.artist_id = a2.id " +
                   "WHERE l.state = 'ACTIVE' " +
                   "  AND l.spotify_user_id = :spotifyUserId " +
                   "  AND (a.name ILIKE CONCAT('%', :search, '%')" +
                   "    OR a2.name ILIKE CONCAT('%', :search, '%'))", nativeQuery = true)
    Page<LibraryAlbum> findActiveBySpotifyUserAndSearchTerm(Long spotifyUserId, String search, Pageable pageable);

    @Query(value = "SELECT * " +
                   "FROM library_album l " +
                   "WHERE l.state = 'ACTIVE' " +
                   "  AND l.spotify_user_id = :spotifyUserId " +
                   "  AND NOT EXISTS (SELECT * " +
                   "    FROM crate_album c " +
                   "    WHERE c.album_id = l.album_id) " +
                   "ORDER BY l.added_at DESC", nativeQuery = true)
    Page<LibraryAlbum> findActiveUncratedBySpotifyUser(Long spotifyUserId, Pageable pageable);

    @Query(value = "SELECT l.* " +
                   "FROM library_album l " +
                   "JOIN album a on l.album_id = a.id " +
                   "JOIN album_to_artist ata on a.id = ata.album_id " +
                   "JOIN artist a2 on ata.artist_id = a2.id " +
                   "WHERE l.state = 'ACTIVE' " +
                   "  AND l.spotify_user_id = :spotifyUserId " +
                   "  AND NOT EXISTS (SELECT * " +
                   "    FROM crate_album c " +
                   "    WHERE c.album_id = l.album_id) " +
                   "  AND (a.name ILIKE CONCAT('%', :search, '%') " +
                   "    OR a2.name ILIKE CONCAT('%', :search, '%')) " +
                   "ORDER BY l.added_at DESC", nativeQuery = true)
    Page<LibraryAlbum> findActiveUncratedBySpotifyUserAndSearchTerm(Long spotifyUserId, String search, Pageable pageable);

    Optional<LibraryAlbum> findOneByAlbumAndSpotifyUser(Album album, SpotifyUser spotifyUser);
}
