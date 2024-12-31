package page.crates.controller.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Artist {
    private Long id;
    private String spotifyId;
    private String spotifyUri;
    private String name;
    private int popularity;
    private Set<Genre> genres;
    private Set<Image> images;
}
