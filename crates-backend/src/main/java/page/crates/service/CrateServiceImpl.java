package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.controller.AlbumList;
import page.crates.controller.api.mapper.AlbumMapper;
import page.crates.entity.Album;
import page.crates.entity.Crate;
import page.crates.entity.CrateAlbum;
import page.crates.entity.enums.CrateState;
import page.crates.exception.CrateNotFoundException;
import page.crates.repository.CrateAlbumRepository;
import page.crates.repository.CrateRepository;
import page.crates.util.SystemTimeFacade;

@Service
@Slf4j
public class CrateServiceImpl implements CrateService {
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private CrateRepository crateRepository;
    @Resource
    private CrateAlbumRepository crateAlbumRepository;
    @Resource
    private AlbumService albumService;
    @Resource
    private AccessService accessService;
    @Resource
    private SystemTimeFacade systemTimeFacade;
    @Resource
    private AlbumMapper albumMapper;
    @Resource
    private HandleService handleService;
    @Resource
    private LibraryAlbumService libraryAlbumService;


    @Override
    @Transactional
    public Crate addAlbum(Long crateId, String spotifyAlbumId) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        final Album album = albumService.findOrCreate(spotifyAlbumId);

        final CrateAlbum crateAlbum = crateAlbumRepository.save(
                CrateAlbum.builder()
                        .album(album)
                        .crate(crate)
                        .createdAt(systemTimeFacade.now())
                        .build());

        log.info("added album {} to crate: {} -- {}", album.getId(), crate.getId(), crateAlbum);
        crate.setUpdatedAt(systemTimeFacade.now());
        return crateRepository.save(crate);
    }

    @Override
    @Transactional
    public Crate addAlbums(Long crateId, AlbumList albumList) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        albumList.albums().forEach(incomingAlbum -> {
            final Album album = albumService.findOrCreate(albumMapper.map(incomingAlbum));
            final CrateAlbum crateAlbum = crateAlbumRepository.save(
                    CrateAlbum.builder()
                            .album(album)
                            .crate(crate)
                            .createdAt(systemTimeFacade.now())
                            .build());
            log.info("added album {} to crate: {} -- {}", album.getId(), crate.getId(), crateAlbum);
            libraryAlbumService.markCrated(album, crate.getUser());
        });
        crate.setUpdatedAt(systemTimeFacade.now());
        return crateRepository.save(crate);
    }

    @Override
    @Transactional
    public void archive(Long crateId) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        crate.setState(CrateState.ARCHIVED);
        crateRepository.save(crate);
        log.info("archived crate {}", crateId);
    }

    @Override
    @Transactional
    public Crate create(Crate crate) {
        crate.setUser(currentUserService.getCurrentUser());
        crate.setCreatedAt(systemTimeFacade.now());
        crate.setUpdatedAt(systemTimeFacade.now());
        crate.setHandle(handleService.handelize(crate.getName()));
        crate.setState(CrateState.ACTIVE);
        return crateRepository.save(crate);
    }

    @Override
    public Page<Crate> findActive(Pageable pageable) {
        return crateRepository.findActiveByUser(currentUserService.getCurrentUser(), pageable);
    }

    @Override
    public Page<CrateAlbum> getAlbums(Long crateId, Pageable pageable) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        return crateAlbumRepository.findActiveByCrate(crate, pageable);
    }

    @Override
    public Crate getCrate(Long id) {
        final Crate crate = crateRepository.findById(id)
                .orElseThrow(() -> new CrateNotFoundException(id));
        accessService.assertAccess(crate);
        return crate;
    }

    @Override
    @Transactional
    public Crate removeAlbum(Long crateId, Long albumId) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        crateAlbumRepository.deleteByCrateIdAndAlbumId(crateId, albumId);
        log.info("removed album: {} from crate: {}", albumId, crateId);
        final Crate updated = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        updated.setUpdatedAt(systemTimeFacade.now());
        return crateRepository.save(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> searchActive(String search, Pageable pageable) {
        return crateRepository.findActiveByUserAndNameLike(currentUserService.getCurrentUser(), search, pageable);
    }

    @Override
    public Page<CrateAlbum> searchAlbums(Long crateId, String search, Pageable pageable) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        return crateAlbumRepository.findActiveByCrateAndSearch(crate, search, pageable);
    }

    @Override
    @Transactional
    public Crate updateCrate(Long crateId, Crate crateUpdate) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        
        if (crateUpdate.getName() != null) {
            crate.setName(crateUpdate.getName());
        }
        if (crateUpdate.getPublicCrate() != null) {
            crate.setPublicCrate(crateUpdate.getPublicCrate());
        }
        
        crate.setUpdatedAt(systemTimeFacade.now());
        return crateRepository.save(crate);
    }
}
