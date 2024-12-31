package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.time.Instant;

public record LibraryAlbum(Album album,
                           @JsonProperty("added_at")
                           Instant addedAt) implements Serializable {
}
