package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request to create a crate with albums in one operation
 * Consolidates crate creation and album addition to reduce API calls
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCrateWithAlbumsRequest {
    private String name;
    private String description;
    private boolean isPublic;
    private List<SimpleAlbumReference> albums;
}