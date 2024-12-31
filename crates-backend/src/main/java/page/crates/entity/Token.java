package page.crates.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import page.crates.util.EncryptionConverter;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "token")
public class Token {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "code")
    private String code;
    @Column(name = "auth_token", nullable = false)
    private String authToken;
    @Column(name = "access_token", nullable = false)
    @Convert(converter = EncryptionConverter.class)
    private String accessToken;
    @Column(name = "expiration", nullable = false)
    private Instant expiration;
    @Column(name = "refresh_token", nullable = false)
    @Convert(converter = EncryptionConverter.class)
    private String refreshToken;
}
