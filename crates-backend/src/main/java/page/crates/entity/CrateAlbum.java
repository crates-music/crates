package page.crates.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.builder.EqualsExclude;
import org.apache.commons.lang3.builder.HashCodeExclude;
import org.apache.commons.lang3.builder.ToStringExclude;
import page.crates.util.JsonToString;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "crate_album",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_crate_album",
                columnNames = {
                        "crate_id",
                        "album_id "
                }))
public class CrateAlbum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crate_id", nullable = false)
    @HashCodeExclude
    @EqualsExclude
    @ToStringExclude
    private Crate crate;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "album_id", nullable = false)
    @HashCodeExclude
    @EqualsExclude
    private Album album;
    @Column(name = "created_at", nullable = false)
    @HashCodeExclude
    @EqualsExclude
    private Instant createdAt;

    @Override
    public String toString() {
        return JsonToString.write(this);
    }
}
