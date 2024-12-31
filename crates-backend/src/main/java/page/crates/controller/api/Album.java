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
public class Album {
    private Long id;
    private String spotifyId;
    private String upc;
    private String href;
    private String name;
    private int popularity;
    private Instant releaseDate;
    private Instant addedAt;
    private Set<Artist> artists;
    private Set<Image> images;
    private Set<Genre> genres;
}
