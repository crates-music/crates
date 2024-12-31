package page.crates.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import page.crates.controller.api.Album;
import page.crates.controller.api.SearchType;

public interface AlbumApi {
    Page<Album> find(String search, SearchType searchType, Pageable pageable);
}
