package page.crates.service;

import org.springframework.stereotype.Service;
import page.crates.entity.Genre;
import page.crates.repository.GenreRepository;

import jakarta.annotation.Resource;

@Service
public class GenreServiceImpl implements GenreService {
    @Resource
    private GenreRepository genreRepository;

    @Override
    public Genre findOrCreate(Genre genre) {
        final Genre existing = genreRepository.findOneByName(genre.getName());
        if (null != existing) {
            return existing;
        }
        return genreRepository.save(genre);
    }
}
