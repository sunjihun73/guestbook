package com.example.guestbook.banned;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class BannedWordFilterTest {

    private final BannedWordFilter filter = new BannedWordFilter(List.of("badword", "욕설"));

    @Test
    void detectsBannedWordInsideText() {
        assertThat(filter.containsBannedWord("this has badword inside")).isTrue();
        assertThat(filter.containsBannedWord("좋은 하루")).isFalse();
    }

    @Test
    void ignoresCase() {
        assertThat(filter.containsBannedWord("BadWord")).isTrue();
    }

    @Test
    void detectsWordsSplitByWhitespace() {
        assertThat(filter.containsBannedWord("b a d w o r d")).isTrue();
        assertThat(filter.containsBannedWord("욕 설")).isTrue();
    }

    @Test
    void nullAndEmptyAreNotBanned() {
        assertThat(filter.containsBannedWord(null)).isFalse();
        assertThat(filter.containsBannedWord("")).isFalse();
    }

    @Test
    void blankBannedWordDoesNotMatchEverything() {
        BannedWordFilter withBlank = new BannedWordFilter(List.of("", "  "));
        assertThat(withBlank.containsBannedWord("아무 말")).isFalse();
    }
}
