package com.example.guestbook;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * sqlite-jdbc does not create missing parent directories, so a fresh checkout would fail to start.
 * Creates the directory of a file-based SQLite URL before the DataSource is built.
 */
public class SqliteDirectoryPostProcessor implements EnvironmentPostProcessor {

    private static final String PREFIX = "jdbc:sqlite:";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null || !url.startsWith(PREFIX) || url.startsWith(PREFIX + ":")) {
            return;
        }
        String file = url.substring(PREFIX.length());
        int query = file.indexOf('?');
        Path parent = Path.of(query >= 0 ? file.substring(0, query) : file).toAbsolutePath().getParent();
        if (parent == null) {
            return;
        }
        try {
            Files.createDirectories(parent);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create database directory " + parent, e);
        }
    }
}
