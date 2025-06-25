package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import page.crates.entity.enums.CrateState;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Crate {
    private Long id;
    private String name;
    private String handle;
    private Instant createdAt;
    private Instant updatedAt;
    private CrateState state;
    private String imageUri;
    private Boolean publicCrate;
    private PublicUser user;
}
