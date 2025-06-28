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
import page.crates.entity.enums.CrateEventType;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "crate_event")
public class CrateEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private SpotifyUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crate_id")
    private Crate crate;

    @Column(name = "event_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private CrateEventType eventType;

    @Column(name = "album_ids", columnDefinition = "TEXT")
    private String albumIds; // JSON array of album IDs for bulk operations

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    // Helper method to get album IDs as List (for JSON parsing)
    public List<Long> getAlbumIdsList() {
        if (albumIds == null || albumIds.trim().isEmpty()) {
            return List.of();
        }
        // Simple JSON parsing - in production might want to use Jackson
        String cleanIds = albumIds.replaceAll("[\\[\\]\\s]", "");
        if (cleanIds.isEmpty()) {
            return List.of();
        }
        return List.of(cleanIds.split(",")).stream()
                .map(String::trim)
                .map(Long::parseLong)
                .toList();
    }
    
    // Helper method to set album IDs from List
    public void setAlbumIdsList(List<Long> albumIdsList) {
        if (albumIdsList == null || albumIdsList.isEmpty()) {
            this.albumIds = null;
        } else {
            this.albumIds = "[" + String.join(",", albumIdsList.stream().map(String::valueOf).toList()) + "]";
        }
    }
}