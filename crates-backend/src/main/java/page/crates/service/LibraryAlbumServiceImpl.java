package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import page.crates.entity.Album;
import page.crates.entity.LibraryAlbum;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.State;
import page.crates.repository.LibraryAlbumRepository;
import page.crates.util.SystemTimeFacade;

import java.time.Instant;

@Service
@Slf4j
public class LibraryAlbumServiceImpl implements LibraryAlbumService {
    @Resource
    private LibraryAlbumRepository libraryAlbumRepository;
    @Resource
    private SystemTimeFacade systemTimeFacade;

    @Override
    public LibraryAlbum create(Album album, SpotifyUser spotifyUser, Instant addedAt) {
        final LibraryAlbum libraryAlbum = libraryAlbumRepository.save(
                LibraryAlbum.builder()
                        .createdAt(systemTimeFacade.now())
                        .album(album)
                        .spotifyUser(spotifyUser)
                        .addedAt(addedAt)
                        .state(State.ACTIVE)
                        .build());
        log.info("created library album -- {}", libraryAlbum);
        return libraryAlbum;
    }

    @Override
    public LibraryAlbum findByAlbumAndUser(Album album, SpotifyUser spotifyUser) {
        return libraryAlbumRepository.findOneByAlbumAndSpotifyUser(album, spotifyUser)
                .orElse(null);
    }

    @Override
    public Page<LibraryAlbum> findByUser(SpotifyUser spotifyUser, Pageable pageable) {
        return libraryAlbumRepository.findActiveBySpotifyUser(spotifyUser, pageable);
    }

    @Override
    public void markCrated(Album album, SpotifyUser spotifyUser) {
        libraryAlbumRepository.findOneByAlbumAndSpotifyUser(album, spotifyUser)
                .ifPresent(libraryAlbum -> {
                    libraryAlbum.setCrated(true);
                    LibraryAlbum saved = libraryAlbumRepository.save(libraryAlbum);
                    log.info("marked library album crated -- {}", saved);
                });
    }

    @Override
    public LibraryAlbum save(LibraryAlbum libraryAlbum) {
        return libraryAlbumRepository.save(libraryAlbum);
    }
}
