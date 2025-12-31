package page.crates.external.musicbrainz;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import page.crates.external.musicbrainz.api.MusicBrainzArtist;
import page.crates.external.musicbrainz.api.MusicBrainzReleaseGroup;

@FeignClient(name = "musicbrainz-client", url = "${external.musicbrainz.base-url:https://musicbrainz.org/ws/2}")
public interface MusicBrainzClient {

    /**
     * Search for release groups (albums) by artist and title
     * @param query Lucene query string
     * @param userAgent User agent (required by MusicBrainz)
     * @return Release groups matching query
     */
    @RequestMapping(value = "/release-group", method = RequestMethod.GET)
    MusicBrainzReleaseGroup searchReleaseGroups(
            @RequestParam("query") String query,
            @RequestParam("fmt") String format,
            @RequestHeader("User-Agent") String userAgent
    );

    /**
     * Search for artists by name
     * @param query Lucene query string
     * @param userAgent User agent (required by MusicBrainz)
     * @return Artists matching query
     */
    @RequestMapping(value = "/artist", method = RequestMethod.GET)
    MusicBrainzArtist searchArtists(
            @RequestParam("query") String query,
            @RequestParam("fmt") String format,
            @RequestHeader("User-Agent") String userAgent
    );
}
