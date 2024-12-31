package page.crates.spotify.client;


import feign.FeignException;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import page.crates.service.CurrentUserService;
import page.crates.service.UserTokenService;
import page.crates.spotify.client.api.Album;
import page.crates.spotify.client.api.Artist;
import page.crates.spotify.client.api.FollowRequest;
import page.crates.spotify.client.api.LibraryAlbum;
import page.crates.spotify.client.api.Playlist;
import page.crates.spotify.client.api.PlaylistFollowRequest;
import page.crates.spotify.client.api.Track;
import page.crates.spotify.client.api.User;

import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Slf4j
public class SpotifyImpl implements Spotify {
    @Resource
    private SpotifyClientProvider spotifyClientProvider;
    @Resource
    private UserTokenService userTokenService;
    @Resource
    private CurrentUserService currentUserService;


    @Override
    public void addAlbumsToLibrary(Context context, List<String> ids) {
        doWithRetry(ctx -> getClient(ctx).addAlbumsToLibrary(ids), context);
    }

    @Override
    public void addTracksToLibrary(Context context, List<String> ids) {
        doWithRetry(ctx -> getClient(ctx).addTracksToLibrary(ids), context);
    }

    public void doWithRetry(Consumer<Context> consumer, Context context) {
        try {
            consumer.accept(context);
        } catch (FeignException e) {
            if (e.status() == HttpStatus.UNAUTHORIZED.value()) {
                consumer.accept(refreshContext());
            }
            throw e;
        }
    }

    public <T> T executeWithRetry(Function<Context, T> function, Context context) {
        try {
            return function.apply(context);
        } catch (FeignException e) {
            if (e.status() == HttpStatus.UNAUTHORIZED.value()) {
                return function.apply(refreshContext());
            }
            throw e;
        }
    }

    @Override
    public void followArtists(Context context, List<String> ids) {
        doWithRetry(ctx -> getClient(ctx).followEntity("artist", new FollowRequest(ids)), context);
    }

    @Override
    public void followPlaylist(Context context, String id) {
        doWithRetry(ctx -> getClient(ctx).followPlaylist(id, new PlaylistFollowRequest(true)), context);
    }

    @Override
    public void followUsers(Context context, List<String> ids) {
        doWithRetry(ctx -> getClient(context).followEntity("user", new FollowRequest(ids)), context);
    }

    @Override
    public Album getAlbum(Context context, String id) {
        return executeWithRetry((ctx) -> getClient(ctx).getAlbum(id), context);
    }

    @Override
    public Artist getArtist(Context context, String id) {
        return executeWithRetry((ctx) -> getClient(context).getArtist(id), context);
    }




    private SpotifyClient getClient(final Context context) {
        return spotifyClientProvider.get(context);
    }

    @Override
    public User getCurrentUser(Context context) {
        return executeWithRetry((ctx) -> getClient(ctx).getCurrentUser(), context);
    }

    @Override
    public Playlist getPlaylist(Context context, String id) {
        return executeWithRetry((ctx) -> getClient(ctx).getPlaylist(id), context);
    }

    @Override
    public Page<Album> getSavedAlbums(Context context, Pageable pageable) {
        return executeWithRetry((ctx) -> {
            final page.crates.spotify.client.api.Page<LibraryAlbum> albumPage = getClient(ctx)
                    .getSavedAlbums(
                            pageable.getPageSize() * pageable.getPageNumber(),
                            pageable.getPageSize());
            return new PageImpl<>(
                    albumPage.getItems()
                            .stream()
                            .map(LibraryAlbum::album)
                            .collect(Collectors.toList()),
                    pageable,
                    albumPage.getTotal());
        }, context);
    }

    @Override
    public Page<LibraryAlbum> getSavedLibraryAlbums(Context context, Pageable pageable) {
        return executeWithRetry((ctx) -> {
            final page.crates.spotify.client.api.Page<LibraryAlbum> albumPage = getClient(ctx)
                    .getSavedAlbums(
                            pageable.getPageSize() * pageable.getPageNumber(),
                            pageable.getPageSize());
            return new PageImpl<>(
                    albumPage.getItems(),
                    pageable,
                    albumPage.getTotal());
        }, context);
    }

    @Override
    public Track getTrack(Context context, String id) {
        return executeWithRetry((ctx) -> getClient(ctx).getTrack(id), context);
    }

    @Override
    public List<Boolean> libraryContainsAlbums(Context context, List<String> ids) {
        return executeWithRetry((ctx) -> getClient(ctx)
                        .libraryContainsAlbums(null == ids ? null : String.join(",", ids)),
                context);
    }

    private Context refreshContext() {
        userTokenService.refreshToken();
        return Context.forToken(currentUserService.getCurrentUser().getToken().getAccessToken());
    }

    @Override
    public Page<Album> searchAlbums(final Context context,
                                    final String query,
                                    final Pageable pageable) {
        return executeWithRetry((ctx) -> {
            final page.crates.spotify.client.api.Page<Album> albumPage = getClient(ctx)
                    .search(query, "album", pageable.getPageSize() * pageable.getPageNumber(), pageable.getPageSize())
                    .getAlbums();
            return new PageImpl<>(albumPage.getItems(), pageable, albumPage.getTotal());
        }, context);
    }
}
