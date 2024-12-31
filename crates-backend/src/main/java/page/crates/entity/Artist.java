package page.crates.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "artist",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_artist_spotify_id",
                columnNames = "spotify_id"))
public class Artist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false)
    private Long id;
    @Column(name = "spotify_id", nullable = false)
    private String spotifyId;
    @Column(name = "spotify_uri", nullable = false)
    private String spotifyUri;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "popularity", nullable = false)
    private int popularity;
    @ManyToMany
    @JoinTable(name = "artist_to_genre",
            joinColumns = @JoinColumn(name = "artist_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "genre_id", nullable = false))
    private Set<Genre> genres;
    @OneToMany
    @JoinTable(name = "artist_to_image",
            joinColumns = @JoinColumn(name = "artist_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "image_id", nullable = false))
    private Set<Image> images;
}
