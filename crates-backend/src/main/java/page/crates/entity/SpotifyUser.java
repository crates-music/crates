package page.crates.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Entity
@Table(name = "spotify_user", uniqueConstraints = {
        @UniqueConstraint(name = "uk_spotify_user_spotify_id", columnNames = "spotify_id"),
})
public class SpotifyUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false)
    private Long id;
    @Column(name = "spotify_id", nullable = false, unique = true)
    private String spotifyId;
    @Column
    private String country;
    @Column(name = "href", nullable = false)
    private String href;
    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "email")
    private String email;

    @Column(name = "email_opt_in", nullable = false)
    @Builder.Default
    private boolean emailOptIn = false;

    @Column(name = "handle", length = 64)
    private String handle;

    @Column(name = "bio", length = 280)
    private String bio;

    @Column(name = "private_profile", nullable = false)
    @Builder.Default
    private boolean privateProfile = false;

    @Column(name = "spotify_uri", nullable = false)
    private String spotifyUri;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "token_id")
    @JsonIgnore // hide this from logs
    private Token token;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "spotify_user_to_image",
            joinColumns = @JoinColumn(name = "spotify_user_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "image_id", nullable = false))
    private Set<Image> images;
}
