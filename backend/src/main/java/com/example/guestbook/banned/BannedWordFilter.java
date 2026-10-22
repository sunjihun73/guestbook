package com.example.guestbook.banned;

import com.example.guestbook.text.UnicodeSpace;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BannedWordFilter {

    private final List<String> normalizedWords;

    public BannedWordFilter(@Value("${guestbook.banned-words}") List<String> words) {
        this.normalizedWords = words.stream()
                .map(BannedWordFilter::normalize)
                .filter(word -> !word.isEmpty())
                .toList();
    }

    public boolean containsBannedWord(String text) {
        if (text == null) {
            return false;
        }
        String normalized = normalize(text);
        return normalizedWords.stream().anyMatch(normalized::contains);
    }

    private static String normalize(String text) {
        return UnicodeSpace.removeAll(text.toLowerCase(Locale.ROOT));
    }
}
