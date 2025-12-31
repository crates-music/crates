package page.crates.external.lastfm.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LastFmAlbumInfo {
    @JsonProperty("album")
    private Album album;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Album {
        private String name;
        private String artist;
        private Tags tags;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Tags {
        private List<Tag> tag;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Tag {
        private String name;
    }
}
