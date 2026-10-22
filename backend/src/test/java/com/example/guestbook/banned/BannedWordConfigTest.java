package com.example.guestbook.banned;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/** Loads the real application.yml (only the database is redirected) to prove the shipped config works. */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:sqlite:build/test-config.db",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class BannedWordConfigTest {

    @Autowired
    BannedWordFilter filter;

    @Test
    void shippedApplicationYmlProvidesBannedWords() {
        assertThat(filter.containsBannedWord("이건 욕설 입니다")).isTrue();
        assertThat(filter.containsBannedWord("좋은 하루")).isFalse();
    }
}
