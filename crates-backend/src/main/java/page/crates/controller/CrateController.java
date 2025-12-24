package page.crates.controller;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import page.crates.controller.api.Album;
import page.crates.controller.api.Crate;
import page.crates.controller.api.CrateAlbum;
import page.crates.controller.api.mapper.CrateAlbumMapper;
import page.crates.controller.api.mapper.CrateMapper;
import page.crates.security.SpotifyAuthorization;
import page.crates.service.CrateDecorator;
import page.crates.service.CrateService;

@RestController
@RequestMapping("/v1/crate")
@Slf4j
public class CrateController implements CrateApi {
    @Resource
    private CrateMapper crateMapper;
    @Resource
    private CrateService crateService;
    @Resource
    private CrateAlbumMapper crateAlbumMapper;
    @Resource
    private CrateDecorator crateDecorator;

    @Override
    @PostMapping("/{crateId}/album")
    @SpotifyAuthorization
    public Crate addAlbumToCrate(final @PathVariable Long crateId,
                                 final @RequestBody Album album) {
        log.info("request received to add album {} to crate: {}", album.getSpotifyId(), crateId);
        return crateDecorator.decorate(
                crateMapper.map(crateService.addAlbum(crateId, album.getSpotifyId())));
    }

    @PostMapping("/{crateId}/albums")
    @SpotifyAuthorization
    public Crate addAlbumsToCrate(final @PathVariable Long crateId,
                                  final @RequestBody AlbumList albumList) {
        log.info("request received to add albums {} to crate: {}", albumList, crateId);
        return crateDecorator.decorate(
                crateMapper.map(crateService.addAlbums(crateId, albumList)));
    }

    @Override
    @DeleteMapping("/{crateId}")
    @SpotifyAuthorization
    public void archiveCrate(final @PathVariable Long crateId) {
        crateService.archive(crateId);
    }

    @Override
    @PostMapping
    @SpotifyAuthorization
    public Crate createCrate(final @RequestBody @Validated Crate crate) {
        return crateMapper.map(
                crateService.create(
                        crateMapper.map(crate)));
    }

    @GetMapping("/{crateId}/albums")
    @SpotifyAuthorization
    public Page<CrateAlbum> getAlbums(final @PathVariable Long crateId,
                                      final @RequestParam(value = "search", required = false) String search,
                                      final Pageable pageable) {
        if (StringUtils.isNotBlank(search)) {
            return crateService.searchAlbums(crateId, search, pageable)
                    .map(crateAlbumMapper::map);
        }
        return crateService.getAlbums(crateId, pageable)
                .map(crateAlbumMapper::map);
    }

    @GetMapping("/{id}")
    @SpotifyAuthorization
    public Crate getCrate(final @PathVariable Long id) {
        return crateDecorator.decorate(
                crateMapper.map(
                        crateService.getCrate(id)));
    }

    @Override
    @GetMapping
    @SpotifyAuthorization
    public Page<Crate> getCrates(final @RequestParam(value = "search", required = false) String search,
                                 final Pageable pageable) {
        if (StringUtils.isBlank(search)) {
            return crateService.findActive(pageable)
                    .map(crateMapper::map)
                    .map(crateDecorator::decorate);
        }
        return crateService.searchActive(search, pageable)
                .map(crateMapper::map)
                .map(crateDecorator::decorate);
    }

    @Override
    @DeleteMapping("/{crateId}/album/{albumId}")
    @SpotifyAuthorization
    public Crate removeAlbumFromCrate(final @PathVariable Long crateId,
                                      final @PathVariable Long albumId) {
        return crateDecorator.decorate(
                crateMapper.map(crateService.removeAlbum(crateId, albumId)));
    }

    @Override
    @PutMapping("/{id}")
    @SpotifyAuthorization
    public Crate updateCrate(final @PathVariable Long id, final @RequestBody @Validated Crate crate) {
        log.info("request received to update crate: {}", id);
        return crateMapper.map(
                crateService.updateCrate(id, crateMapper.map(crate)));
    }
}
