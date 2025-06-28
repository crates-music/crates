package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserFollow {
    private Long id;
    private SpotifyUser follower;
    private SpotifyUser following;
    private Instant createdAt;
}