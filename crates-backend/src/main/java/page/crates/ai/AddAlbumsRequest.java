package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request to add multiple albums to an existing crate
 * Uses additive semantics - albums are added to existing content
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddAlbumsRequest {
    private List<SimpleAlbumReference> albums;
}