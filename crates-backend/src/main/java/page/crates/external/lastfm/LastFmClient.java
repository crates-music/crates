package page.crates.external.lastfm;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import page.crates.external.lastfm.api.LastFmAlbumInfo;
import page.crates.external.lastfm.api.LastFmArtistInfo;

@FeignClient(name = "lastfm-client", url = "${external.lastfm.base-url:https://ws.audioscrobbler.com/2.0/}")
public interface LastFmClient {

    /**
     * Get album info including tags/genres
     * @param artist Artist name
     * @param album Album name
     * @param apiKey Last.fm API key
     * @return Album info with tags
     */
    @RequestMapping(method = RequestMethod.GET)
    LastFmAlbumInfo getAlbumInfo(
            @RequestParam("method") String method,
            @RequestParam("artist") String artist,
            @RequestParam("album") String album,
            @RequestParam("api_key") String apiKey,
            @RequestParam("format") String format
    );

    /**
     * Get artist info including tags/genres
     * @param artist Artist name
     * @param apiKey Last.fm API key
     * @return Artist info with tags
     */
    @RequestMapping(method = RequestMethod.GET)
    LastFmArtistInfo getArtistInfo(
            @RequestParam("method") String method,
            @RequestParam("artist") String artist,
            @RequestParam("api_key") String apiKey,
            @RequestParam("format") String format
    );
}
