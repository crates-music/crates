package page.crates.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.controller.api.SearchType;
import page.crates.entity.Album;

public interface AlbumService {
    Page<Album> search(String search,
                       SearchType searchType,
                       Pageable pageable);

    Album findOrCreate(String spotifyAlbumId);

    Album findOrCreate(Album album);
}
