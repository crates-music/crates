package page.crates.service;


import jakarta.annotation.Resource;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import page.crates.controller.api.Crate;
import page.crates.entity.CrateAlbum;
import page.crates.entity.Image;
import page.crates.repository.CrateAlbumRepository;

import java.util.Comparator;

@Component
public class CrateDecoratorImpl implements CrateDecorator {
    @Resource
    private CrateAlbumRepository crateAlbumRepository;

    @Override
    public Crate decorate(Crate crate) {
        final Page<CrateAlbum> albumPage = crateAlbumRepository.findActiveByCrateId(
                crate.getId(), PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")));
        if (null == albumPage || albumPage.isEmpty()) {
            return crate;
        }
        crate.setImageUri(CollectionUtils.emptyIfNull(
                        albumPage.getContent().get(0).getAlbum().getImages())
                .stream()
                .sorted(Comparator.comparing(Image::getWidth).reversed())
                .map(Image::getUrl)
                .findFirst()
                .orElse(null));
        return crate;
    }
}
