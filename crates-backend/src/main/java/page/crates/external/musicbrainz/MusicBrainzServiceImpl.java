package page.crates.external.musicbrainz;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import page.crates.entity.Album;
import page.crates.entity.Artist;
import page.crates.external.musicbrainz.api.MusicBrainzArtist;
import page.crates.external.musicbrainz.api.MusicBrainzReleaseGroup;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MusicBrainzServiceImpl implements MusicBrainzService {

    @Resource
    private MusicBrainzClient musicBrainzClient;

    @Value("${external.musicbrainz.user-agent:Crates/1.0 (https://crates.music)}")
    private String userAgent;

    @Override
    public List<String> getAlbumGenres(Album album) {
        try {
            // Get primary artist name
            String artistName = album.getArtists().stream()
                    .findFirst()
                    .map(Artist::getName)
                    .orElse(null);

            if (artistName == null) {
                log.warn("Album {} has no artists, cannot fetch MusicBrainz data", album.getName());
                return Collections.emptyList();
            }

            // Build query: artist AND release
            String query = String.format("artist:\"%s\" AND release:\"%s\"",
                    escapeQuery(artistName),
                    escapeQuery(album.getName()));

            MusicBrainzReleaseGroup result = musicBrainzClient.searchReleaseGroups(
                    query,
                    "json",
                    userAgent
            );

            if (result == null || CollectionUtils.isEmpty(result.getReleaseGroups())) {
                log.debug("No release groups found for album: {} by {}", album.getName(), artistName);
                return Collections.emptyList();
            }

            // Get tags from first matching release group
            MusicBrainzReleaseGroup.ReleaseGroup releaseGroup = result.getReleaseGroups().get(0);
            if (releaseGroup.getTags() == null || releaseGroup.getTags().isEmpty()) {
                return Collections.emptyList();
            }

            // Sort by count (popularity) and extract names
            return releaseGroup.getTags().stream()
                    .sorted(Comparator.comparingInt(MusicBrainzReleaseGroup.Tag::getCount).reversed())
                    .map(MusicBrainzReleaseGroup.Tag::getName)
                    .filter(name -> name != null && !name.isEmpty())
                    .limit(10)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch MusicBrainz album data for: " + album.getName(), e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<String> getArtistGenres(Artist artist) {
        try {
            String query = String.format("artist:\"%s\"", escapeQuery(artist.getName()));

            MusicBrainzArtist result = musicBrainzClient.searchArtists(
                    query,
                    "json",
                    userAgent
            );

            if (result == null || CollectionUtils.isEmpty(result.getArtists())) {
                log.debug("No artists found for: {}", artist.getName());
                return Collections.emptyList();
            }

            // Get tags from first matching artist
            MusicBrainzArtist.Artist mbArtist = result.getArtists().get(0);
            if (mbArtist.getTags() == null || mbArtist.getTags().isEmpty()) {
                return Collections.emptyList();
            }

            // Sort by count (popularity) and extract names
            return mbArtist.getTags().stream()
                    .sorted(Comparator.comparingInt(MusicBrainzArtist.Tag::getCount).reversed())
                    .map(MusicBrainzArtist.Tag::getName)
                    .filter(name -> name != null && !name.isEmpty())
                    .limit(10)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch MusicBrainz artist data for: " + artist.getName(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Escape special characters in Lucene query
     */
    private String escapeQuery(String query) {
        return query.replace("\"", "\\\"");
    }
}
