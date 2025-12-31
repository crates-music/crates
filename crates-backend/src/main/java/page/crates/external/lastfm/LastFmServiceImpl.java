package page.crates.external.lastfm;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import page.crates.entity.Album;
import page.crates.entity.Artist;
import page.crates.external.lastfm.api.LastFmAlbumInfo;
import page.crates.external.lastfm.api.LastFmArtistInfo;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LastFmServiceImpl implements LastFmService {

    @Resource
    private LastFmClient lastFmClient;

    @Value("${external.lastfm.api-key:}")
    private String apiKey;

    @Override
    public List<String> getAlbumGenres(Album album) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Last.fm API key not configured, skipping genre enrichment");
            return Collections.emptyList();
        }

        try {
            // Get primary artist name
            String artistName = album.getArtists().stream()
                    .findFirst()
                    .map(Artist::getName)
                    .orElse(null);

            if (artistName == null) {
                log.warn("Album {} has no artists, cannot fetch Last.fm data", album.getName());
                return Collections.emptyList();
            }

            LastFmAlbumInfo albumInfo = lastFmClient.getAlbumInfo(
                    "album.getinfo",
                    artistName,
                    album.getName(),
                    apiKey,
                    "json"
            );

            if (albumInfo == null || albumInfo.getAlbum() == null ||
                albumInfo.getAlbum().getTags() == null ||
                CollectionUtils.isEmpty(albumInfo.getAlbum().getTags().getTag())) {
                log.debug("No tags found for album: {} by {}", album.getName(), artistName);
                return Collections.emptyList();
            }

            return albumInfo.getAlbum().getTags().getTag().stream()
                    .map(LastFmAlbumInfo.Tag::getName)
                    .filter(name -> name != null && !name.isEmpty())
                    .limit(10) // Limit to top 10 tags
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch Last.fm album data for: " + album.getName(), e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<String> getArtistGenres(Artist artist) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Last.fm API key not configured, skipping genre enrichment");
            return Collections.emptyList();
        }

        try {
            LastFmArtistInfo artistInfo = lastFmClient.getArtistInfo(
                    "artist.getinfo",
                    artist.getName(),
                    apiKey,
                    "json"
            );

            if (artistInfo == null || artistInfo.getArtist() == null ||
                artistInfo.getArtist().getTags() == null ||
                CollectionUtils.isEmpty(artistInfo.getArtist().getTags().getTag())) {
                log.debug("No tags found for artist: {}", artist.getName());
                return Collections.emptyList();
            }

            return artistInfo.getArtist().getTags().getTag().stream()
                    .map(LastFmArtistInfo.Tag::getName)
                    .filter(name -> name != null && !name.isEmpty())
                    .limit(10) // Limit to top 10 tags
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch Last.fm artist data for: " + artist.getName(), e);
            return Collections.emptyList();
        }
    }
}
