package page.crates.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.controller.api.Album;
import page.crates.controller.api.Crate;

public interface CrateApi {
    Crate addAlbumToCrate(Long crateId, Album album);

    void archiveCrate(Long crateId);

    Crate createCrate(Crate crate);

    Page<Crate> getCrates(String search, Pageable pageable);

    Crate removeAlbumFromCrate(Long crateId, Long albumId);

    Crate updateCrate(Long id, Crate crate);
}
