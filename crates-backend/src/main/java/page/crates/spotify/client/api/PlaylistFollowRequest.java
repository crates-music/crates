package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public class PlaylistFollowRequest implements Serializable {
    private static final long serialVersionUID = -5427428991393337354L;
    @JsonProperty("public")
    private final boolean isPublic;

    @JsonCreator
    public PlaylistFollowRequest(final @JsonProperty("public") boolean isPublic) {
        this.isPublic = isPublic;
    }

    public boolean isPublic() {
        return isPublic;
    }
}
