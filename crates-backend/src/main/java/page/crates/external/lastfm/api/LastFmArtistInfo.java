package page.crates.external.lastfm.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LastFmArtistInfo {
    @JsonProperty("artist")
    private Artist artist;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Artist {
        private String name;
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
