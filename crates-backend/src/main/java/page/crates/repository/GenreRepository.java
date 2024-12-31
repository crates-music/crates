package page.crates.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import page.crates.entity.Genre;

@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {
    Genre findOneByName(String name);
}
