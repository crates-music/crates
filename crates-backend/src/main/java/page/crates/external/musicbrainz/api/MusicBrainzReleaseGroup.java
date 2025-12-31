package page.crates.external.musicbrainz.api;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MusicBrainzReleaseGroup {
    @JsonProperty("release-groups")
    private List<ReleaseGroup> releaseGroups;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ReleaseGroup {
        private String id;
        private String title;
        private List<Tag> tags;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Tag {
        private String name;
        private int count;
    }
}
