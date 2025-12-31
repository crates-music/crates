package page.crates.service;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Album;
import page.crates.entity.Artist;
import page.crates.entity.Genre;
import page.crates.repository.ArtistRepository;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class GenreEnrichmentServiceImpl implements GenreEnrichmentService {

    @Resource
    private ArtistService artistService;

    @Resource
    private ArtistRepository artistRepository;

    @Resource
    private page.crates.spotify.client.Spotify spotify;

    @Resource
    private page.crates.spotify.client.SpotifyAuth spotifyAuth;

    @Resource
    private GenreService genreService;

    @Override
    public Album enrichAlbumGenres(Album album) {
        // Trigger lazy backfill for artists without genres
        if (album.getArtists() != null) {
            Set<Artist> updatedArtists = new HashSet<>();

            for (Artist artist : album.getArtists()) {
                // Initialize genres collection to check properly
                if (artist.getGenres() == null || artist.getGenres().isEmpty()) {
                    // Backfill and get updated artist
                    Artist updated = artistService.findOrCreate(artist);
                    updatedArtists.add(updated);
                } else {
                    updatedArtists.add(artist);
                }
            }

            // Replace artists with updated versions
            album.setArtists(updatedArtists);
        }
        return album;
    }

    @Override
    @Transactional
    public Artist enrichArtistGenres(Artist artist) {
        // Trigger lazy backfill if no genres
        if (artist.getGenres() == null || artist.getGenres().isEmpty()) {
            return artistService.findOrCreate(artist);
        }
        return artist;
    }

    @Override
    @Transactional
    public Map<Long, Boolean> bulkEnrichAlbums(List<Album> albums) {
        log.info("Checking genre data for {} albums", albums.size());

        // Collect all unique artist spotify IDs
        Set<String> allArtistIds = albums.stream()
                .filter(album -> album.getArtists() != null)
                .flatMap(album -> album.getArtists().stream())
                .map(Artist::getSpotifyId)
                .collect(Collectors.toSet());

        log.info("Found {} unique artists across all albums", allArtistIds.size());

        // Check which ones ALREADY have been fetched (fast query)
        Set<String> artistsNeedingGenres = allArtistIds.stream()
                .filter(spotifyId -> !Boolean.TRUE.equals(artistRepository.hasGenresFetched(spotifyId)))
                .collect(Collectors.toSet());

        log.info("{} artists already have genres, {} need backfill",
                allArtistIds.size() - artistsNeedingGenres.size(), artistsNeedingGenres.size());

        // Backfill artists that need genres
        if (!artistsNeedingGenres.isEmpty()) {
            backfillArtistGenres(artistsNeedingGenres);
        }

        // Now reload all artists with genres
        Map<Long, Boolean> results = new HashMap<>();
        for (Album album : albums) {
            try {
                if (album.getArtists() != null) {
                    Set<Artist> reloadedArtists = album.getArtists().stream()
                            .map(Artist::getSpotifyId)
                            .map(artistRepository::findOneBySpotifyId)
                            .collect(Collectors.toSet());
                    album.setArtists(reloadedArtists);
                }
                results.put(album.getId(), true);
            } catch (Exception e) {
                log.error("Failed to process album: " + album.getName(), e);
                results.put(album.getId(), false);
            }
        }

        log.info("Backfill complete");
        return results;
    }

    private void backfillArtistGenres(Set<String> spotifyIds) {
        log.info("Backfilling genres for {} artists from Spotify", spotifyIds.size());

        String token = spotifyAuth.getServiceToken().getAccessToken();
        page.crates.spotify.client.Context context = page.crates.spotify.client.Context.forToken(token);

        int withGenres = 0;
        int noGenres = 0;
        for (String spotifyId : spotifyIds) {
            try {
                // Fetch artist from Spotify
                page.crates.spotify.client.api.Artist spotifyArtist = spotify.getArtist(context, spotifyId);

                // Load existing artist from DB
                Artist existing = artistRepository.findOneBySpotifyId(spotifyId);
                if (existing == null) {
                    continue;
                }

                // Check if Spotify has genres
                if (spotifyArtist != null && spotifyArtist.getGenres() != null && !spotifyArtist.getGenres().isEmpty()) {
                    // Has genres - add them
                    Set<Genre> genres = spotifyArtist.getGenres().stream()
                            .map(name -> Genre.builder().name(name).build())
                            .map(genreService::findOrCreate)
                            .collect(Collectors.toSet());
                    existing.setGenres(genres);
                    withGenres++;
                } else {
                    // No genres in Spotify
                    noGenres++;
                }

                // Mark as fetched regardless of whether Spotify had genres
                existing.setGenresFetched(true);
                artistRepository.save(existing);

            } catch (Exception e) {
                log.warn("Failed to backfill artist {}: {}", spotifyId, e.getMessage());
            }
        }

        log.info("Successfully backfilled {} artists with genres, {} artists have no genre data in Spotify", withGenres, noGenres);
    }

    @Override
    public boolean hasSufficientGenres(Album album) {
        return album.getGenres() != null && album.getGenres().size() >= 3;
    }
}
