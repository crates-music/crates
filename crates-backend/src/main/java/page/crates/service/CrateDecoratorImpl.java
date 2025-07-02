package page.crates.service;


import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import page.crates.controller.api.Crate;
import page.crates.entity.CrateAlbum;
import page.crates.entity.Image;
import page.crates.entity.SpotifyUser;
import page.crates.repository.CrateAlbumRepository;
import page.crates.repository.CrateRepository;

import java.util.Comparator;

@Component
@Slf4j
public class CrateDecoratorImpl implements CrateDecorator {
    @Resource
    private CrateAlbumRepository crateAlbumRepository;
    @Resource
    private CrateRepository crateRepository;
    @Resource
    private CrateCollectionService crateCollectionService;
    @Resource
    private CurrentUserService currentUserService;

    @Override
    public Crate decorate(Crate crate) {
        // Get album count for this crate
        long albumCount = crateAlbumRepository.countActiveByCrateId(crate.getId());
        crate.setAlbumCount((int) albumCount);
        
        // Set image URI from album images
        final Page<CrateAlbum> albumPage = crateAlbumRepository.findActiveByCrateId(
                crate.getId(), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")));
        if (null != albumPage && !albumPage.isEmpty()) {
            crate.setImageUri(CollectionUtils.emptyIfNull(
                            albumPage.getContent().get(0).getAlbum().getImages())
                    .stream()
                    .sorted(Comparator.comparing(Image::getWidth).reversed())
                    .map(Image::getUrl)
                    .findFirst()
                    .orElse(null));
        }
        
        // Set collector count (follower count)
        page.crates.entity.Crate crateEntity = crateRepository.findById(crate.getId()).orElse(null);
        if (crateEntity != null) {
            Long collectorCount = crateCollectionService.getCrateFollowerCount(crateEntity);
            crate.setFollowerCount(collectorCount.intValue());
        }
        
        // Set collection status for current user
        try {
            SpotifyUser currentUser = currentUserService.getCurrentUser();
            if (currentUser != null && crateEntity != null) {
                boolean collected = crateCollectionService.isInCollection(currentUser, crateEntity);
                crate.setCollected(collected);
            }
        } catch (Exception e) {
            // If there's no current user or any authentication issues, default to false
            log.warn("Failed to determine collection status for crate {}: {}", crate.getId(), e.getMessage());
            crate.setCollected(false);
        }
        
        return crate;
    }
}
