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
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.CrateState;
import page.crates.exception.CrateNotFoundException;
import page.crates.repository.CrateAlbumRepository;
import page.crates.repository.CrateRepository;
import page.crates.util.SystemTimeFacade;

import java.util.List;
import java.util.stream.Collectors;

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
    @Resource
    private CrateEventService crateEventService;


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
        Crate savedCrate = crateRepository.save(crate);
        
        // Fire event if crate is public
        if (crate.isPublicCrate()) {
            crateEventService.recordAlbumsAdded(crate.getUser(), crate, List.of(album.getId()));
        }
        
        return savedCrate;
    }

    @Override
    @Transactional
    public Crate addAlbums(Long crateId, AlbumList albumList) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        
        List<Long> addedAlbumIds = albumList.albums().stream().map(incomingAlbum -> {
            final Album album = albumService.findOrCreate(albumMapper.map(incomingAlbum));
            final CrateAlbum crateAlbum = crateAlbumRepository.save(
                    CrateAlbum.builder()
                            .album(album)
                            .crate(crate)
                            .createdAt(systemTimeFacade.now())
                            .build());
            log.info("added album {} to crate: {} -- {}", album.getId(), crate.getId(), crateAlbum);
            libraryAlbumService.markCrated(album, crate.getUser());
            return album.getId();
        }).collect(Collectors.toList());
        
        crate.setUpdatedAt(systemTimeFacade.now());
        Crate savedCrate = crateRepository.save(crate);
        
        // Fire event if crate is public and albums were added
        if (crate.isPublicCrate() && !addedAlbumIds.isEmpty()) {
            crateEventService.recordAlbumsAdded(crate.getUser(), crate, addedAlbumIds);
        }
        
        return savedCrate;
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
        crate.setPublicCrate(true);
        crate.setFollowerCount(0);
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
        log.info("Updating crate {} with data: name={}, description={}, publicCrate={}", 
                crateId, crateUpdate.getName(), crateUpdate.getDescription(), crateUpdate.isPublicCrate());
        
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        accessService.assertAccess(crate);
        
        // Track if crate is becoming public
        boolean wasPrivate = !crate.isPublicCrate();
        
        if (crateUpdate.getName() != null) {
            crate.setName(crateUpdate.getName());
            crate.setHandle(handleService.handelize(crateUpdate.getName()));
        }
        crate.setPublicCrate(crateUpdate.isPublicCrate());
        crate.setDescription(crateUpdate.getDescription());
        
        crate.setUpdatedAt(systemTimeFacade.now());
        final Crate saved = crateRepository.save(crate);
        
        // Fire event if crate is becoming public
        if (wasPrivate && crateUpdate.isPublicCrate()) {
            crateEventService.recordCrateReleased(crate.getUser(), saved);
        }
        
        log.info("Saved crate with description: {}", saved.getDescription());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> findPublicByUser(SpotifyUser user, Pageable pageable) {
        return crateRepository.findPublicByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> searchPublicByUser(SpotifyUser user, String search, Pageable pageable) {
        return crateRepository.findPublicByUserAndNameLike(user, search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Crate findByUserAndHandle(SpotifyUser user, String handle) {
        return crateRepository.findByUserAndHandle(user, handle)
                .orElseThrow(() -> new CrateNotFoundException(handle));
    }

    @Override
    @Transactional(readOnly = true)
    public Crate findByHandle(String handle) {
        return crateRepository.findByHandle(handle)
                .orElseThrow(() -> new CrateNotFoundException(handle));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateAlbum> getPublicAlbums(Long crateId, Pageable pageable) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        // No access check for public albums - the caller should verify it's public
        return crateAlbumRepository.findActiveByCrate(crate, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CrateAlbum> searchPublicAlbums(Long crateId, String search, Pageable pageable) {
        final Crate crate = crateRepository.findById(crateId)
                .orElseThrow(() -> new CrateNotFoundException(crateId));
        // No access check for public albums - the caller should verify it's public
        return crateAlbumRepository.findActiveByCrateAndSearch(crate, search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> findAllPublic(Pageable pageable) {
        return crateRepository.findAllPublicCrates(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> searchAllPublic(String search, Pageable pageable) {
        return crateRepository.findAllPublicCratesWithSearch(search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> getUserPublicCrates(SpotifyUser user, String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return crateRepository.findPublicByUserAndNameLike(user, search, pageable);
        }
        return crateRepository.findPublicByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> findAllPublicByTrending(Pageable pageable) {
        return crateRepository.findAllPublicCratesByTrending(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Crate> searchAllPublicByTrending(String search, Pageable pageable) {
        return crateRepository.findAllPublicCratesWithUnifiedSearchByTrending(search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Crate findById(Long id) {
        return crateRepository.findById(id)
                .orElseThrow(() -> new CrateNotFoundException(id));
    }
}
