package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.controller.AlbumList;
import page.crates.entity.Crate;
import page.crates.entity.CrateAlbum;

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
}
