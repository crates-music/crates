package page.crates.service;

import org.springframework.stereotype.Service;
import page.crates.entity.Image;
import page.crates.repository.ImageRepository;

import jakarta.annotation.Resource;

@Service
public class ImageServiceImpl implements ImageService {
    @Resource
    private ImageRepository imageRepository;
    @Override
    public Image save(Image image) {
        return imageRepository.save(image);
    }
}
