package page.crates.repository;

import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import page.crates.entity.Genre;

import jakarta.annotation.Resource;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest
@RunWith(SpringRunner.class)
@ActiveProfiles("test")
class GenreRepositoryTest {
    @Resource
    private GenreRepository genreRepository;

    @Test
    public void findByName() {
        var genre = Genre.builder()
                .name("pop")
                .build();
        genre = genreRepository.save(genre);

        var found = genreRepository.findOneByName("pop");
        assertThat(found.getId(), equalTo(genre.getId()));
    }
}