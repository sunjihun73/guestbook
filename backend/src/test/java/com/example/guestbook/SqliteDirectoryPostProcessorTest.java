package com.example.guestbook;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;

class SqliteDirectoryPostProcessorTest {

    private final SqliteDirectoryPostProcessor processor = new SqliteDirectoryPostProcessor();

    @Test
    void createsMissingParentDirectoryOfSqliteFile(@TempDir Path tmp) {
        Path dbFile = tmp.resolve("missing").resolve("nested").resolve("guestbook.db");
        MockEnvironment env = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:sqlite:" + dbFile);

        processor.postProcessEnvironment(env, null);

        assertThat(dbFile.getParent()).isDirectory();
    }

    @Test
    void ignoresInMemoryAndNonSqliteUrls(@TempDir Path tmp) throws IOException {
        processor.postProcessEnvironment(
                new MockEnvironment().withProperty("spring.datasource.url", "jdbc:sqlite::memory:"), null);
        processor.postProcessEnvironment(
                new MockEnvironment().withProperty("spring.datasource.url", "jdbc:h2:mem:test"), null);
        processor.postProcessEnvironment(new MockEnvironment(), null);

        try (var entries = Files.list(tmp)) {
            assertThat(entries).isEmpty();
        }
    }
}
