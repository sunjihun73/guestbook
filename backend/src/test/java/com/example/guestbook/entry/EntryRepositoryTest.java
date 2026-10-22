package com.example.guestbook.entry;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.TestPropertySource;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:sqlite:build/test-repository.db",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class EntryRepositoryTest {

    private static final PageRequest FIRST_PAGE =
            PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

    @Autowired
    EntryRepository repository;

    @Test
    void findByNameContaining_returnsNewestFirst() {
        for (int i = 1; i <= 25; i++) {
            repository.save(new Entry("민수", "메시지 " + i));
        }

        Page<Entry> page = repository.findByNameContaining("민수", FIRST_PAGE);

        assertThat(page.getContent()).hasSize(20);
        assertThat(page.getTotalElements()).isEqualTo(25);
        assertThat(page.getContent().get(0).getMessage()).isEqualTo("메시지 25");
    }

    @Test
    void findByNameContaining_matchesPartialName() {
        repository.save(new Entry("김민수", "안녕"));
        repository.save(new Entry("이영희", "안녕"));

        Page<Entry> page = repository.findByNameContaining("민수", FIRST_PAGE);

        assertThat(page.getContent()).extracting(Entry::getName).containsExactly("김민수");
    }

    @Test
    void findByNameContaining_treatsPercentAndUnderscoreLiterally() {
        repository.save(new Entry("100%", "퍼센트"));
        repository.save(new Entry("abc", "에이비씨"));

        assertThat(repository.findByNameContaining("%", FIRST_PAGE).getContent())
                .extracting(Entry::getName).containsExactly("100%");
        assertThat(repository.findByNameContaining("_", FIRST_PAGE).getContent()).isEmpty();
    }
}
