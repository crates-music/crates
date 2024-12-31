package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.util.List;

public class FollowRequest implements Serializable {
    private static final long serialVersionUID = 2037483222457648590L;
    @JsonProperty("ids")
    private final List<String> ids;

    @JsonCreator
    public FollowRequest(final @JsonProperty("ids") List<String> ids) {
        this.ids = ids;
    }

    public List<String> getIds() {
        return ids;
    }
}
