package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to add an album to a crate
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddAlbumRequest {
    private String spotifyAlbumId;
}