package page.crates.service;

import page.crates.entity.Genre;

public interface GenreService {
    Genre findOrCreate(Genre genre);
}
