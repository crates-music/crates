package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.controller.AlbumList;
import page.crates.entity.Crate;
import page.crates.entity.CrateAlbum;
import page.crates.entity.SpotifyUser;

public interface CrateService {
    Crate addAlbum(Long crateId, String spotifyAlbumId);

    Crate addAlbums(Long crateId, AlbumList albumList);

    void archive(Long crateId);

    Crate create(Crate crate);

    Page<Crate> findActive(Pageable pageable);

    Page<CrateAlbum> getAlbums(Long crateId, Pageable pageable);

    Crate getCrate(Long id);

    Crate removeAlbum(Long crateId, Long albumId);

    Page<Crate> searchActive(String search, Pageable pageable);

    Page<CrateAlbum> searchAlbums(Long crateId, String search, Pageable pageable);

    Crate updateCrate(Long crateId, Crate crateUpdate);

    Page<Crate> findPublicByUser(SpotifyUser user, Pageable pageable);

    Page<Crate> searchPublicByUser(SpotifyUser user, String search, Pageable pageable);

    Crate findByUserAndHandle(SpotifyUser user, String handle);

    Crate findByHandle(String handle);

    Page<CrateAlbum> getPublicAlbums(Long crateId, Pageable pageable);

    Page<CrateAlbum> searchPublicAlbums(Long crateId, String search, Pageable pageable);

    Page<Crate> findAllPublic(Pageable pageable);
    
    Page<Crate> searchAllPublic(String search, Pageable pageable);
    
    Page<Crate> getUserPublicCrates(SpotifyUser user, String search, Pageable pageable);
    
    // Trending methods
    Page<Crate> findAllPublicByTrending(Pageable pageable);
    
    Page<Crate> searchAllPublicByTrending(String search, Pageable pageable);
    
    Crate findById(Long id);
}
