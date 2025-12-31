package page.crates.external.musicbrainz.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MusicBrainzArtist {
    private List<Artist> artists;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Artist {
        private String id;
        private String name;
        private List<Tag> tags;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Tag {
        private String name;
        private int count;
    }
}
