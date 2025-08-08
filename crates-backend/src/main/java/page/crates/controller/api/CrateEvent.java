package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import page.crates.entity.enums.CrateEventType;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CrateEvent {
    private Long id;
    private SpotifyUser user;
    private Crate crate;
    private SpotifyUser followedUser;
    private CrateEventType eventType;
    private List<Long> albumIds;
    private List<Album> albums; // Album details for ALBUM_ADDED events
    private Instant createdAt;
}