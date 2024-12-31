package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import page.crates.entity.enums.LibraryState;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Library {
    private Long id;
    private SpotifyUser spotifyUser;
    private LibraryState state;
    private Instant createdAt;
    private Instant updatedAt;
}
