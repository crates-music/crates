package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SpotifyUser {
    private Long id;
    private String spotifyId;
    private String href;
    private String displayName;
    private String email;
    private String handle;
    private String bio;
    private boolean privateProfile;
    private String spotifyUri;
    private Instant createdAt;
    private Instant updatedAt;
    private Set<Image> images;
}
