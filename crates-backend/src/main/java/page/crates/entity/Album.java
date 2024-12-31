package page.crates.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "album",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_album_spotify_id",
                columnNames = "spotify_id"))
public class Album {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false)
    private Long id;
    @Column(name = "spotify_id", nullable = false)
    private String spotifyId;
    @Column(name = "upc")
    private String upc;
    @Column(name = "href", nullable = false)
    private String href;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "popularity", nullable = false)
    private int popularity;
    private Instant releaseDate;
    @ManyToMany
    @JoinTable(name = "album_to_artist",
            joinColumns = @JoinColumn(name = "album_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "artist_id", nullable = false))
    private Set<Artist> artists;
    @ManyToMany
    @JoinTable(name = "album_to_image",
            joinColumns = @JoinColumn(name = "album_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "image_id", nullable = false))
    private Set<Image> images;

    @ManyToMany
    @JoinTable(name = "album_to_genre",
            joinColumns = @JoinColumn(name = "album_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "genre_id", nullable = false))
    private Set<Genre> genres;
}
