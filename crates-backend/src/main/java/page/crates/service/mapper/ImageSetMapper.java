package page.crates.service.mapper;

import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Component;
import page.crates.entity.Image;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ImageSetMapper {
    public Set<Image> map(List<page.crates.spotify.client.api.Image> images) {
        if (CollectionUtils.isEmpty(images)) {
            return Set.of();
        }
        return images.stream()
                .map(image -> {
                    final Image mapped = new Image();
                    mapped.setUrl(image.getUrl());
                    mapped.setHeight(image.getHeight());
                    mapped.setWidth(image.getWidth());
                    return mapped;
                })
                .collect(Collectors.toSet());
    }
}
