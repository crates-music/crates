package page.crates.service;

import page.crates.entity.Artist;

public interface ArtistService {
    Artist findOrCreate(Artist artist);
}
