package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal crate info for listing user's crates
 * Token-efficient representation for AI to browse existing crates
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrateListItem {
    private String crateId;
    private String name;
    private String description;
    private boolean isPublic;
    private int albumCount;
}