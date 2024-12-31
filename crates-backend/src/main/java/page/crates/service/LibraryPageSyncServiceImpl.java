package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Album;
import page.crates.entity.Library;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.LibraryState;
import page.crates.entity.enums.State;
import page.crates.repository.LibraryRepository;
import page.crates.service.mapper.SpotifyAlbumMapper;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.spotify.client.api.LibraryAlbum;
import page.crates.util.SystemTimeFacade;

import java.util.List;

@Service
@Slf4j
public class LibraryPageSyncServiceImpl implements LibraryPageSyncService {
    @Resource
    private LibraryAlbumService libraryAlbumService;
    @Resource
    private SpotifyAlbumMapper spotifyAlbumMapper;
    @Resource
    private AlbumService albumService;
    @Resource
    private Spotify spotify;
    @Resource
    private SystemTimeFacade systemTimeFacade;
    @Resource
    private LibraryRepository libraryRepository;

    @Override
    @Transactional
    public boolean processPage(final Page<LibraryAlbum> albumPage,
                            final SpotifyUser user,
                            final Library library) {
        boolean albumAdded = false;
        log.info("processing album page {} of {} for user {}",
                albumPage.getNumber() + 1, albumPage.getTotalPages(), user.getSpotifyId());
        for (LibraryAlbum spotifyLibraryAlbum : albumPage) {
            final Album album = spotifyAlbumMapper.map(spotifyLibraryAlbum.album());
            final Album persistedAlbum = albumService.findOrCreate(album);
            final page.crates.entity.LibraryAlbum libraryAlbum = libraryAlbumService.findByAlbumAndUser(
                    persistedAlbum, user);
            if (null != libraryAlbum) {
                libraryAlbum.setAddedAt(spotifyLibraryAlbum.addedAt());
                libraryAlbumService.save(libraryAlbum);
            } else {
                libraryAlbumService.create(persistedAlbum, user, spotifyLibraryAlbum.addedAt());
                albumAdded = true;
            }
        }
        if (albumPage.isFirst()) {
            library.setState(LibraryState.IMPORTING_AFTER_FIRST_PAGE);
            library.setUpdatedAt(systemTimeFacade.now());
            libraryRepository.save(library);
        }
        return albumAdded;
    }

    @Override
    @Transactional
    public void processRemovals(final Page<page.crates.entity.LibraryAlbum> libraryAlbumPage,
                                final SpotifyUser user,
                                final Context context) {
        log.info("checking existing library albums page {} of {} for user {}",
                libraryAlbumPage.getNumber(), libraryAlbumPage.getTotalPages(), user.getSpotifyId());
        List<String> ids = libraryAlbumPage.stream()
                .map(page.crates.entity.LibraryAlbum::getAlbum)
                .map(Album::getSpotifyId)
                .toList();
        if (CollectionUtils.isEmpty(ids)) {
            return;
        }
        List<Boolean> results = spotify.libraryContainsAlbums(context, ids);
        for (int i = 0; i < results.size(); i++) {
            if (!results.get(i)) {
                page.crates.entity.LibraryAlbum removedAlbum = libraryAlbumPage.getContent().get(i);
                removedAlbum.setState(State.ARCHIVED);
                removedAlbum.setArchivedAt(systemTimeFacade.now());
                final page.crates.entity.LibraryAlbum removed = libraryAlbumService.save(removedAlbum);
                log.info("removed album from library {}", removed);
            }
        }
    }
}
