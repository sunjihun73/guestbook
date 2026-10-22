package com.example.guestbook.banned;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class BannedWordFilterUnicodeTest {

    private final BannedWordFilter filter = new BannedWordFilter(List.of("badword", "욕설"));

    @Test
    void detectsWordSplitByTab() {
        assertThat(filter.containsBannedWord("bad\tword")).isTrue();
    }

    @Test
    void detectsWordSplitByFullWidthSpace() {
        assertThat(filter.containsBannedWord("욕　설")).isTrue();
    }

    @Test
    void detectsWordSplitByNoBreakSpace() {
        assertThat(filter.containsBannedWord("bad word")).isTrue();
    }

    @Test
    void detectsWordSplitByZeroWidthCharacters() {
        assertThat(filter.containsBannedWord("bad​word")).isTrue();
        assertThat(filter.containsBannedWord("욕﻿설")).isTrue();
    }
}
