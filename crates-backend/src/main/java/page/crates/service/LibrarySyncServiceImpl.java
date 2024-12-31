package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Library;
import page.crates.entity.SpotifyUser;
import page.crates.entity.enums.LibraryState;
import page.crates.service.enums.LibrarySyncOption;
import page.crates.spotify.client.Context;
import page.crates.spotify.client.Spotify;
import page.crates.spotify.client.api.LibraryAlbum;
import page.crates.util.SystemTimeFacade;

import java.util.Arrays;

@Service
@Slf4j
public class LibrarySyncServiceImpl implements LibrarySyncService {
    @Resource
    private CurrentUserService currentUserService;
    @Resource
    private LibraryService libraryService;
    @Resource
    private Spotify spotify;
    @Resource
    private LibraryAlbumService libraryAlbumService;
    @Resource
    private SystemTimeFacade systemTimeFacade;
    @Resource
    private LibraryPageSyncService libraryPageSyncService;

    private LibraryState getFailedState(LibrarySyncOption[] options) {
        if (null == options || options.length == 0) {
            return LibraryState.UPDATE_FAILED;
        }
        if (options[0] == LibrarySyncOption.FIRST_SYNC) {
            return LibraryState.IMPORT_FAILED;
        }
        return LibraryState.UPDATE_FAILED;
    }

    private LibraryState getInProgressState(LibrarySyncOption[] options) {
        if (null == options || options.length == 0) {
            return LibraryState.UPDATING;
        }
        if (options[0] == LibrarySyncOption.FIRST_SYNC) {
            return LibraryState.IMPORTING;
        }
        return LibraryState.UPDATING;
    }

    private LibraryState getSuccessState(LibrarySyncOption[] options) {
        if (null == options || options.length == 0) {
            return LibraryState.UPDATED;
        }
        if (options[0] == LibrarySyncOption.FIRST_SYNC) {
            return LibraryState.IMPORTED;
        }
        return LibraryState.UPDATED;
    }

    @Override
    @Transactional
    public Library markSyncInProgress(LibrarySyncOption... options) {
        final SpotifyUser user = currentUserService.getCurrentUser();
        final Library library = libraryService.findOrCreateLibrary(user);
        library.setState(getInProgressState(options));
        return libraryService.save(library);
    }

    @Override
    public Library synchronize(LibrarySyncOption... options) {
        final SpotifyUser user = currentUserService.getCurrentUser();
        Library library = libraryService.findOrCreateLibrary(user);
        final Context context = Context.forToken(user.getToken().getAccessToken());
        try {
            // first remove stuff that's getting nuked.
            if (ArrayUtils.isEmpty(options) || !Arrays.asList(options).contains(LibrarySyncOption.FIRST_SYNC)) {
                Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
                Page<page.crates.entity.LibraryAlbum> libraryAlbumPage;
                do {
                    libraryAlbumPage = libraryAlbumService.findByUser(user, pageable);
                    libraryPageSyncService.processRemovals(libraryAlbumPage, user, context);
                    pageable = pageable.next();
                } while (libraryAlbumPage.hasNext());
            }
            // then do the slow part
            Pageable pageable = PageRequest.of(0, 25);
            Page<LibraryAlbum> albumPage;
            boolean albumAdded;
            do {
                albumPage = spotify.getSavedLibraryAlbums(context, pageable);
                albumAdded = libraryPageSyncService.processPage(albumPage, user, library);
                pageable = pageable.next();
            } while (albumAdded && albumPage.hasNext());
        } catch (Exception e) {
            log.error("failed to synchronize library for user {} -- {}: {}",
                      user.getSpotifyId(), e.getClass().getName(), e.getMessage(), e);
            library.setState(getFailedState(options));
            library = libraryService.save(library);
            return library;
        }
        library.setState(getSuccessState(options));
        library.setUpdatedAt(systemTimeFacade.now());
        library = libraryService.save(library);
        return library;
    }
}
