package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import page.crates.entity.Token;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {
}
