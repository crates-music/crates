package page.crates.controller;

import jakarta.annotation.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.Album;
import page.crates.controller.api.Library;
import page.crates.controller.api.LibraryAlbumFilter;
import page.crates.controller.api.mapper.AlbumMapper;
import page.crates.controller.api.mapper.LibraryAlbumMapper;
import page.crates.controller.api.mapper.LibraryMapper;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.AlbumService;
import page.crates.service.CurrentUserService;
import page.crates.service.LibraryService;
import page.crates.service.LibrarySyncService;
import page.crates.util.DelegatingUserContextRunnable;

import java.util.List;

@RestController
@RequestMapping(value = "/v1/library")
public class LibraryController {
    @Resource
    private LibraryService libraryService;
    @Resource
    private LibrarySyncService librarySyncService;
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private LibraryAlbumMapper libraryAlbumMapper;
    @Resource
    private LibraryMapper libraryMapper;
    @Resource
    private AlbumService albumService;
    @Resource
    private AlbumMapper albumMapper;

    @GetMapping("/albums")
    @SpotifyAuthorization
    Page<Album> getAlbums(@RequestParam(value = "search", required = false) String search,
                          @RequestParam(value = "filters", required = false) List<LibraryAlbumFilter> filters,
                          Pageable pageable) {
        return libraryService.searchLibraryAlbums(
                        search,
                        pageable,
                        null == filters ? null : filters.toArray(new LibraryAlbumFilter[0]))
                .map(libraryAlbumMapper::map);
    }

    @GetMapping("/albums/search")
    @SpotifyAuthorization
    Page<Album> searchAlbums(@RequestParam("search") String search,
                            Pageable pageable) {
        return albumService.searchHybrid(search, pageable)
                .map(albumMapper::map);
    }

    @GetMapping()
    @SpotifyAuthorization
    Library getLibrary() {
        return libraryMapper.map(libraryService.getLibrary(currentUserService.getCurrentUser()));
    }

    @PostMapping("/sync")
    @SpotifyAuthorization
    void syncLibrary() {
        librarySyncService.markSyncInProgress();
        new Thread(new DelegatingUserContextRunnable(() -> {
            librarySyncService.synchronize();
        }, currentUserService.getCurrentUser())).start();
    }
}
