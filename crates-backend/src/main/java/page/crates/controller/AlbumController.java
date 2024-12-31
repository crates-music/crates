package page.crates.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.Album;
import page.crates.controller.api.SearchType;
import page.crates.controller.api.mapper.AlbumMapper;
import page.crates.service.AlbumService;

import jakarta.annotation.Resource;

@RestController
@RequestMapping("/v1/album")
public class AlbumController implements AlbumApi {
    @Resource
    private AlbumService albumService;
    @Resource
    private AlbumMapper albumMapper;

    @Override
    @GetMapping
    public Page<Album> find(final @RequestParam("search") String search,
                            final @RequestParam(value = "searchType", required = false) SearchType searchType,
                            final Pageable pageable) {
        return albumService.search(search, searchType, pageable)
                .map(albumMapper::map);
    }
}
