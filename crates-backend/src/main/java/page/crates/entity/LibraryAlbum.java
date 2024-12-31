package page.crates.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import page.crates.entity.enums.State;
import page.crates.util.JsonToString;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "library_album")
public class LibraryAlbum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "album_id")
    private Album album;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "spotify_user_id")
    private SpotifyUser spotifyUser;
    @Column(name = "state", nullable = false)
    @Enumerated(EnumType.STRING)
    private State state;
    @Column(name = "added_at", nullable = false)
    private Instant addedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "archived_at")
    private Instant archivedAt;
    @Column(name = "crated")
    private boolean crated;

    @Override
    public String toString() {
        return JsonToString.write(this);
    }
}
